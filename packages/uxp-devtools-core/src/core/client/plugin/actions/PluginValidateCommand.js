/* eslint-disable max-len */
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

const path = require("path");
const PluginBaseCommand = require("./PluginBaseCommand");
const ManifestHelper = require("../../../helpers/ManifestHelper");
const AppsHelper = require("../../../helpers/AppsHelper");
const DevToolsError = require("../../../common/DevToolsError");

function createValidateMessage(pluginFolder, manifest) {
    const msg = {
        command: "Plugin",
        action: "validate",
        params: {
            provider: {
                type: "disk",
                path: pluginFolder,
            },
        },
        manifest,
    };
    return msg;
}

class PluginValidateCommand extends PluginBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    get name() {
        return "Validate";
    }

    validateParams() {
        if (!this.params || !this.params.manifest) {
            return Promise.reject(new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_CMD_PARAM_MANIFEST_PATH));
        }
        this.params.apps = this.params.apps || [];
        return Promise.resolve(true);
    }

    executeCommand() {
        const manifest = ManifestHelper.validate(this.params.manifest, this.name);
        const applicableApps = AppsHelper.getApplicableAppsForPlugin(manifest, this.params.apps);
        if (!applicableApps.length) {
            throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
        }

        const applicableAppsForValidating = this._filterConnectedAppsFromApplicableList(applicableApps);
        const pluginFolder = path.dirname(this.params.manifest);
        const validateJsonMsg = createValidateMessage(pluginFolder, manifest);

        // We need to validate in only one connected app.
        return this._sendMessageToAppsAndReconcileResults([ applicableAppsForValidating[0] ], validateJsonMsg, this._handleValidateCommandResult.bind(this));
    }

    _handleValidateCommandResult(validateResults) {
        if (validateResults.length) {
            const data = validateResults[0].data;
            if (!data.success) {
                throw new DevToolsError(DevToolsError.ErrorCodes.PLUIGN_VALIDATE_FAILED, data.errorMessage);
            }
            return true;
        }
        throw new DevToolsError(DevToolsError.ErrorCodes.COMMAND_FAILED_IN_APP);
    }
}


module.exports = PluginValidateCommand;
