// Licensed to LinDB under one or more contributor
// license agreements. See the NOTICE file distributed with
// this work for additional information regarding copyright
// ownership. LinDB licenses this file to you under
// the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package replica

import (
	"time"

	"go.uber.org/atomic"

	"github.com/lindb/lindb/metrics"
	"github.com/lindb/lindb/pkg/logger"
)

//go:generate mockgen -source=./replicator_peer.go -destination=./replicator_peer_mock.go -package=replica

// ReplicatorPeer represents wal replica peer.
// local replicator: from == to.
// remote replicator: from != to.
type ReplicatorPeer interface {
	// Startup starts wal replicator channel,
	Startup()
	// Shutdown shutdowns gracefully.
	Shutdown()
}

// replicatorPeer implements ReplicatorPeer
type replicatorPeer struct {
	runner  *replicatorRunner
	running *atomic.Bool
}

// NewReplicatorPeer creates a ReplicatorPeer.
func NewReplicatorPeer(replicator Replicator) ReplicatorPeer {
	return &replicatorPeer{
		running: atomic.NewBool(false),
		runner:  newReplicatorRunner(replicator),
	}
}

// Startup starts wal replicator channel,
func (r replicatorPeer) Startup() {
	if r.running.CAS(false, true) {
		go r.runner.replicaLoop()
	}
}

// Shutdown shutdowns gracefully.
func (r replicatorPeer) Shutdown() {
	if r.running.CAS(true, false) {
		r.runner.shutdown()
	}
}

type replicatorRunner struct {
	running    *atomic.Bool
	replicator Replicator

	closed chan struct{}

	statistics *metrics.StorageReplicatorRunnerStatistics
	logger     *logger.Logger
}

func newReplicatorRunner(replicator Replicator) *replicatorRunner {
	replicaType := "local"
	_, ok := replicator.(*remoteReplicator)
	if ok {
		replicaType = "remote"
	}
	state := replicator.State()
	return &replicatorRunner{
		replicator: replicator,
		running:    atomic.NewBool(false),
		closed:     make(chan struct{}),
		statistics: metrics.NewStorageReplicatorRunnerStatistics(replicaType, state.Database, state.ShardID.String()),
		logger:     logger.GetLogger("replica", "ReplicatorRunner"),
	}
}

func (r *replicatorRunner) replicaLoop() {
	if r.running.CAS(false, true) {
		r.statistics.ActiveReplicators.Incr()
		r.loop()
	}
}

func (r *replicatorRunner) shutdown() {
	if r.running.CAS(true, false) {
		// wait for stop replica loop
		<-r.closed
	}
}

func (r *replicatorRunner) loop() {
	for r.running.Load() {
		r.replica()
	}

	// exit replica loop
	close(r.closed)

	r.statistics.ActiveReplicators.Decr()
}

func (r *replicatorRunner) replica() {
	defer func() {
		if recovered := recover(); recovered != nil {
			r.statistics.ReplicaPanics.Incr()
			r.logger.Error("panic when replica data",
				logger.Any("err", recovered),
				logger.Stack(),
			)
		}
	}()

	hasData := false

	if r.replicator.IsReady() {
		seq := r.replicator.Consume()
		if seq >= 0 {
			r.logger.Debug("replica write ahead log",
				logger.String("replicator", r.replicator.String()),
				logger.Int64("index", seq))
			hasData = true
			data, err := r.replicator.GetMessage(seq)
			if err != nil {
				r.statistics.ConsumeMessageFailures.Incr()
				r.logger.Warn("cannot get replica message data",
					logger.String("replicator", r.replicator.String()),
					logger.Int64("index", seq))
			} else {
				r.statistics.ConsumeMessage.Incr()
				r.replicator.Replica(seq, data)

				r.statistics.ReplicaBytes.Add(float64(len(data)))
			}
		}
		r.statistics.ReplicaLag.Add(float64(r.replicator.Pending()))
	} else {
		r.logger.Warn("replica is not ready", logger.String("replicator", r.replicator.String()))
	}
	if !hasData {
		// TODO add config?
		time.Sleep(10 * time.Millisecond)
	}
}
