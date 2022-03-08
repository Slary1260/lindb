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
import React from "react";
import {
  IconComponentPlaceholderStroked,
  IconInherit,
  IconSearch,
  IconServer,
  IconTemplate,
  IconListView,
  IconServerStroked,
} from "@douyinfe/semi-icons";
import {
  StorageList,
  StorageConfig,
  DatabaseList,
  DatabaseConfig,
  Explore,
  Overview,
  StorageOverview,
  DatabaseOverview,
  DataSearch,
  ConfigurationView,
  LogView,
} from "@src/pages";
import { DashboardView } from "@src/components";
import { Route } from "@src/constants";
import * as _ from "lodash-es";
import { SystemDashboard } from "@src/configs";

export type RouteItem = {
  itemKey?: string;
  parnet?: RouteItem | null;
  text: string;
  path?: string;
  inner?: boolean;
  icon?: React.ReactNode | string;
  content?: React.FunctionComponent;
  items?: RouteItem[];
  keep?: string[]; //keep url params when change route
};

export const routes = [
  {
    text: "Overview",
    path: Route.Overview,
    icon: <IconComponentPlaceholderStroked size="large" />,
    content: <Overview />,
    items: [
      {
        inner: true,
        itemKey: "Overview/Storage",
        text: "Storage",
        path: Route.StorageOverview,
        content: <StorageOverview />,
      },
      {
        inner: true,
        itemKey: "Overview/Database",
        text: "Database",
        path: Route.DatabaseOverview,
        content: <DatabaseOverview />,
      },
      {
        inner: true,
        itemKey: "Overview/Configuration",
        text: "Configuration",
        path: Route.ConfigurationView,
        content: <ConfigurationView />,
      },
    ],
  },
  {
    text: "Search",
    path: Route.Search,
    icon: <IconSearch size="large" />,
    content: <DataSearch />,
  },
  {
    text: "Monitoring",
    items: [
      {
        text: "Log View",
        path: "/monitoring/logs",
        icon: <IconListView size="large" />,
        content: <LogView />,
      },
      {
        text: "System",
        path: "/monitoring/system",
        icon: <IconServerStroked size="large" />,
        timePicker: true,
        content: <DashboardView dashboard={SystemDashboard} />,
        keep: ["start", "end", "node"],
      },
      {
        text: "Storage",
        path: "/monitoring/storage",
        icon: <IconTemplate size="large" />,
        timePicker: true,
        content: <DashboardView dashboard={SystemDashboard} />,
        keep: ["start", "end", "node"],
      },
      {
        text: "Database",
        path: "/monitoring/databasea",
        icon: <IconServer size="large" />,
      },
    ],
  },
  {
    text: "Metadata",
    items: [
      {
        text: "Storage",
        path: Route.MetadataStorage,
        icon: <IconTemplate size="large" />,
        content: <StorageList />,
        items: [
          {
            inner: true,
            itemKey: "Metadata/Storage/Configuration",
            text: "Configuration",
            path: Route.MetadataStorageConfig,
            content: <StorageConfig />,
          },
        ],
      },
      {
        text: "Database",
        path: Route.MetadataDatabase,
        icon: <IconServer size="large" />,
        content: <DatabaseList />,
        items: [
          {
            inner: true,
            itemKey: "Metadata/Database/Configuration",
            text: "Configuration",
            path: Route.MetadataDatabaseConfig,
            content: <DatabaseConfig />,
          },
        ],
      },
      {
        text: "Explore",
        path: Route.MetadataExplore,
        icon: <IconInherit size="large" />,
        content: <Explore />,
      },
    ],
  },
] as RouteItem[];

function flattenRouters(routeItems: RouteItem[]): Map<string, RouteItem> {
  const rs = new Map<string, RouteItem>();
  const flatten = (items: RouteItem[], parent: RouteItem | null) => {
    items.map((item: RouteItem) => {
      item.parnet = parent;
      if (item.items) {
        flatten(item.items, item);
      }
      if (item.path) {
        rs.set(item.path, item);
      }
    });
  };
  flatten(routeItems, null);
  return rs;
}

function getSwithRouterList(routeItems: RouteItem[]): RouteItem[] {
  const rs: RouteItem[] = [];
  const flatten = (items: RouteItem[]) => {
    items.map((item: RouteItem) => {
      if (item.items) {
        flatten(item.items);
      }
      if (item.content) {
        rs.push(item);
      }
    });
  };
  flatten(routeItems);
  return rs;
}

function getMenuList(routeItems: RouteItem[]): RouteItem[] {
  const forEach = (items: RouteItem[]): RouteItem[] => {
    const rs: RouteItem[] = [];
    items.map((item: RouteItem) => {
      if (item.items) {
        item.items = forEach(item.items);
      }
      if (!item.inner) {
        rs.push({ ...item, itemKey: item.path });
      }
    });
    return rs;
  };
  return forEach(routeItems);
}

function getDefaultOpenKeys(menus: any[]): string[] {
  return (menus || []).reduce((pre, item) => {
    if (item.items) {
      pre.push(item.itemKey);
      const newArray: string[] = pre.concat(
        getDefaultOpenKeys(item.items) || []
      );
      return newArray;
    }
    return pre;
  }, [] as string[]);
}

export const menus = getMenuList(_.cloneDeep(routes));
export const switchRouters = getSwithRouterList(_.cloneDeep(routes));
export const defaultOpenKeys = getDefaultOpenKeys(_.cloneDeep(routes));
export const routeMap = flattenRouters(_.cloneDeep(routes));