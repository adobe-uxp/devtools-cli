import type PluginMgr from '../../PluginMgr.js';

import type { TestParams } from './PluginTestBaseCommand.js';
/*
 *  Copyright 2021 Adobe Systems Incorporated. All rights reserved.
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
import fs from 'node:fs';
import CoreHelpers from '../../../common/CoreHelpers.js';
import DevToolsError from '../../../common/DevToolsError.js';
import AppsHelper from '../../../helpers/AppsHelper.js';
import ManifestHelper from '../../../helpers/ManifestHelper.js';
import PluginTestBaseCommand from './PluginTestBaseCommand.js';

class PluginTestCommand extends PluginTestBaseCommand {
  protected override params: TestParams;

  constructor(pluginMgr: PluginMgr, params?: TestParams) {
    super(pluginMgr);
    this.params = params || {};
  }

  override get name(): string {
    return 'Test';
  }

  override validateParams(): Promise<boolean> {
    if (!this.params) {
      this.params = {
        apps: [],
      };
    }
    return Promise.resolve(true);
  }

  override executeCommand(): Promise<void> {
    const manifest = ManifestHelper.validate(this.params.manifest!, this.name);
    const applicableApps = AppsHelper.getApplicableAppsForPlugin(manifest, this.params.apps || []);
    const connectedApps = this.pm._cliClientMgr.getConnectedApps();
    const applicableAppsForRunningTests = AppsHelper.filterConnectedAppsForPlugin(connectedApps, applicableApps);
    if (!applicableAppsForRunningTests.length) {
      throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
    }

    const pluginId = manifest.id;
    const pluginSession = this.getSessionDetailsOfApplicableApps(this.params.apps || []);
    if (!pluginSession) {
      throw new DevToolsError(DevToolsError.ErrorCodes.NO_PLUGIN_SESSION);
    }

    const port = this.params.driverPort!;
    const prom = CoreHelpers.isPortAvailable(port);
    return prom.then((isAvailable: boolean) => {
      if (!isAvailable) {
        throw new Error(`The port ${port} is occupied. Please try another port or close the application which is using the port and try again.`);
      }
      if (!fs.existsSync(this.pluginTestFolder)) {
        throw new Error (' Run "uxp plugin test --setup" command to create a starter project');
      }
      this.executeTest(this.params, applicableAppsForRunningTests, pluginId);
    });
  }
}

export default PluginTestCommand;
