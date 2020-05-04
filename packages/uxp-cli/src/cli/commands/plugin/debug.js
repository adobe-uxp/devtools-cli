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

const debugOptions = {
    apps: {
        describe: "If you plugin is loaded in multiple apps. You can use this option to limit which app you want the limit the plugin debuggin to. By defualt you will able to debug all apps.",
        type: 'string',
    },
};

function handlePluginDebugCommand(args) {
    const apps = args.apps ? args.apps.split(" ") : [];
    const params = {
        apps,
    };

    const prom = this.uxp.pluginMgr.debugPlugin(params);
    return prom.then((res) => {
        console.log("Launched standalone Chrome Developer Tools window.");
        return res;
    });
}

const debugCommand = {
    command: 'debug',
    description: 'Debug the currently loaded plugin.',
    handler: handlePluginDebugCommand,
    builder: debugOptions,
};

module.exports = debugCommand;
