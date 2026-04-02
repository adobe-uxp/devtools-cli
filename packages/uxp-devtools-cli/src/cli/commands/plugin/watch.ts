/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

import type { ArgumentsCamelCase, CommandModule, Options } from 'yargs';
import path from 'node:path';
import { CoreHelpers } from '@adobe-fixed-uxp/uxp-devtools-core';
import { loadPluginSessionFromUxpRc } from '../../utils/common.js';

interface WatchCommandArgs {
  path?: string;
  apps?: string;
}

interface PluginSession {
  pluginInfo: unknown;
}

interface WatchServiceInstance {
  watchPlugin: (pluginPath: string, callback: () => Promise<void>) => Promise<void>;
  stopPluginWatch: (pluginPath: string) => Promise<void>;
}

interface CliClient {
  connect: () => Promise<void>;
  disconnect: () => void;
  reloadPlugin: (session: PluginSession, params: { apps: string[] }) => Promise<void>;
}

interface CommandContext {
  app: {
    client: CliClient;
  };
}

const watchOptions: Record<string, Options> = {
  path: {
    describe: 'Relative path to plugin\'s source folder. Defaults to the current working directory.',
    demandOption: false,
  },
  apps: {
    describe: 'Space delimited list of app IDs for which the plugin should be watched. The supported app IDs can be retrieved using `uxp apps list`. The default action is to watch the plugin for all currently running apps specified in the plugin\'s manifest.',
    demandOption: false,
  },
};

let cliClientInstance: CliClient;
let params: { apps: string[] };

function setupWatchStopRequestListeners(watchServiceInstance: WatchServiceInstance, pluginPath: string): Promise<void> {
  const prom = Promise.withResolvers<void>();
  const unwatchHandler = function (): void {
    watchServiceInstance.stopPluginWatch(pluginPath).then(() => {
      cliClientInstance.disconnect();
      prom.resolve();
    });
  };

  process.on('SIGINT', unwatchHandler);
  process.on('SIGTERM', unwatchHandler);
  return prom.promise;
}

function handlePluginWatchResult(): Promise<void> {
  // Reload plugin on change.
  console.log('Plugin Contents Changed. Reloading the Plugin.');
  const pluginSession = loadPluginSessionFromUxpRc();
  const prom = cliClientInstance.reloadPlugin(pluginSession, params);
  return prom.then(() => {
    console.log('Plugin Reload Successfully.');
  }).catch((err: unknown) => {
    console.error(`${err}`);
  });
}

async function handlePluginWatchCommand(this: CommandContext, args: ArgumentsCamelCase<WatchCommandArgs>): Promise<void> {
  const relPath = args.path || '';
  const apps = args.apps ? args.apps.split(' ') : [];
  params = {
    apps,
  };
  const pluginPath = path.resolve(relPath);
  cliClientInstance = this.app.client;
  const watchServiceInstance = (CoreHelpers.WatchServiceMgr as any).instance() as WatchServiceInstance;

  // First connect to service before starting watch.
  await cliClientInstance.connect();
  // Start watching plugin.
  await watchServiceInstance.watchPlugin(pluginPath, handlePluginWatchResult);
  await setupWatchStopRequestListeners(watchServiceInstance, pluginPath);
}

const watchCommand: CommandModule<object, WatchCommandArgs> = {
  command: 'watch',
  describe: 'Watch the plugin folder and reloads the plugin on change.',
  handler: handlePluginWatchCommand,
  builder: watchOptions,
};

export default watchCommand;
