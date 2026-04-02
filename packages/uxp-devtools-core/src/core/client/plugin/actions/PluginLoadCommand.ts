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
import type { LoadResult, PluginManifest } from '../../../../types/plugins.js';
import type PluginMgr from '../../PluginMgr.js';
import type { CommandParams, CommandResult } from './PluginBaseCommand.js';
import path from 'node:path';
import DevToolsError from '../../../common/DevToolsError.js';
import AppsHelper from '../../../helpers/AppsHelper.js';
import ManifestHelper from '../../../helpers/ManifestHelper.js';
import PluginSession from '../PluginSession.js';
import PluginBaseCommand from './PluginBaseCommand.js';

export interface LoadParams extends CommandParams {
  manifest?: string;
  apps?: string[];
  breakOnStart?: boolean;
}

interface LoadMessage extends BaseMessage {
  command: 'Plugin';
  action: 'load';
  params: {
    provider: {
      type: string;
      path: string;
    };
  };
  breakOnStart?: boolean;
}

function createLoadMessage(pluginFolder: string, breakOnStart?: boolean): LoadMessage {
  const msg: LoadMessage = {
    command: 'Plugin',
    action: 'load',
    params: {
      provider: {
        type: 'disk',
        path: pluginFolder,
      },
    },
    breakOnStart,
  };
  return msg;
}

class PluginLoadCommand extends PluginBaseCommand {
  protected override params: LoadParams;
  private manifest!: PluginManifest;

  constructor(pluginMgr: PluginMgr, params?: LoadParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  override get name(): string {
    return 'Load';
  }

  override validateParams(): Promise<boolean> {
    if (!this.params || !this.params.manifest) {
      return Promise.reject(new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_CMD_PARAM_MANIFEST_PATH));
    }
    this.params.apps = this.params.apps || [];
    return Promise.resolve(true);
  }

  override executeCommand(): Promise<PluginSession> {
    // We need to validate the plugin first from one of the connected apps before loading.
    // This will prevent the silent failure during loading of plugin on host app.
    const manifest = ManifestHelper.validate(this.params.manifest!, this.name);
    const prom = this.pm.validatePluginManifest(this.params);
    return prom.then(() => {
      this.manifest = manifest;
      const applicableApps = AppsHelper.getApplicableAppsForPlugin(manifest, this.params.apps || []);
      if (!applicableApps.length) {
        throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
      }

      const appsApplicableForLoading = this._filterConnectedAppsFromApplicableList(applicableApps);
      const pluginFolder = path.dirname(this.params.manifest!);
      const loadJsonMsg = createLoadMessage(pluginFolder, this.params.breakOnStart);
      return this._sendMessageToAppsAndReconcileResults(appsApplicableForLoading, loadJsonMsg, this._handleLoadCommandResult.bind(this));
    });
  }

  private _handleLoadCommandResult(loadResults: CommandResult[]): PluginSession {
    const pluginInfo = {
      id: this.manifest.id,
      name: this.manifest.name,
    };
    const results: LoadResult[] = loadResults.map(result => ({
      success: result.success,
      data: result.data as { pluginSessionId: string },
      app: result.app,
      err: result.err,
    }));
    return PluginSession.createFromLoadResults(results, pluginInfo);
  }
}

export default PluginLoadCommand;
