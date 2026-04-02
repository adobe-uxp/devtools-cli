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
import { loadPluginSessionFromUxpRc } from '../../utils/common.js';

interface UnloadCommandArgs {
  apps?: string;
}

interface PluginSession {
  pluginInfo: unknown;
}

interface CommandContext {
  app: {
    client: {
      executePluginCommand: (command: string, session: PluginSession, params: { apps: string[] }) => Promise<unknown>;
    };
  };
}

const unloadOptions: Record<string, Options> = {
  apps: {
    describe: 'Space delimited list of app IDs from which the plugin should be unloaded. The supported app IDs can be retrieved using uxp apps list. The default action is to unload the plugin from all currently running apps specified in the plugin\'s manifest.',
    demandOption: false,
  },
};

async function handlePluginUnloadCommand(this: CommandContext, args: ArgumentsCamelCase<UnloadCommandArgs>): Promise<void> {
  // load the current plugin session from the uxprc file.
  const pluginSession = loadPluginSessionFromUxpRc();
  const apps = args.apps ? args.apps.split(' ') : [];
  const params = {
    apps,
  };
  await this.app.client.executePluginCommand('unloadPlugin', pluginSession, params);
  console.log('Plugin Unload Successfull.');
}

const unloadCommand: CommandModule<object, UnloadCommandArgs> = {
  command: 'unload',
  describe: 'Unloads this plugin in the app. The plugin needs to be already loaded in application',
  handler: handlePluginUnloadCommand,
  builder: unloadOptions,
};

export default unloadCommand;
