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
/* eslint-disable class-methods-use-this */
const DevToolsHelper = require("@adobe-fixed-uxp/uxp-devtools-helper");

class DevToolsMgr {
    constructor(isServer) {
        this._devToolsHelper = new DevToolsHelper(isServer);
    }

    setServerDetails(port) {
        this._devToolsHelper.setServerDetails(port);
    }

    getAppsList() {
        return Promise.resolve(this._devToolsHelper.getAppsList());
    }

    disableDevTools(options) {
        return DevToolsHelper.disableDevTools(options);
    }

    enableDevTools(options) {
        return DevToolsHelper.enableDevTools(options);
    }

    isDevToolsEnabled() {
        return DevToolsHelper.isDevToolsEnabled();
    }

    discoverServicePort() {
        return this._devToolsHelper.getServicePort();
    }

    terminate() {
        this._devToolsHelper.terminate();
    }
}

module.exports = DevToolsMgr;
