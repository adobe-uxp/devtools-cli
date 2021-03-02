/* eslint-disable global-require */
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

const { LoggerLevel } = require("../common/Utils");
const PluginSession = require("../client/plugin/PluginSession");
const ManifestHelper = require("../helpers/ManifestHelper");
const WatchServiceMgr = require("../common/WatchServiceMgr");

function createDeferredPromise() {
    const obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

function isPortAvailable(port) {
    const deferred = createDeferredPromise();
    const net = require("net");

    const sock = new net.Socket();
    sock.setTimeout(2000);
    sock.on("connect", () => {
        sock.destroy();
        deferred.resolve(false);
    }).on("error", () => {
        deferred.resolve(true);
    }).on("timeout", () => {
        deferred.resolve(true);
    }).connect(port, "127.0.0.1");

    return deferred.promise;
}

module.exports = {
    createDeferredPromise,
    isPortAvailable,
    PluginSession,
    LoggerLevel,
    ManifestHelper,
    WatchServiceMgr
};
