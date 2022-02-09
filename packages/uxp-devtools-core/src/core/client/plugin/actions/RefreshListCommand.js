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
const PluginBaseCommand = require("./PluginBaseCommand");
const DevToolsError = require("../../../common/DevToolsError");

function createMessage() {
    const msg = {
        command: "Plugin",
        action: "list"
    };
    return msg;
}

class RefreshListCommand extends PluginBaseCommand {
    constructor(pluginMgr) {
        super(pluginMgr);
    }

    get name() {
        return "Refresh List";
    }

    validateParams() {
        return Promise.resolve(true);
    }

    executeCommand() {
        const applicableApps = this.pm._cliClientMgr.getConnectedApps();
        if (!applicableApps.length) {
            throw new DevToolsError(DevToolsError.ErrorCodes.NO_APPS_CONNECTED_TO_SERVICE);
        }
        const loadJsonMsg = createMessage();
        return this._sendMessageToAppsAndReconcileResults(applicableApps, loadJsonMsg, this._handleCommandResult.bind(this));
    }

    _handleCommandResult(pluginResults) {
        let pluginSet = [];
        for (const pluginResult of pluginResults) {
            const { app, data } = pluginResult;
            const { plugins } = data;
            for (const plugin of plugins) {
                const pluginInfo = {
                    plugin,
                    app
                };
                pluginSet.push(pluginInfo);
            }
        }
        return pluginSet;
    }
}

module.exports = RefreshListCommand;
