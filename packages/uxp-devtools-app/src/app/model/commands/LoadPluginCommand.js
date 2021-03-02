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

export default class LoadPluginCommand extends BaseCommand {

    async execute() {
        const plugin = this.params.plugin;
        const client = this.clientMgr;
        const options = plugin.pluginOptions || {};
        const detials = {
            id: plugin.manifest && plugin.manifest.id,
            options: {
                breakOnStart: options.breakOnStart
            }
        };
        UxpAppLogger.verbose("Load Plugin Command : ", detials);
        const commandProm = client.loadPlugin(plugin);
        return commandProm.then((serviceSession) => {
            UxpAppLogger.verbose("Plugin Load Successful");
            plugin.setServiceSession(serviceSession);
        }).catch((err) => {
            const msg = "Plugin Load Failed";
            const error = this.createError(null, err, msg);
            throw error;
        });
    }
}
