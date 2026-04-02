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
import type { PluginManifest } from '../../../../types/plugins.js';
import type PluginMgr from '../../PluginMgr.js';
import type { CommandParams, CommandResult } from './PluginBaseCommand.js';
import path from 'node:path';
import DevToolsError from '../../../common/DevToolsError.js';
import AppsHelper from '../../../helpers/AppsHelper.js';
import ManifestHelper from '../../../helpers/ManifestHelper.js';
import PluginBaseCommand from './PluginBaseCommand.js';

export interface ValidateParams extends CommandParams {
  manifest?: string;
  apps?: string[];
}

interface ValidateMessage extends BaseMessage {
  command: 'Plugin';
  action: 'validate';
  params: {
    provider: {
      type: string;
      path: string;
    };
  };
  manifest: PluginManifest;
}

function createValidateMessage(pluginFolder: string, manifest: PluginManifest): ValidateMessage {
  const msg: ValidateMessage = {
    command: 'Plugin',
    action: 'validate',
    params: {
      provider: {
        type: 'disk',
        path: pluginFolder,
      },
    },
    manifest,
  };
  return msg;
}

class PluginValidateCommand extends PluginBaseCommand {
  protected override params: ValidateParams;

  constructor(pluginMgr: PluginMgr, params?: ValidateParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  override get name(): string {
    return 'Validate';
  }

  override validateParams(): Promise<boolean> {
    if (!this.params || !this.params.manifest) {
      return Promise.reject(new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_CMD_PARAM_MANIFEST_PATH));
    }
    this.params.apps = this.params.apps || [];
    return Promise.resolve(true);
  }

  override executeCommand(): Promise<boolean> {
    const manifest = ManifestHelper.validate(this.params.manifest!, this.name);
    const applicableApps = AppsHelper.getApplicableAppsForPlugin(manifest, this.params.apps || []);
    if (!applicableApps.length) {
      throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
    }

    const applicableAppsForValidating = this._filterConnectedAppsFromApplicableList(applicableApps);
    const pluginFolder = path.dirname(this.params.manifest!);
    const validateJsonMsg = createValidateMessage(pluginFolder, manifest);

    // We need to validate in only one connected app.
    const firstApp = applicableAppsForValidating[0];
    if (!firstApp) {
      throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
    }
    return this._sendMessageToAppsAndReconcileResults([firstApp], validateJsonMsg, this._handleValidateCommandResult.bind(this));
  }

  private _handleValidateCommandResult(validateResults: CommandResult[]): boolean {
    const firstResult = validateResults[0];
    if (firstResult) {
      const data = firstResult.data as { success: boolean; errorMessage?: string };
      if (!data.success) {
        throw new DevToolsError(DevToolsError.ErrorCodes.PLUIGN_VALIDATE_FAILED, data.errorMessage);
      }
      return true;
    }
    throw new DevToolsError(DevToolsError.ErrorCodes.COMMAND_FAILED_IN_APP);
  }
}

export default PluginValidateCommand;
