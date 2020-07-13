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
const util = require('util');
const Connection = require("./Connection");
const HostAppClient = require("./HostAppClient");

function createDeferredPromise() {
    const obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

class CliClientController {
    constructor(uxp) {
        this.uxp = uxp;
        this._isConnected = false;
        this.appClients = [];
    }

    onConnectionReady() {
        console.info(`Connected to the UXP Developer Service running on port ${this._port}`);
        console.info(`Connecting to host apps supported by this plugin... `);
        // we wait for the hostapp clients to be added
        // crajTODO - we need to handle this in a better way -
        // May be we can just ask the cli client to sent the currently available host-list.
        const setTimeoutPromise = util.promisify(setTimeout);
        setTimeoutPromise(1000).then(() => {
            if (this._callerPromise) {
                if (this._connection) {
                    this._callerPromise.resolve();
                } else {
                    this._callerPromise.reject(new Error("Connection to service got terminated unexpectedly"));
                }
                this._callerPromise = null;
            }
        });
    }

    onConnectionError(err) {
        if (this._callerPromise) {
            if (err.code === "ECONNREFUSED") {
                const errorMsg = 'uxp cli service is not running. Start the cli service and try again.';
                this._callerPromise.reject(new Error(errorMsg));
            } else {
                this._callerPromise.reject(err);
            }
        }
    }

    reset() {
        this._callerPromise = null;
        if (this._connection) {
            this._connection.removeAllListeners();
            const connecion = this._connection;
            this._connection = null;
            connecion.terminate();
        }
    }

    onConnectionClose() {
        if (this._connection) {
            // Looks like the cli service got disconnected abruptly.
            this._connection.clearPendingCallbacks('Error: Connection to service got terminated unexpectedly');
        }
        this.reset();
    }

    _createConnection() {
        this._connection = new Connection();
        this._connection.on('ready', this.onConnectionReady.bind(this));
        this._connection.on('error', this.onConnectionError.bind(this));
        this._connection.on('close', this.onConnectionClose.bind(this));
    }

    _connectToServiceAtPort(port) {
        this._createConnection();
        this._port = port;
        const url = `ws://localhost:${port}/socket/cli`;
        this._callerPromise = createDeferredPromise();
        this._connection.connect(this, url);
        this._isConnected = true;
        return this._callerPromise.promise;
    }

    connectToService() {
        if (this._isConnected) {
            return Promise.resolve();
        }
        // first get the port details from devToolsHelper
        return this.uxp.devToolsMgr.getServicePort().then((port) => {
            return this._connectToServiceAtPort(port);
        });
    }

    disconnect() {
        this.reset();
    }

    sendMessageToAppWithReply(appEndPoint, message) {
        const hostAppClient = this._getHostAppClient(appEndPoint);
        if (!hostAppClient) {
            return Promise.reject(new Error("cli controller - No such app is connected to send required message"));
        }
        return hostAppClient.sendMessageWithReply(message);
    }

    addHostAppClient(data) {
        const appClient = new HostAppClient(this._connection, data);
        this.appClients.push(appClient);
    }

    removeHostAppClient(data) {
        _.remove(this.appClients, (client) => client.id === data.id);
    }

    getConnectedApps() {
        return this.appClients.map((client) => client.appEndPoint);
    }

    _getHostAppClient(appEndPoint) {
        return _.find(this.appClients, (client) => _.isEqual(client.appEndPoint, appEndPoint));
    }

    get port() {
        return this._port;
    }
}

module.exports = CliClientController;
