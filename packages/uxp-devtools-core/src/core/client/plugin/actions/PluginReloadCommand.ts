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

import type { BaseMessage } from '../../../../types/index.js';
import type PluginMgr from '../../PluginMgr.js';
import type { CommandParams, CommandResult } from './PluginBaseCommand.js';
import PluginBaseCommand from './PluginBaseCommand.js';

export interface ReloadParams extends CommandParams {
  apps?: string[];
}

interface ReloadMessage extends BaseMessage {
  command: 'Plugin';
  action: 'reload';
  pluginSessionId: string;
}

function createReloadMessage(pluginSessionId: string): ReloadMessage {
  const msg: ReloadMessage = {
    command: 'Plugin',
    action: 'reload',
    pluginSessionId,
  };
  return msg;
}

class PluginReloadCommand extends PluginBaseCommand {
  protected override params: ReloadParams;

  constructor(pluginMgr: PluginMgr, params?: ReloadParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  override get name(): string {
    return 'Reload';
  }

  override validateParams(): Promise<boolean> {
    if (!this.params) {
      this.params = {
        apps: [],
      };
    }
    return Promise.resolve(true);
  }

  override executeCommand(): Promise<boolean> {
    const resultsCallback = this._handlePluginReloadResult.bind(this);
    return this.runCommandOnAllApplicableApps(createReloadMessage, resultsCallback);
  }

  breakOnStartEnabled(result: CommandResult): boolean {
    const data = result.data as { breakOnStart?: boolean } | undefined;
    return !!(data && data.breakOnStart);
  }

  private _handlePluginReloadResult(): boolean {
    return true;
  }
}

export default PluginReloadCommand;
