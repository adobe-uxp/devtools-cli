/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/


import BaseCommand from "./BaseCommand";

export default class DebugPluginCommand extends BaseCommand {

    async execute() {
        const plugin = this.params.plugin;
        const client = this.clientMgr;

        const id = plugin.manifest.id;
        const name = plugin.manifest.name;
        const consoleOnly = this.params.forPluginLogs;

        UxpAppLogger.verbose("Debug Plugin Command  : ", {
            id,
            consoleOnly
        });

        const prom = client.debugPlugin(plugin);
        return prom.then((debugResults) => {
            const proms = [];
            for (let data of debugResults) {
                const debugProm = this.appController.openDevtoolsInspector(data.cdtDebugWsUrl, {
                    plugin: {
                        id,
                        name
                    },
                    app: data.app,
                    consoleOnly
                }, {
                    pluginModelId: plugin.modelId,
                    consoleOnly
                });
                proms.push(debugProm);
            }
            UxpAppLogger.verbose(`Debug command Succesful ${JSON.stringify(debugResults)}`);
            return Promise.all(proms);
        }).catch((err) => {
            UxpAppLogger.verbose("Debug Command Failed with Error : ", err.message);
            throw err;
        });
    }
}
