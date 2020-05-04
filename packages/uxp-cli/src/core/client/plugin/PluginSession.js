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
const UxpRcMgr = require("../../common/UxpRCMgr");

class PluginSession {
    static createFromRcFile() {
        const sessions = UxpRcMgr.readPluginSession();
        return new PluginSession(sessions);
    }

    static createFromLoadResults(loadResults) {
        const sessions = loadResults.map((res) => {
            const { app, data } = res;
            return {
                app,
                pluginSessionId: data.pluginSessionId,
            };
        });
        return new PluginSession(sessions);
    }

    constructor(sessions) {
        this._sessions = sessions;
    }

    get sessions() {
        return this._sessions;
    }

    getSessionForApp(appEndPoint) {
        return _.find(this._sessions, (ses) => {
            _.isEqual(ses.app, appEndPoint);
        });
    }

    commitToRc() {
        UxpRcMgr.writePluginSession(this._sessions);
    }
}

module.exports = PluginSession;
