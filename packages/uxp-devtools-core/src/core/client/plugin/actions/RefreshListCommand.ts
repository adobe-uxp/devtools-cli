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

import type { AppEndPoint, BaseMessage } from '../../../../types/index.js';
import type PluginMgr from '../../PluginMgr.js';
import type { CommandResult } from './PluginBaseCommand.js';
import DevToolsError from '../../../common/DevToolsError.js';
import PluginBaseCommand from './PluginBaseCommand.js';

interface ListMessage extends BaseMessage {
  command: 'Plugin';
  action: 'list';
}

interface PluginData {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface PluginInfoResult {
  plugin: PluginData;
  app: AppEndPoint;
}

function createMessage(): ListMessage {
  const msg: ListMessage = {
    command: 'Plugin',
    action: 'list',
  };
  return msg;
}

class RefreshListCommand extends PluginBaseCommand {
  constructor(pluginMgr: PluginMgr) {
    super(pluginMgr);
  }

  override get name(): string {
    return 'Refresh List';
  }

  override validateParams(): Promise<boolean> {
    return Promise.resolve(true);
  }

  override executeCommand(): Promise<PluginInfoResult[]> {
    const applicableApps = this.pm._cliClientMgr.getConnectedApps();
    if (!applicableApps.length) {
      throw new DevToolsError(DevToolsError.ErrorCodes.NO_APPS_CONNECTED_TO_SERVICE);
    }
    const loadJsonMsg = createMessage();
    return this._sendMessageToAppsAndReconcileResults(applicableApps, loadJsonMsg, this._handleCommandResult.bind(this));
  }

  private _handleCommandResult(pluginResults: CommandResult[]): PluginInfoResult[] {
    const pluginSet: PluginInfoResult[] = [];
    for (const pluginResult of pluginResults) {
      const { app, data } = pluginResult;
      const { plugins } = data as { plugins: PluginData[] };
      for (const plugin of plugins) {
        const pluginInfo: PluginInfoResult = {
          plugin,
          app,
        };
        pluginSet.push(pluginInfo);
      }
    }
    return pluginSet;
  }
}

export default RefreshListCommand;
