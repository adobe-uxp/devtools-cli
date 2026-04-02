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
import type { CommandParams } from './PluginBaseCommand.js';
import PluginBaseCommand from './PluginBaseCommand.js';

export interface UnloadParams extends CommandParams {
  apps?: string[];
}

interface UnloadMessage extends BaseMessage {
  command: 'Plugin';
  action: 'unload';
  pluginSessionId: string;
}

function createUnloadMessage(pluginSessionId: string): UnloadMessage {
  const msg: UnloadMessage = {
    command: 'Plugin',
    action: 'unload',
    pluginSessionId,
  };
  return msg;
}

class PluginUnloadCommand extends PluginBaseCommand {
  protected override params: UnloadParams;

  constructor(pluginMgr: PluginMgr, params?: UnloadParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  override get name(): string {
    return 'Unload';
  }

  override validateParams(): Promise<boolean> {
    this.params = this.params || {};
    this.params.apps = this.params.apps || [];
    return Promise.resolve(true);
  }

  override executeCommand(): Promise<boolean> {
    return this.runCommandOnAllApplicableApps(createUnloadMessage);
  }
}

export default PluginUnloadCommand;
