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
const { createDeferredPromise } = require("../helpers/CommonUtils");

class ServiceMgr {
    onServerReady() {
        this._serviceDeferredProm.resolve(true);
    }

    start(port) {
        if (!port) {
            Promise.reject(new Error("Invalid port number. Service need a valid port number to start."));
        }
        this._serviceDeferredProm = createDeferredPromise();
        try {
            this._server = new Server(port);
            const onServerReady = this.onServerReady.bind(this);
            this._server.on("serverReady", onServerReady);
            this._server.run();
        }
        catch (err) {
            return Promise.reject(err);
        }
        return this._serviceDeferredProm.promise;
    }

    handleAppQuit() {
        this._server.broadcastEvent("UDTAppQuit");
    }
}

module.exports = ServiceMgr;
