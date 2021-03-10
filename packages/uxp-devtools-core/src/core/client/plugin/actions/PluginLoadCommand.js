/* eslint-disable class-methods-use-this */
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

/* eslint-disable max-len */
const path = require("path");
const PluginBaseCommand = require("./PluginBaseCommand");
const ManifestHelper = require("../../../helpers/ManifestHelper");
const AppsHelper = require("../../../helpers/AppsHelper");
const PluginSession = require("../PluginSession");
const DevToolsError = require("../../../common/DevToolsError");

function createLoadMessage(pluginFolder, breakOnStart) {
    const msg = {
        command: "Plugin",
        action: "load",
        params: {
            provider: {
                type: "disk",
                path: pluginFolder,
            },
        },
        breakOnStart,
    };
    return msg;
}

class PluginLoadCommand extends PluginBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    get name() {
        return "Load";
    }

    validateParams() {
        if (!this.params || !this.params.manifest) {
            return Promise.reject(new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_CMD_PARAM_MANIFEST_PATH));
        }
        this.params.apps = this.params.apps || [];
        return Promise.resolve(true);
    }

    executeCommand() {
        // We need to validate the plugin first from one of the connected apps before loading.
        // This will prevent the silent failure during loading of plugin on host app.
        const manifest = ManifestHelper.validate(this.params.manifest, this.name);
        const prom = this.pm.validatePluginManifest(this.params);
        return prom.then(() => {
            this.manifest = manifest;
            const applicableApps = AppsHelper.getApplicableAppsForPlugin(manifest, this.params.apps);
            if (!applicableApps.length) {
                throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
            }

            const appsApplicableForLoading = this._filterConnectedAppsFromApplicableList(applicableApps);
            const pluginFolder = path.dirname(this.params.manifest);
            const loadJsonMsg = createLoadMessage(pluginFolder, this.params.breakOnStart);
            return this._sendMessageToAppsAndReconcileResults(appsApplicableForLoading, loadJsonMsg, this._handleLoadCommandResult.bind(this));
        });
    }

    _handleLoadCommandResult(loadResults) {
        const pluginInfo = {
            id: this.manifest.id,
            name: this.manifest.name
        };
        return PluginSession.createFromLoadResults(loadResults, pluginInfo);
    }
}

module.exports = PluginLoadCommand;
