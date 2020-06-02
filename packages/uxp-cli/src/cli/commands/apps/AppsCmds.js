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

function handleAppsListCommand() {
    this.uxp.setMode('client');
    const prom = this.uxp.devToolsMgr.getAppsList();
    return prom.then((appsList) => {
        if (!appsList || !appsList.length) {
            console.warn("No host applications supporting the UXP Developer Tools were found. Please make sure that you have launched an application that supports UXP Developer Tools and try again.");
            return null;
        }
        const formattedList = appsList.map((app) => ({
            ID: app.appId,
            Version: app.appVersion,
            Name: app.name,
        }));
        console.table(formattedList);
        return formattedList;
    });
}

const appsListCommand = {
    command: 'list',
    description: 'Lists Adobe applications that support the UXP Developer Tool workflow.',
    handler: handleAppsListCommand,
};

module.exports = {
    appsListCommand,
};
