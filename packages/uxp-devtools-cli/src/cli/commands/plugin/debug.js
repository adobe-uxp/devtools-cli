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

const { loadPluginSessionFromUxpRc }  = require("../../utils/Common");
const { lauchDevtoolsInspectApp } = require("../../utils/CLICDTInspectMgr");

const debugOptions = {
    apps: {
        describe: "If you plugin is loaded in multiple apps. You can use this option to limit which app you want the limit the plugin debuggin to. By defualt you will able to debug all apps.",
        type: "string",
    },
};

function launchCDTInspectWindow(cdtDebugWsUrl, pluginInfo, appInfo, forConsole) {
    const cdtDetails = {
        app: {
            name: appInfo.appName,
            version: appInfo.appVersion
        },
        plugin: pluginInfo,
        consoleOnly: forConsole
    };

    const type = forConsole ? "Console" : "Inspect";

    console.log(`Launching the ${type} Window ...`);
    const prom = lauchDevtoolsInspectApp(cdtDebugWsUrl, cdtDetails);
    return prom;
}

function handlePluginDebugCommand(args) {
    const apps = args.apps ? args.apps.split(" ") : [];
    const params = {
        apps,
    };
    const forConsole = args.forConsole || false;
    // load the current plugin session from the uxprc file.
    const pluginSession = loadPluginSessionFromUxpRc();
    const prom = this.app.client.executePluginCommand("debugPlugin", pluginSession, params);
    return prom.then((debugUrls) => {
        const proms = [];
        debugUrls.forEach(debugData => {
            const appInfo = debugData.cdtAppInfo;
            const wsdebugUrl = debugData.cdtDebugWsUrl;
            const prom = launchCDTInspectWindow(wsdebugUrl, pluginSession.pluginInfo, appInfo, forConsole);
            proms.push(prom);
        });
        return Promise.all(proms);
    });
}

const debugCommand = {
    command: "debug",
    description: "Debug the currently loaded plugin.",
    handler: handlePluginDebugCommand,
    builder: debugOptions,
};

module.exports = debugCommand;
