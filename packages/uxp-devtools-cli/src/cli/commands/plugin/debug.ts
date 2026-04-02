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

interface DebugCommandArgs {
  apps?: string;
  forConsole?: boolean;
}

interface PluginInfo {
  id: string;
  name?: string;
}

interface AppInfo {
  id: string;
  name: string;
}

interface DebugData {
  appInfo: AppInfo;
  cdtDebugWsUrl: string;
}

interface PluginSession {
  pluginInfo: PluginInfo | { id?: string; name?: string };
}

interface CommandContext {
  app: {
    client: {
      executePluginCommand: (command: string, session: PluginSession, params: { apps: string[] }) => Promise<DebugData[]>;
    };
  };
}

const debugOptions: Record<string, Options> = {
  apps: {
    describe: 'If you plugin is loaded in multiple apps. You can use this option to limit which app you want the limit the plugin debuggin to. By defualt you will able to debug all apps.',
    type: 'string',
  },
};

function launchCDTInspectWindow(_cdtDebugWsUrl: string, _pluginInfo: PluginInfo, _appInfo: AppInfo, _forConsole: boolean): Promise<void> {
  throw new Error('Not implemented');
}

async function handlePluginDebugCommand(this: CommandContext, args: ArgumentsCamelCase<DebugCommandArgs>): Promise<void> {
  const apps = args.apps ? args.apps.split(' ') : [];
  const params = {
    apps,
  };
  const forConsole = args.forConsole || false;
  // load the current plugin session from the uxprc file.
  const pluginSession = loadPluginSessionFromUxpRc();
  const debugUrls = await this.app.client.executePluginCommand('debugPlugin', pluginSession, params);
  const proms: Promise<void>[] = [];
  debugUrls.forEach((debugData) => {
    const appInfo = debugData.appInfo;
    const wsdebugUrl = debugData.cdtDebugWsUrl;
    const prom = launchCDTInspectWindow(wsdebugUrl, pluginSession.pluginInfo as PluginInfo, appInfo, forConsole);
    proms.push(prom);
  });
  await Promise.all(proms);
}

const debugCommand: CommandModule<object, DebugCommandArgs> = {
  command: 'debug',
  describe: 'Debug the currently loaded plugin.',
  handler: handlePluginDebugCommand,
  builder: debugOptions,
};

export default debugCommand;
