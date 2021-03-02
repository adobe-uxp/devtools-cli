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

const ServiceMgr = require("../service/ServiceMgr");
const DevToolsMgr = require("../common/DevToolsMgr");

class UxpDevToolsServer {
    constructor() {
        this._serviceMgr = new ServiceMgr();
        this._devToolsMgr = new DevToolsMgr(true);
    }

    enableDevTools(options = null) {
        return this._devToolsMgr.enableDevTools(options);
    }

    disableDevTools(options = null) {
        return this._devToolsMgr.disableDevTools(options);
    }

    isDevToolsEnabled() {
        return this._devToolsMgr.isDevToolsEnabled();
    }

    startServer(port) {
        const prom = this._serviceMgr.start(port);
        return prom.then(() => {
            UxpLogger.log(`UXP Developer Service now running at port ${port}`);
            // set the server port details - so that it can be discovered by
            // clients via Vulcan Messages.
            this.setServerDetails(port);
            return true;
        });
    }

    handleAppQuit() {
        this._serviceMgr.handleAppQuit();
    }

    setServerDetails(port) {
        this._devToolsMgr.setServerDetails(port);
    }
}

module.exports = UxpDevToolsServer;
