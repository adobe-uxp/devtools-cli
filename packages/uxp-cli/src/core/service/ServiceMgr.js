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

const Server = require("./Server");
const log = require("../../cli/utils/log");

class ServiceMgr {
    constructor(uxp) {
        this.uxp = uxp;
    }

    onServerReady() {
        log(`UXP Developer service started and running on port ${this._server.port}.`);
        this.uxp.devToolsMgr.setServerDetails(this._server.port);
    }

    start(port) {
        if (!port) {
            throw new Error("Invalid port number. Service need a valid port number to start.");
        }
        this._server = new Server(port);
        const onServerReady = this.onServerReady.bind(this);
        this._server.on('serverReady', onServerReady);
        this._server.run();
    }
}

module.exports = ServiceMgr;
