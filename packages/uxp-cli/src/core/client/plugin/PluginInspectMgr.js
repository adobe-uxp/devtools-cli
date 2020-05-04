/* eslint-disable global-require */
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

const uxpInspectApp = require("@adobe/uxp-inspect-app");

class PluginInspectMgr {
    static showInspectWindow(details, pm) {
        // eslint-disable-next-line prefer-destructuring
        const port = pm._cliClientMgr.port;
        if (!port) {
            throw new Error('Debug inspect window cannot be launched. Debug port number is invalid.');
        }
        // console.log(`Launching Uxp Inspect app ... `);
        uxpInspectApp("", details.app.id, details.app.version, details.data.wsdebugUrl);
        return Promise.resolve(true);
    }
}

module.exports = PluginInspectMgr;
