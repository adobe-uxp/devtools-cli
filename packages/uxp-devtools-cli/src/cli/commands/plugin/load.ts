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
import { DevToolsError } from '@adobe-fixed-uxp/uxp-devtools-core';

interface LoadCommandArgs {
  manifest?: string;
  apps?: string;
  breakOnStart?: string;
}

interface LoadParams {
  manifest: string;
  apps: string[];
  breakOnStart: boolean;
}

interface PluginSession {
  commitToRc: (dirPath: string) => void;
}

interface CommandContext {
  app: {
    client: {
      executePluginCommand: (command: string, params: LoadParams) => Promise<PluginSession>;
    };
  };
}

const loadOptions: Record<string, Options> = {
  manifest: {
    describe: 'Relative path to plugin\'s manifest.json file. Defaults to the manifest.json in the current working directory.',
    demandOption: false,
  },
  apps: {
    describe: 'Space delimited list of app IDs into which the plugin should be loaded. The supported app IDs can be retrieved using `uxp apps list`. The default action is to load the plugin into all currently running apps specified in the plugin\'s manifest.',
    demandOption: false,
  },
  breakOnStart: {
    describe: 'Blocks the plugin until a debugger attaches. If specified, attach is assumed, and a debugger will immediately be spawned. Defaults to false.',
    demandOption: false,
  },
};

async function handlePluginLoadCommand(this: CommandContext, args: ArgumentsCamelCase<LoadCommandArgs>): Promise<void> {
  const manifestRelPath = args.manifest ? args.manifest : 'manifest.json';
  const manifest = path.resolve(manifestRelPath);
  const apps = args.apps ? args.apps.split(' ') : [];
  const breakOnStart = args.breakOnStart === 'true';
  const params: LoadParams = {
    manifest,
    apps,
    breakOnStart,
  };

  const pluginSession = await this.app.client.executePluginCommand('loadPlugin', params);
  // commit this plugin session to a uxprc file so as to persist the state
  // for later commands ( like plugin debug/log et al)
  const uxprcDirPath = path.dirname(manifest);
  pluginSession.commitToRc(uxprcDirPath);
  const loadSuccessMsg = DevToolsError.getUserFriendlyMessageFromCode(DevToolsError.ErrorCodes.PLUGIN_LOAD_SUCCESS);
  console.log(loadSuccessMsg);
}

const loadCommand: CommandModule<object, LoadCommandArgs> = {
  command: 'load',
  describe: 'Loads the plugin in the target application.',
  handler: handlePluginLoadCommand,
  builder: loadOptions,
};

export default loadCommand;
