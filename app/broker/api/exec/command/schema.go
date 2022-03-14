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

package command

import (
	"context"

	"github.com/lindb/lindb/app/broker/deps"
	"github.com/lindb/lindb/constants"
	"github.com/lindb/lindb/models"
	"github.com/lindb/lindb/pkg/encoding"
	"github.com/lindb/lindb/pkg/logger"
	"github.com/lindb/lindb/sql/stmt"
)

// ListDataBases returns database list in cluster.
func ListDataBases(ctx context.Context, deps *deps.HTTPDeps, _ *models.ExecuteParam, _ stmt.Statement) (interface{}, error) {
	data, err := deps.Repo.List(ctx, constants.DatabaseConfigPath)
	if err != nil {
		return nil, err
	}
	var dbs []*models.Database
	for _, val := range data {
		db := &models.Database{}
		err = encoding.JSONUnmarshal(val.Value, db)
		if err != nil {
			log.Warn("unmarshal data error",
				logger.String("data", string(val.Value)))
			continue
		}
		db.Desc = db.String()
		dbs = append(dbs, db)
	}
	return dbs, nil
}