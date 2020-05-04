/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
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

const EventEmitter = require('events');

let lastId = 0;

class Client extends EventEmitter {
    constructor(server, socket) {
        super();

        this._id = ++lastId;
        this._server = server;
        this._socket = socket;
        this._nextRequestId = 0;
        this._requestsById = new Map();

        this._sendCallback = (err) => {
            if (err) {
                this._handleSendError(err);
            }
        };

        if (socket) {
            socket.on('message', this._handleClientMessage.bind(this));
        }
    }

    handleDisconnect() {
        // This method is called when the client connection is disconnected.
    }

    get id() {
        return this._id;
    }

    handleEvent(name, ...args) {
        const fn = this[`on_${name}`];
        if (fn) {
            fn.apply(this, args);
        }
    }

    _handleClientMessage(messageJson) {
        if (this.handlesRawMessages) {
            this.handleClientRawMessage(messageJson);
            return;
        }
        let message;
        try {
            message = JSON.parse(messageJson);
        } catch (err) {
            console.log('Error while parsing message from remote', this.type, messageJson);
            console.error(err);
            return;
        }

        if (!message) {
            console.log('Remote message is not an object', this.type, messageJson);
            return;
        }

        const fn = this[`msg_${message.command}`];
        if (fn) {
            fn.call(this, message);
        } else {
            console.warn('Invalid message', `${message.command}for client`, this.type, JSON.stringify(message, null, 4));
        }
    }

    _checkReqHandler(message, callback) {
        const fn = this[`handler_${message.command}`];
        if (fn) {
            fn.call(this, message, callback);
            return true;
        }
        return false;
    }

    handleRequestWithReply(message, callback) {
        const handled = this._checkReqHandler(message, callback);
        if (!handled) {
            this.sendRequest(message, callback);
        }
    }

    handleRequest(message, callback) {
        const handled = this._checkReqHandler(message, callback);
        if (!handled) {
            this.send(message, callback);
        }
    }

    send(data) {
        this._socket.send(JSON.stringify(data), this._sendCallback);
    }

    sendRaw(data) {
        this._socket.send(data, this._sendCallback);
    }

    msg_reply(data) {
        const { requestId } = data;
        const callback = this._requestsById.get(requestId);
        if (!callback) {
            console.error('Invalid request id received from ', this.type, data);
            return;
        }

        this._requestsById.delete(requestId);
        callback(null, data);
    }

    msg_proxy(data) {
        const client = this._server.getClientById(data.clientId);
        if (!client || !data.message) {
            console.error(`Invalid proxy request:${data.id}`);
            return;
        }

        const { requestId } = data;
        if (requestId) {
            client.handleRequestWithReply(data.message, (err, reply) => {
                if (err) {
                    console.error('Error while handling proxy request for', data.message, err);
                    return;
                }
                const request = reply;
                request.requestId = requestId;
                this.send(request, this._sendCallback);
            });
        } else {
            client.handleRequest(data.message, this._sendCallback);
        }
    }

    sendRequest(request, callback) {
        request.requestId = ++this._nextRequestId;
        this._requestsById.set(request.requestId, callback);
        this.send(request);
    }

    _handleSendError(err) {
        console.error('Error while sending message to remote', this.type, err);
    }
}

module.exports = Client;
