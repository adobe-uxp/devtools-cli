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
const path = require("path");
const { loadPluginSessionFromUxpRc } = require("../../utils/Common");

function handlePluginTestCommand(args) {

    const manifestRelPath = args.manifest ? args.manifest : "manifest.json";
    const manifest = path.resolve(manifestRelPath);
    const apps = args.appId ? args.appId.split(" ") : [];
    const packageName =  `@adobe/uxp-wdio-automation-template`;
    const driverPort = args.port;
    const params = {
        manifest,
        packageName,
        driverPort,
        apps
    };
    if(args.setup) {
        const promPluginTestSetup = this.app.client.executePluginCommand("setupTest", params);
        return promPluginTestSetup.then((res) => {
            return res;
        });
    }
    else{
        const pluginSession = loadPluginSessionFromUxpRc();
        const promPluginTest = this.app.client.executePluginCommand("executeTest", pluginSession, params);
        return promPluginTest.then((res) => {
            return res;
        });
    }

}
const testOptions = {
    setup: {
        describe: "setup Automation Framework",
        alias : [ "s" ]
    },
    port: {
        describe: "The port number for the uxp developer test service",
        type: "number",
        default: 4797
    },
    manifest: {
        describe: "Relative path to plugin's manifest.json file. Defaults to the manifest.json in the current working directory.",
        demandOption: false,
    },
    appId: {
        describe: "Single App ID into which the plugin's test should be executed. The supported app IDs can be retrieved using `uxp apps list`. The default action is to execute test on the first host app specified in the plugin's manifest.",
        demandOption: false,
    }
};

const testCommand = {
    command: "test",
    description: "Run the tests for plugin",
    handler: handlePluginTestCommand,
    builder: testOptions,
};

module.exports = testCommand;
