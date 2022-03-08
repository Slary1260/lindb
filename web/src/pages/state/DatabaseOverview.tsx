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
import { ReplicaView, DatabaseView } from "@src/components";
import { useStorage } from "@src/hooks";
import React from "react";
import * as _ from "lodash-es";
import { URLStore } from "@src/stores";

export default function DatabaseOverview() {
  const storage = URLStore.params.get("storage");
  const db = URLStore.params.get("db");
  const { loading, storages } = useStorage(storage as string);
  return (
    <>
      <DatabaseView
        liveNodes={_.get(storages, "[0].liveNodes", {})}
        storage={_.get(storages, "[0]", {})}
        loading={loading}
      />
      {storage && (
        <div style={{ marginTop: 12 }}>
          <ReplicaView db={db as string} storage={storage as string} />
        </div>
      )}
    </>
  );
}