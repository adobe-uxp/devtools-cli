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

const path = require("path");
const fs = require("fs");

// Manages the .uxprc resource config file - which stores details of the curent plugin session
// in a persistent way.
class UxpRCMgr {
    constructor() {
        this.uxprcPath = path.resolve(".uxprc");
    }

    _readRc() {
        let contents = "{}";
        if (fs.existsSync(this.uxprcPath)) {
            contents = fs.readFileSync(this.uxprcPath, "utf8");
        }
        return JSON.parse(contents);
    }

    _writeToRc(rcObj) {
        fs.writeFileSync(this.uxprcPath, JSON.stringify(rcObj, null, 4), "utf8");
    }

    setUxprcPath(uxprcDirPath) {
        this.uxprcPath = path.join(uxprcDirPath, ".uxprc");
    }

    _readEntry(key) {
        const rc = this._readRc();
        return rc[key];
    }

    _writeEntry(key, data) {
        const rc = this._readRc();
        rc[key] = data;
        this._writeToRc(rc);
    }

    readConfig() {
        return this._readEntry("config");
    }

    commitConfig(config) {
        this._writeEntry("config", config);
    }

    readPluginSession() {
        return this._readEntry("plugin");
    }

    writePluginSession(sessions, pluginInfo) {
        const plugin = this._readEntry("plugin") || {};
        plugin.sessions = plugin.sessions || [];
        plugin.info = pluginInfo || {};

        for (let session of sessions) {
            const index = plugin.sessions.findIndex(obj => (obj.app.id === session.app.id && obj.app.version === session.app.version));
            if (index >= 0) {
                plugin.sessions[index] = session;
            }
            else {
                plugin.sessions.push(session);
            }
        }

        this._writeEntry("plugin", plugin);
    }
}

module.exports = new UxpRCMgr();
