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

interface ReloadCommandArgs {
  apps?: string;
}

interface ReloadResult {
  breakOnStart?: boolean;
}

interface PluginSession {
  pluginInfo: unknown;
}

interface CommandContext {
  app: {
    client: {
      executePluginCommand: (command: string, session: PluginSession, params: { apps: string[] }) => Promise<ReloadResult>;
    };
  };
}

const reloadOptions: Record<string, Options> = {
  apps: {
    describe: 'Space delimited list of app IDs into which the plugin should be reloaded. The supported app IDs can be retrieved using `uxp apps list`. The default action is to reload the plugin into all currently running apps specified in the plugin\'s manifest.',
    demandOption: false,
  },
};

async function handlePluginReloadCommand(this: CommandContext, args: ArgumentsCamelCase<ReloadCommandArgs>): Promise<void> {
  // load the current plugin session from the uxprc file.
  const pluginSession = loadPluginSessionFromUxpRc();
  const apps = args.apps ? args.apps.split(' ') : [];
  const params = {
    apps,
  };
  const res = await this.app.client.executePluginCommand('reloadPlugin', pluginSession, params);
  if (res && !res.breakOnStart) {
    console.log('Plugin Reload successfull.');
  }
}

const reloadCommand: CommandModule<object, ReloadCommandArgs> = {
  command: 'reload',
  describe: 'Reloads this plugin in the app. The plugin needs to be already loaded in application',
  handler: handlePluginReloadCommand,
  builder: reloadOptions,
};

export default reloadCommand;
