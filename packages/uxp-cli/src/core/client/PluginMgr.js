/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the Licrrense for the specific language
 *  governing permissions and limitations under the License.
 *
 */

const CliClientMgr = require("./connection/CliClientController");
const PluginLoadCommand = require("./plugin/actions/PluginLoadCommand");
const PluginDebugCommand = require("./plugin/actions/PluginDebugCommand");
const PluginReloadCommand = require("./plugin/actions/PluginReloadCommand");
const PluginLogCommand = require("./plugin/actions/PluginLogCommand");
const PluginInitCommand = require("./plugin/actions/PluginInitCommand")

const PluginSession = require("./plugin/PluginSession");

class PluginMgr {
    constructor(uxp) {
        this.uxp = uxp;
        this._cliClientMgr = new CliClientMgr(uxp);
    }

    loadPlugin(params) {
        const pluginLoadCommand = new PluginLoadCommand(this, params);
        return pluginLoadCommand.execute();
    }

    // eslint-disable-next-line class-methods-use-this
    initPlugin(params) {
        const pluginInitCommand = new PluginInitCommand(params);
        return pluginInitCommand.execute();
    }

    debugPlugin(params) {
        const pluginDebugCommand = new PluginDebugCommand(this, params);
        return pluginDebugCommand.execute();
    }

    reloadPlugin() {
        const pluginReloadCommand = new PluginReloadCommand(this);
        return pluginReloadCommand.execute();
    }

    getPluginLogPath(params) {
        const pluginLogCommand = new PluginLogCommand(this, params);
        return pluginLogCommand.execute();
    }

    getPluginSession() {
        if (!this._pluginSession) {
            this._pluginSession = PluginSession.createFromRcFile();
        }
        return this._pluginSession;
    }

    connectToService() {
        const prom = this._cliClientMgr.connectToService();
        return prom.catch((err) => {
            this.disconnect();
            throw err;
        });
    }

    disconnect() {
        this.uxp.devToolsMgr.terminate();
        return this._cliClientMgr.disconnect();
    }

    _createPluginSession(loadResults) {
        this._pluginSession = PluginSession.createFromLoadResults(loadResults);
        return this._pluginSession;
    }

    _saveCurrentPluginSession() {
        if (this._pluginSession) {
            this._pluginSession.commitToRc();
        }
    }
}

module.exports = PluginMgr;
