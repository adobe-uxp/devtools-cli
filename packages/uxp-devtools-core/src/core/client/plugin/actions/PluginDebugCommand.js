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

const PluginBaseCommand = require("./PluginBaseCommand");


function createDebugMessage(pluginSessionId) {
    const msg = {
        command: "Plugin",
        action: "debug",
        pluginSessionId,
    };
    return msg;
}

class PluginDebugCommand extends PluginBaseCommand {
    constructor(pluginMgr, params) {
        super(pluginMgr);
        this.params = params;
    }

    get name() {
        return "Debug";
    }

    validateParams() {
        this.params = this.params || {};
        this.params.apps = this.params.apps || [];
        return Promise.resolve(true);
    }


    executeCommand() {
        const resultsCallback = this._handlePluginDebugResult.bind(this);
        return this.runCommandOnAllApplicableApps(createDebugMessage, resultsCallback);
    }

    _handlePluginDebugResult(commandResults) {
        const debugUrls = commandResults.map((result) => {
            return {
                appInfo: result.app,
                cdtDebugWsUrl: result.data.wsdebugUrl,
                chromeDevToolsUrl: result.data.chromeDevToolsUrl
            };
        });
        return debugUrls;
    }
}

module.exports = PluginDebugCommand;
