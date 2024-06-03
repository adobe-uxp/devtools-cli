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
    constructor() {
        this.appClients = [];
    }

    registerAppConnectionsListener(listener) {
        this._appConnectionListener = listener;
    }

    registerPluginStateListener(listener) {
        this._pluginStateListener = listener;
    }

    registerHostAppLogListener(listener) {
        this._hostAppLogListener = listener;
    }

    onConnectionReady() {
        UxpLogger.log(`Connected to UXP Developer Tool Service at port ${this._port}`);
        if (this._callerPromise) {
            if (this._connection) {
                this._callerPromise.resolve();
            }
            else {
                this._callerPromise.reject(new Error("Connection to service got terminated unexpectedly"));
            }
            this._callerPromise = null;
        }
        if (this._appConnectionListener) {
            this._appConnectionListener("clientConnectionReady");
        }
    }

    onConnectionError(err) {
        if (this._callerPromise) {
            if (err.code === "ECONNREFUSED") {
                const errorMsg = "uxp cli service is not running. Start the cli service and try again.";
                this._callerPromise.reject(new Error(errorMsg));
            }
            else {
                this._callerPromise.reject(err);
            }
        }
    }

    reset() {
        this._callerPromise = null;
        this.appClients = [];
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
            this._connection.clearPendingCallbacks("Error: Connection to service got terminated unexpectedly");
        }
        this.reset();

        if (this._appConnectionListener) {
            this._appConnectionListener("clientConnectionClosed");
        }
    }

    _createConnection() {
        this._connection = new Connection();
        this._connection.on("ready", this.onConnectionReady.bind(this));
        this._connection.on("error", this.onConnectionError.bind(this));
        this._connection.on("close", this.onConnectionClose.bind(this));
    }

    _connectToServiceAtPort(port) {
        this._createConnection();
        this._port = port;
        const url = `ws://127.0.0.1:${port}/socket/cli`;
        this._callerPromise = createDeferredPromise();
        this._connection.connect(this, url);
        return this._callerPromise.promise;
    }

    connectToService(port) {
        if (this._connection) {
            return Promise.resolve();
        }
        return this._connectToServiceAtPort(port);
    }

    disconnect() {
        this.reset();
    }

    sendMessageToAppWithReply(appEndPoint, message) {
        if (!this._connection) {
            return Promise.reject(new Error("Websocket Connection to Service is not valid. Reconnect and try again."));
        }
        const hostAppClient = this._getHostAppClient(appEndPoint);
        if (!hostAppClient) {
            return Promise.reject(new Error("cli controller - No such app is connected to send required message"));
        }
        return hostAppClient.sendMessageWithReply(this._connection, message);
    }

    addHostAppClient(data) {
        const appClient = new HostAppClient(data);
        this.appClients.push(appClient);
        if (this._appConnectionListener) {
            this._appConnectionListener("appConnected", data.app);
        }
    }

    removeHostAppClient(data) {
        _.remove(this.appClients, (client) => client.id === data.id);
        if (this._appConnectionListener) {
            this._appConnectionListener("appDisconnected", data.app);
        }
    }

    getConnectedApps() {
        return this.appClients.map((client) => client.appEndPoint);
    }

    _getHostAppClient(appEndPoint) {
        return _.find(this.appClients, (client) => _.isEqual(client.appEndPoint, appEndPoint));
    }

    handlePluginUnload(data) {
        if (this._pluginStateListener) {
            this._pluginStateListener("pluginUnloaded", data.plugin);
        }
    }

    handleHostAppLog(data) {
        if (this._hostAppLogListener) {
            this._hostAppLogListener("hostAppLog", data);
        }
    }

    get port() {
        return this._port;
    }
}

module.exports = CliClientController;
