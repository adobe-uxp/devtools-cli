/* eslint-disable no-plusplus */
/* eslint-disable global-require */
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

const EventEmitter = require('events');
const express = require('express');
const path = require('path');
const http = require('http');
const os = require('os');
const WebSocket = require('ws');
const log = require("../../cli/utils/log");
const PluginSessionMgr = require("./PluginSessionMgr");

class Server extends EventEmitter {
    constructor(port) {
        super();

        this._port = port;
        this._pluginSessionMgr = new PluginSessionMgr();

        this._clientsById = new Map();
        this._v8DebuggerClients = new Map();
        this._v8BreakOnStart = false;

        this._app = express();
        this._httpServer = http.createServer(this._app);

        // Serve the static folder.
        const publicFolder = path.resolve(path.dirname(__filename), 'public');
        this._app.use(express.static(publicFolder));

        // Create the WebSocket.
        this._io = new WebSocket.Server({ server: this._httpServer });
        this._io.on('connection', this._handleSocketConnection.bind(this));

        // Make sure to listen for error messages on _io to avoid crashes when some error
        // is dispatched and we don't have a listener.
        this._io.on('error', (err) => {
            if (err.code !== 'EADDRINUSE') {
                log.error('WebSocket error:', err);
            }
        });
    }

    get pluginSessionMgr() {
        return this._pluginSessionMgr;
    }

    _getClientClassForUrl(url) {
        if (url === "/socket/cli") {
            return require("./clients/UxpCliClient");
        }
        if (url.startsWith("/socket/cdt/")) {
            return require("./clients/CDTClient");
        }
        return require("./clients/AppClient");
    }

    _handleSocketConnection(socket, req) {
        // WS changed the way it sends the initial upgrade request.
        // Newer versions pass it dirrectly to the connection event handler.
        const url = req ? req.url : socket.upgradeReq.url;

        const ClientClass = this._getClientClassForUrl(url);
        if (!ClientClass) {
            log.error('Invalid socket url', url);
            socket.close(1000, 'Invalid socket url.');
            return;
        }

        let client;
        if (ClientClass.create) {
            client = ClientClass.create(this, socket, url);
            if (!client) {
                log.error('Cannot create socket client for url', url);
                socket.close(1000, 'Invalid socket url.');
                return;
            }
        } else {
            client = new ClientClass(this, socket);
        }

        socket.once('close', () => {
            client.handleDisconnect();
            this._clientsById.delete(client.id);
            this.broadcastEvent('clientDidDisconnect', client);
        });

        this._clientsById.set(client.id, client, url);

        for (const otherClient of this._clientsById.values()) {
            if (otherClient !== client) {
                // First let the new client know about existing clients.
                client.handleEvent('clientDidConnect', otherClient);

                // Second let the others know about the new client.
                otherClient.handleEvent('clientDidConnect', client);
            }
        }
    }

    get clients() {
        return this._clientsById;
    }

    getClientById(id) {
        return this._clientsById.get(id);
    }


    broadcastEvent(name, ...args) {
        for (const client of this._clientsById.values()) {
            client.handleEvent(name, ...args);
        }
    }

    run() {
        const port = this._port;
        const onError = (err) => {
            if (err.code === 'EADDRINUSE') {
                log.error(`Service failed to start : Port number ${port} already in use.`);
            } else {
                log.error(`Service failed with Websocket error ${err}`);
            }
        };

        // Make sure we catch the error before any other socket.
        this._httpServer.on('error', onError);
        this._httpServer.on('listening', () => {
            this._io.removeListener('error', onError);
            const { port: newPort } = this._httpServer.address();
            // log(`Server listening on port ${newPort} ... `);
            this._port = newPort;

            this.updateIpAddress();
        });

        try {
            this._httpServer.listen(port);
        } catch (err) {
            onError(err);
        }
    }

    updateIpAddress() {
        this._serverIp = this._lookupIpAddress();

        // log(`Web socket url: ${chalk.cyan(this.localSocketUrl)}`);
        // log(`Web server url: ${chalk.cyan(this.localServerUrl)}`);

        this.emit('serverReady');
    }

    _lookupIpAddress() {
        const interfaces = os.networkInterfaces();

        function lookup(typeRegExp) {
            const names = Object.keys(interfaces)
                .filter((ifname) => typeRegExp.test(ifname));

            for (let i = names.length - 1; i >= 0; --i) {
                for (const iface of interfaces[names[i]]) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        return iface.address;
                    }
                }
            }
            return null;
        }

        // utun is used by cisco anyconnect
        return lookup(/^utun/) || lookup(/^en/) || lookup(/^lo/) || '127.0.0.1';
    }

    get port() {
        return this._httpServer.address().port;
    }

    get remoteHostname() {
        return `${this._serverIp}:${this.port}`;
    }

    get localHostname() {
        return `127.0.0.1:${this.port}`;
    }

    get remoteSocketUrl() {
        return `ws://${this.remoteHostname}`;
    }

    get localSocketUrl() {
        return `ws://${this.localHostname}`;
    }

    get localServerUrl() {
        return `http://${this.localHostname}`;
    }
}

module.exports = Server;
