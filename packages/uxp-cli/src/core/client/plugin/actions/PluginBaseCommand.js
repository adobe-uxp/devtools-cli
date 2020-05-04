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

const _ = require("lodash");
const AppsHelper = require("../../../helpers/AppsHelper");

class PluginBaseCommand {
    constructor(pluginMgr) {
        this.pm = pluginMgr;
        this.pm.uxp.setMode('client');
    }

    get name() {
        return "";
    }

    execute() {
        const promise = this.validateParams().then(() => {
            return this.performPreSetup().then(() => {
                return this._executeCommandImpl().then((result) => {
                    return {
                        success: true,
                        data: result,
                    };
                }).catch((err) => {
                    return {
                        success: false,
                        err,
                    };
                }).then((result) => {
                    this.performPostCleanup();
                    if (!result.success) {
                        throw result.err;
                    }
                    return result.data;
                });
            });
        });
        return promise;
    }

    _executeCommandImpl() {
        try {
            return this.executeCommand();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    executeCommand() {
    }

    validateParams() {
    }

    performPreSetup() {
        return this.pm.connectToService();
    }

    performPostCleanup() {
        // Note: the assumption here is that - we run only one command in a given cli session.
        // if there are more than one command that run then we might need to
        // probably push the clean up the chain
        // eg: to PluginMgr to persist the connection till all the commands are executed.
        return this.pm.disconnect();
    }

    getPluginSessions() {
        const pluginSession = this.pm.getPluginSession();
        if (!pluginSession || !Array.isArray(pluginSession.sessions)) {
            throw new Error("This plugin doesn't have valid develop session. Ensure that it is currently loaded in the app. You can run load command first and try again.");
        }
        return pluginSession.sessions;
    }

    _getApplicableAppsForCommand(sessions, inputAppsList) {
        let loadedAppsEndPoints = sessions.map((session) => session.app);
        if (!this.params.apps.length) {
            return loadedAppsEndPoints;
        }
        loadedAppsEndPoints = AppsHelper.getApplicableAppsFromInput(loadedAppsEndPoints, inputAppsList);
        return loadedAppsEndPoints;
    }

    _filterForConnectedAppsFromApplicableList(applicableEndPoints) {
        const connectedApps = this.pm._cliClientMgr.getConnectedApps();
        const applicableAppsForDebugging = AppsHelper.filterConnectedAppsForPlugin(connectedApps, applicableEndPoints);

        if (!applicableAppsForDebugging.length) {
            throw new Error(`Failed to ${this.name} the plugin. None of the apps are running. Make sure the app is running and that the plugin is loaded in it.`);
        }
        let hostApps = "";
        for (let i = 0; i < applicableAppsForDebugging.length; i++) {
            hostApps += `${applicableAppsForDebugging[i].id} ${applicableAppsForDebugging[i].version}`;
        }
        console.log(`Found the following hosts: ${hostApps}`);

        return applicableAppsForDebugging;
    }

    _getSessionDetailsForAppEndpoints(sessions, aep) {
        const filtered = sessions.filter((session) => {
            const obj = _.find(aep, (ep) => _.isEqual(ep, session.app));
            return !!obj;
        });
        return filtered;
    }


    getSessionDetailsOfApplicableApps(inputAppsList) {
        const sessions = this.getPluginSessions();
        const applicableEndPoints = this._getApplicableAppsForCommand(sessions, inputAppsList);
        const applicableAppsList = this._filterForConnectedAppsFromApplicableList(applicableEndPoints);
        const sessionDetails = this._getSessionDetailsForAppEndpoints(sessions, applicableAppsList);
        return {
            sessionDetails,
            applicableAppsList,
        };
    }

    sendMessageToAppsWithReply(appsEndPoint, messages) {
        const allPromises = [];
        const cliMgr = this.pm._cliClientMgr;
        const isMsgList = Array.isArray(messages);
        let index = 0;
        for (const app of appsEndPoint) {
            const message = isMsgList ? messages[index++] : messages;
            let prom = cliMgr.sendMessageToAppWithReply(app, message);
            prom = prom.then((data) => ({
                success: true,
                data,
                app,
            })).catch((err) => ({
                success: false,
                err,
                app,
            }));
            allPromises.push(prom);
        }
        return Promise.all(allPromises);
    }

    runCommandOnAllApplicableApps(jsonMessageCreator, resultsCallback) {
        const { sessionDetails, applicableAppsList } = this.getSessionDetailsOfApplicableApps(this.params.apps);
        console.log(`Sending ${this.name} command to hosts...`);
        const reloadJsonMsgList = sessionDetails.map((session) => jsonMessageCreator(session.pluginSessionId));

        const reloadReqProm = this.sendMessageToAppsWithReply(applicableAppsList, reloadJsonMsgList);
        return reloadReqProm.then((results) => {
            let failCount = 0;
            const successfullDebugResults = [];
            for (const result of results) {
                if (!result.success) {
                    ++failCount;
                    console.error(`Failed to ${this.name} the plugin in app id ${result.app.id} and version ${result.app.version}`);
                } else {
                    successfullDebugResults.push(result);
                }
            }
            if (failCount === results.length) {
                // all reqs have failed so mark this promise as failed
                if (failCount === 1) {
                    // only one app - just use the error code here -
                    throw results[0].err;
                }
                throw new Error(`Plugin ${this.name} command failed. Failed to load in any of the connected apps`);
            }
            return resultsCallback ? resultsCallback(successfullDebugResults) : true;
        });
    }
}
module.exports = PluginBaseCommand;
