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
const PluginValidateCommand = require("./plugin/actions/PluginValidateCommand");
const PluginUnloadCommand = require("./plugin/actions/PluginUnloadCommand");
const PluginPackageCommand = require("./plugin/actions/PluginPackageCommand");
const RefreshListCommand = require("./plugin/actions/RefreshListCommand");
const PluginTestCommand = require("./plugin/actions/PluginTestCommand");
const PluginTestSetupCommand = require("./plugin/actions/PluginTestSetupCommand");


const PluginSession = require("./plugin/PluginSession");

class PluginMgr {
    constructor() {
        this._cliClientMgr = new CliClientMgr();
    }

    loadPlugin(params) {
        const pluginLoadCommand = new PluginLoadCommand(this, params);
        return pluginLoadCommand.execute();
    }

    registerAppConnectionsListener(listener) {
        this._cliClientMgr.registerAppConnectionsListener(listener);
    }

    registerPluginStateListener(listener) {
        this._cliClientMgr.registerPluginStateListener(listener);
    }

    registerHostAppLogListener(listener) {
        this._cliClientMgr.registerHostAppLogListener(listener);
    }

    refreshList() {
        const refreshListCommand = new RefreshListCommand(this);
        return refreshListCommand.execute();
    }

    debugPlugin(pluginSession, params) {
        const debugCommand = new PluginDebugCommand(this, params);
        debugCommand.pluginSession = pluginSession;
        return debugCommand.execute();
    }

    unloadPlugin(pluginSession, params) {
        const unloadCommand = new PluginUnloadCommand(this, params);
        unloadCommand.pluginSession = pluginSession;
        return unloadCommand.execute();
    }


    reloadPlugin(pluginSession, params) {
        const reloadCommand = new PluginReloadCommand(this, params);
        reloadCommand.pluginSession = pluginSession;
        return reloadCommand.execute();
    }

    executePluginTest(pluginSession, params) {
        const pluginTestCommand = new PluginTestCommand(this, params);
        pluginTestCommand.pluginSession = pluginSession;
        return pluginTestCommand.execute();
    }

    setupPluginTest(params) {
        const pluginTestSetupCommand = new PluginTestSetupCommand(this, params);
        return pluginTestSetupCommand.execute();

    }

    validatePluginManifest(params) {
        const pluginValidateCommand = new PluginValidateCommand(this, params);
        return pluginValidateCommand.execute();
    }

    packagePlugin(params) {
        const pluginPackageCommand = new PluginPackageCommand(this, params);
        return pluginPackageCommand.execute();
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

    getConnectedApps() {
        return this._cliClientMgr.getConnectedApps();
    }

    connectToService(port) {
        return this._cliClientMgr.connectToService(port);
    }

    disconnect() {
        return this._cliClientMgr.disconnect();
    }
}

module.exports = PluginMgr;
