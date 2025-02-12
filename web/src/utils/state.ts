/*
Licensed to LinDB under one or more contributor
license agreements. See the NOTICE file distributed with
this work for additional information regarding copyright
ownership. LinDB licenses this file to you under
the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/
import * as _ from "lodash-es";
import { StorageState } from "@src/models";
/**
 * get field value of metric by given metric name and node from internal state metric.
 *
 * @param stateMetric internal state metric
 * @param metricName metric name
 * @param field field name
 * @param node node address
 */
export function getMetricField(
  stateMetric: any,
  metricName: string,
  fieldName: string,
  node: string
): number {
  const nodesState = _.get(stateMetric, metricName, []);
  const idx = _.findIndex(nodesState, {
    tags: { node: node },
  });
  if (idx < 0) {
    return 0;
  }
  const fields = _.get(nodesState[idx], "fields", []);
  const idleIdx = _.findIndex(fields, {
    name: fieldName,
  });
  if (idleIdx < 0) {
    return 0;
  }
  return fields[idleIdx].value;
}

/**
 * get database state list
 * @param storage storage state list
 */
export function getDatabaseList(storages: StorageState[]): any[] {
  const rs: any[] = [];
  _.forEach(storages, (storage: StorageState) => {
    const databaseMap: any = _.get(storage, "shardStates", {});
    const databaseNames = _.keys(databaseMap);
    const liveNodes = _.get(storage, "liveNodes", []);
    databaseNames.map((name: string) => {
      const db = databaseMap[name];
      const stats = {
        totalReplica: 0,
        availableReplica: 0,
        unavailableReplica: 0,
        numOfShards: 0,
      };
      _.mapValues(db, function (shard: any) {
        const replicas = _.get(shard, "replica.replicas", []);
        stats.numOfShards++;
        stats.totalReplica += replicas.length;
        replicas.map((nodeId: number) => {
          if (_.has(liveNodes, nodeId)) {
            stats.availableReplica++;
          } else {
            stats.unavailableReplica++;
          }
        });
      });
      rs.push({ name: name, stats: stats, storage: storage });
    });
  });
  return rs;
}
