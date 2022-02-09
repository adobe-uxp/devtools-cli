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
const fs = require("fs-extra");

const ManifestHelper = require("../../../helpers/ManifestHelper");
const AppsHelper = require("../../../helpers/AppsHelper");
const DevToolsError = require("../../../common/DevToolsError");
const PluginTestBaseCommand = require("./PluginTestBaseCommand");
const CoreHelpers  = require("../../../common/CoreHelpers");



class PluginTestCommand extends PluginTestBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    get name() {
        return "Test";
    }

    validateParams() {
        if (!this.params) {
            this.params = {
                apps: [],
            };
        }
        return Promise.resolve(true);
    }

    executeCommand() {

        const manifest = ManifestHelper.validate(this.params.manifest, this.name);
        const applicableApps = AppsHelper.getApplicableAppsForPlugin(manifest, this.params.apps);
        const connectedApps = this.pm._cliClientMgr.getConnectedApps();
        const applicableAppsForRunningTests = AppsHelper.filterConnectedAppsForPlugin(connectedApps, applicableApps);
        if (!applicableAppsForRunningTests.length) {
            throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
        }

        const pluginId = manifest.id;
        const pluginSession = this.getSessionDetailsOfApplicableApps(this.params.apps);
        if (!pluginSession) {
            throw new DevToolsError(DevToolsError.ErrorCodes.NO_PLUGIN_SESSION);
        }

        var port = this.params.driverPort;
        const prom = CoreHelpers.isPortAvailable(port);
        return prom.then((isAvailable) => {
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
module.exports = PluginTestCommand;
