/* eslint-disable camelcase */
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
const EventEmitter = require("events");
const WebSocket = require("isomorphic-ws");

class Connection extends EventEmitter {
    connect(cliController, url) {
        const client = new WebSocket(url);

        client.onopen = this.onOpen.bind(this);
        client.onmessage = this.onMessage.bind(this);
        client.onerror = this.onError.bind(this);
        client.onclose = this.onClose.bind(this);

        this.socket = client;

        this._nextRequestId = 0;
        this._callbacks = new Map();
        this.cliController = cliController;
    }

    clearPendingCallbacks(msg) {
        this._callbacks.forEach((val) => {
            val.reject(new Error(msg));
        });
        this._callbacks.clear();
    }

    terminate() {
        if (this._isClosed) {
            return;
        }
        if (this.socket.terminate) {
            this.socket.terminate();
        }
        else {
            this.socket.close();
        }
    }

    onOpen() {

    }

    onError(evt) {
        console.error(evt)
        UxpLogger.error(`Websocket error ${evt}`);
        this.emit("error", evt);
    }

    onClose() {
        this._isClosed = true;
        this.emit("close");
    }

    onMessage(evt) {
        let data;
        try {
            data = JSON.parse(evt.data);
        }
        catch (e) {
            UxpLogger.error("Error while parsing the data from the socket.", e);
            return;
        }

        const handler = this[`msg_${data.command}`];
        if (!handler) {
            UxpLogger.error(data.error);
            return;
        }

        handler.call(this, data);
    }

    msg_didCompleteConnection() {
        // send the ready event so that we can now continue with the client side processing.
        this.emit("ready");
    }

    msg_didAddRuntimeClient(data) {
        this.cliController.addHostAppClient(data);
    }

    msg_didPluginUnloaded(data) {
        this.cliController.handlePluginUnload(data);
    }

    msg_hostAppLog(data) {
        this.cliController.handleHostAppLog(data.details);
    }

    _rejectClientCallbacks(clientId) {
        this._callbacks.forEach((val, key) => {
            if (val.clientId === clientId) {
                val.reject(new Error("App got disconnected from devtools service. Start the application and try again."));
                this._callbacks.delete(key);
            }
        });
    }

    msg_didRemoveRuntimeClient(data) {
        this.cliController.removeHostAppClient(data);
        // reject all callbacks - waiting on this client;
        this._rejectClientCallbacks(data.id);
    }

    msg_reply(data) {
        const { requestId } = data;
        if (!requestId) {
            return;
        }

        const callback = this._callbacks.get(requestId);
        if (!callback) {
            UxpLogger.error("client connection - no callback found for message reply");
            return;
        }
        this._callbacks.delete(requestId);

        if (data.error) {
            callback.reject(new Error(data.error));
            return;
        }

        callback.resolve(data);
    }

    sendMessage(message) {
        this.socket.send(JSON.stringify(message));
    }

    sendMessageWithReply(msg, clientId = undefined) {
        const message = msg;
        return new Promise((resolve, reject) => {
            message.requestId = ++this._nextRequestId;
            this._callbacks.set(message.requestId, { resolve, reject, clientId });
            this.socket.send(JSON.stringify(message));
        });
    }

    sendClientMessageWithReply(client, message) {
        return this.sendMessageWithReply({
            command: "proxy",
            clientId: client.id,
            message,
        }, client.id);
    }
}
module.exports = Connection;
