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
const DevToolsError = require("../../../common/DevToolsError");
const util = require("util");
const { CoreLogMessage, CoreErrorCodes }  = require("../../../common/ErrorCodes");

class PluginBaseCommand {
    constructor(pluginMgr) {
        this.pm = pluginMgr;
    }

    set pluginSession(session) {
        this._pluginSession = session;
    }

    get pluginSession() {
        return this._pluginSession;
    }

    get name() {
        return "";
    }

    execute() {
        return this.validateParams().then(() => {
            return this.executeCommand();
        });
    }

    executeCommand() {
    }

    validateParams() {
    }

    getPluginSessions() {
        const pluginSession = this._pluginSession;
        if (!pluginSession || !Array.isArray(pluginSession.sessions)) {
            throw new DevToolsError(DevToolsError.ErrorCodes.NO_PLUGIN_SESSION);
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

    _filterConnectedAppsFromApplicableList(applicableEndPoints) {
        const connectedApps = this.pm._cliClientMgr.getConnectedApps();
        const applicableAppsForDebugging = AppsHelper.filterConnectedAppsForPlugin(connectedApps, applicableEndPoints);

        if (!applicableAppsForDebugging.length) {
            throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
        }
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
        const applicableAppsList = this._filterConnectedAppsFromApplicableList(applicableEndPoints);
        const sessionDetails = this._getSessionDetailsForAppEndpoints(sessions, applicableAppsList);
        return sessionDetails;
    }

    sendMessageToAppsWithReply(appsEndPoint, messages) {
        const allPromises = [];
        const cliMgr = this.pm._cliClientMgr;
        const isArray = Array.isArray(messages);
        let index = 0;
        for (const app of appsEndPoint) {
            const message = isArray ? messages[index++] : messages;
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

    _sendMessageToAppsAndReconcileResults(appsList, messageList, resultsCallback) {
        const prom = this.sendMessageToAppsWithReply(appsList, messageList);
        const isSingleApp = appsList.length == 1;
        return prom.then((results) => {
            let failCount = 0;
            const successfullCommandResults = [];
            for (const result of results) {
                if (!result.success) {
                    ++failCount;
                    const commandFailedOnApp = util.format(CoreLogMessage.COMMAND_FAILED_ON_APP, this.name, result.app.id, result.app.version);
                    UxpLogger.error(commandFailedOnApp);
                }
                else {
                    const commandSuccessfullOnApp = util.format(CoreLogMessage.COMMAND_SUCCESSFUL_ON_APP, this.name, result.app.id, result.app.version);
                    UxpLogger.log(commandSuccessfullOnApp);
                    successfullCommandResults.push(result);
                }
            }
            if (failCount === results.length) {
                // all reqs have failed so mark this promise as failed
                if (failCount === 1) {
                    // only one app - just use the error code here -
                    throw results[0].err;
                }
                const code = isSingleApp ? CoreErrorCodes.COMMAND_FAILED_IN_APP : CoreErrorCodes.COMMAND_FAILED_IN_APP_MULTIPLE;
                throw new DevToolsError(code);
            }
            return resultsCallback ? resultsCallback(successfullCommandResults) : true;
        });
    }

    runCommandOnAllApplicableApps(jsonMessageCreator, resultsCallback) {
        const sessionDetails = this.getSessionDetailsOfApplicableApps(this.params.apps);
        const applicableAppsList = sessionDetails.map(ses => ses.app);
        const jsonMessagesList = sessionDetails.map((session) => jsonMessageCreator(session.pluginSessionId));
        return this._sendMessageToAppsAndReconcileResults(applicableAppsList, jsonMessagesList, resultsCallback);
    }
}
module.exports = PluginBaseCommand;
