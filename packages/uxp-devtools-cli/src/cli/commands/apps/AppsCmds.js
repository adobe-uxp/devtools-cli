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

const Table = require("cli-table3");
const { CoreHelpers } = require("@adobe/uxp-devtools-core");

function handleAppsListCommand() {
    this.app.logLevel = CoreHelpers.LoggerLevel.WARN;
    const prom = this.app.client.executePluginCommand("connectedApps");
    return prom.then((appsList) => {
        if (!appsList || !appsList.length) {
            console.warn("No Host apps are currently connected to uxp devtools cli service");
            console.warn("Please make sure that you have launched an application that supports UXP Developer Tools and try again.");
            return null;
        }

        const tableOptions = {
            head: [ "ID", "Version", "Name" ],
            style: { head: [ "green" ] },
            wordWrap: true,
        };
        const table = new Table(tableOptions);
        appsList.forEach((app) => {
            table.push([ app.id, app.version, app.name ]);
        });

        console.log("List of Host Apps currently connected to UXP devtools cli service");
        console.log(table.toString());
        return appsList;
    });
}

const appsListCommand = {
    command: "list",
    description: "List Applications that are currently connected to the uxp devtools cli service.",
    handler: handleAppsListCommand,
};

module.exports = {
    appsListCommand,
};
