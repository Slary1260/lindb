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

package aggregation

import (
	"math"
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"

	"github.com/lindb/lindb/aggregation/function"
	"github.com/lindb/lindb/series"
	"github.com/lindb/lindb/series/field"
)

func TestFieldAggregator_Aggregate(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	aggSpec := NewAggregatorSpec("f", field.SumField)
	aggSpec.AddFunctionType(function.Sum)

	agg := NewFieldAggregator(aggSpec, 1, 10, 20)
	ts, rs := agg.ResultSet()
	assert.Equal(t, int64(1), ts)
	assert.NotNil(t, rs)
	agg.reset()

	it := series.NewMockFieldIterator(ctrl)
	it.EXPECT().HasNext().Return(true)
	it.EXPECT().HasNext().Return(false)
	pIt := series.NewMockPrimitiveIterator(ctrl)
	it.EXPECT().Next().Return(pIt)
	pIt.EXPECT().HasNext().Return(true)
	pIt.EXPECT().Next().Return(20, 10.0)
	pIt.EXPECT().HasNext().Return(false)
	agg.Aggregate(it)

	agg.AggregateBySlot(1, math.Inf(1))
	agg.AggregateBySlot(1, 1.0)
	agg.AggregateBySlot(1, 1.0)

	agg.reset()
}
