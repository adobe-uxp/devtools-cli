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
import type { CommandParams, CommandResult } from './PluginBaseCommand.js';
import PluginBaseCommand from './PluginBaseCommand.js';

export interface DebugParams extends CommandParams {
  apps?: string[];
}

export interface DebugUrlInfo {
  appInfo: AppEndPoint;
  cdtDebugWsUrl: string;
  chromeDevToolsUrl: string;
}

interface DebugMessage extends BaseMessage {
  command: 'Plugin';
  action: 'debug';
  pluginSessionId: string;
}

function createDebugMessage(pluginSessionId: string): DebugMessage {
  const msg: DebugMessage = {
    command: 'Plugin',
    action: 'debug',
    pluginSessionId,
  };
  return msg;
}

class PluginDebugCommand extends PluginBaseCommand {
  protected override params: DebugParams;

  constructor(pluginMgr: PluginMgr, params?: DebugParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  override get name(): string {
    return 'Debug';
  }

  override validateParams(): Promise<boolean> {
    this.params = this.params || {};
    this.params.apps = this.params.apps || [];
    return Promise.resolve(true);
  }

  override executeCommand(): Promise<DebugUrlInfo[]> {
    const resultsCallback = this._handlePluginDebugResult.bind(this);
    return this.runCommandOnAllApplicableApps(createDebugMessage, resultsCallback);
  }

  private _handlePluginDebugResult(commandResults: CommandResult[]): DebugUrlInfo[] {
    const debugUrls = commandResults.map((result) => {
      const data = result.data as { wsdebugUrl: string; chromeDevToolsUrl: string };
      return {
        appInfo: result.app,
        cdtDebugWsUrl: data.wsdebugUrl,
        chromeDevToolsUrl: data.chromeDevToolsUrl,
      };
    });
    return debugUrls;
  }
}

export default PluginDebugCommand;
