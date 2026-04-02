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

import type { Application, Request, Response } from 'express';
import type { WebSocket } from 'ws';
import EventEmitter from 'node:events';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';

import AppClient from './clients/AppClient.js';
import BrowserCDTClient from './clients/BrowserCDTClient.js';
import CDTClient from './clients/CDTClient.js';
import UxpCliClient from './clients/UxpCliClient.js';
import FeatureConfigMgr from './FeatureConfigMgr.js';
import PluginSessionMgr from './PluginSessionMgr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kBrowserCDTSocketEndPoint = '/socket/browser_cdt/';

interface ClientConstructor {
  new (server: Server, socket: WebSocket): Client;
  create?: (server: Server, socket: WebSocket, url: string) => Client | null;
}

interface Client {
  id: number;
  type?: string;
  handleDisconnect: () => void;
  handleEvent: (name: string, ...args: unknown[]) => void;
}

interface _NetworkInterface {
  family: string;
  internal: boolean;
  address: string;
}

interface ServerEventMap {
  socketConnection: [socket: WebSocket, req: http.IncomingMessage];
  serverReady: [];
}

class Server extends EventEmitter<ServerEventMap> {
  private _port: number;
  private _pluginSessionMgr: PluginSessionMgr;
  private _featureConfigMgr: FeatureConfigMgr;
  private _clientsById: Map<number, Client>;
  private _app: Application;
  private _httpServer: http.Server;
  private _io: WebSocketServer;
  private _serverIp?: string;

  constructor(port: number) {
    super();
    this._port = port;
    this._pluginSessionMgr = new PluginSessionMgr();
    this._featureConfigMgr = FeatureConfigMgr.instance();

    this._clientsById = new Map();

    this._app = express();
    this._httpServer = http.createServer(this._app);

    // Serve the static folder.
    const publicFolder = path.resolve(__dirname, 'public');
    this._app.use(express.static(publicFolder));

    // Create the WebSocket.
    this._io = new WebSocketServer({ server: this._httpServer });
    this._io.on('connection', this._handleSocketConnection.bind(this));

    // Make sure to listen for error messages on _io to avoid crashes when some error
    // is dispatched and we don't have a listener.
    this._io.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code !== 'EADDRINUSE') {
        UxpLogger.error(`WebSocket error: ${err.name} ${err.message} ${String(err)}`);
        console.error(err);
      }
    });
  }

  get pluginSessionMgr(): PluginSessionMgr {
    return this._pluginSessionMgr;
  }

  get featureConfigMgr(): FeatureConfigMgr {
    return this._featureConfigMgr;
  }

  private _getClientClassForUrl(url: string): ClientConstructor {
    if (url === '/socket/cli') {
      return UxpCliClient as unknown as ClientConstructor;
    }
    if (url.includes(kBrowserCDTSocketEndPoint)) { // sample url:  /socket/browser_cdt/?adobe-uxp-app-id=PS"
      return BrowserCDTClient as unknown as ClientConstructor;
    }
    if (url.startsWith('/socket/cdt/')) {
      return CDTClient as unknown as ClientConstructor;
    }
    return AppClient as unknown as ClientConstructor;
  }

  private _handleSocketConnection(socket: WebSocket, req: http.IncomingMessage): void {
    this.emit('socketConnection', socket, req);

    // WS changed the way it sends the initial upgrade request.
    // Newer versions pass it dirrectly to the connection event handler.
    const url = req ? req.url! : (socket as unknown as { upgradeReq: { url: string } }).upgradeReq.url;

    const ClientClass = this._getClientClassForUrl(url);
    if (!ClientClass) {
      UxpLogger.error(`Invalid socket url: ${url}`);
      socket.close(1000, 'Invalid socket url.');
      return;
    }

    let client: Client;
    if (ClientClass.create) {
      const createdClient = ClientClass.create(this, socket, url);
      if (!createdClient) {
        UxpLogger.error(`Cannot create socket client for url: ${url}`);
        socket.close(1000, 'Invalid socket url.');
        return;
      }
      client = createdClient;
    }
    else {
      client = new ClientClass(this, socket);
    }

    socket.once('close', () => {
      client.handleDisconnect();
      this._clientsById.delete(client.id);
      this.broadcastEvent('clientDidDisconnect', client);
    });

    this._clientsById.set(client.id, client);

    for (const otherClient of this._clientsById.values()) {
      if (otherClient !== client) {
        // First let the new client know about existing clients.
        client.handleEvent('clientDidConnect', otherClient);

        // Second let the others know about the new client.
        otherClient.handleEvent('clientDidConnect', client);
      }
    }

    // let the client know that the connection is ready
    client.handleEvent('completedConnection');
  }

  get clients(): Map<number, Client> {
    return this._clientsById;
  }

  getClientById(id: number): Client | undefined {
    return this._clientsById.get(id);
  }

  broadcastEvent(name: string, ...args: unknown[]): void {
    for (const client of this._clientsById.values()) {
      client.handleEvent(name, ...args);
    }
  }

  run(): void {
    const port = this._port;
    const onError = (err: NodeJS.ErrnoException): void => {
      if (err.code === 'EADDRINUSE') {
        UxpLogger.error(`Service failed to start: Port number ${port} already in use.`);
      }
      else {
        UxpLogger.error(`Service failed with Websocket error: ${String(err)}`);
      }
    };

    // Make sure we catch the error before any other socket.
    this._httpServer.on('error', onError);
    this._httpServer.on('listening', () => {
      this._io.removeListener('error', onError);
      const address = this._httpServer.address();
      const newPort = typeof address === 'object' && address ? address.port : this._port;
      // log(`Server listening on port ${newPort} ... `);
      this._port = newPort;
      this.updateIpAddress();
      this._defineChromeInspectEndPoints();
    });

    try {
      this._httpServer.listen(port, '127.0.0.1');
    }
    catch (err) {
      onError(err as NodeJS.ErrnoException);
    }
  }

  private _defineChromeInspectEndPoints(): void {
    this._app.get('/json/version', (_request: Request, response: Response) => {
      const localBrowserSocketEndpoint = this.localSocketUrl + kBrowserCDTSocketEndPoint;
      const browserEndPoint = {
        'Browser': 'Adobe UXP/1.0.0',
        'Protocol-Version': '1.3',
        'User-Agent': 'Adobe UXP UDT CLI 1.0.0',
        'V8-Version': '8.3',
        'webSocketDebuggerUrl': localBrowserSocketEndpoint,
      };
      response.json(browserEndPoint);
    });
    this._app.get('/json/list', (_request: Request, response: Response) => {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      /*
      * send empty list - for now, we are not listing the devtools plugins as page targets yet.
      * if we want to support this - we need to get the CDTClient end-points of all the currently
      * loaded plugins and then send their details here.
      */
      response.write(JSON.stringify({}));
    });
  }

  updateIpAddress(): void {
    this._serverIp = this._lookupIpAddress();

    // log(`Web socket url: ${chalk.cyan(this.localSocketUrl)}`);
    // log(`Web server url: ${chalk.cyan(this.localServerUrl)}`);

    this.emit('serverReady');
  }

  private _lookupIpAddress(): string {
    const interfaces = os.networkInterfaces();

    function lookup(typeRegExp: RegExp): string | null {
      const names = Object.keys(interfaces)
        .filter(ifname => typeRegExp.test(ifname));

      for (let i = names.length - 1; i >= 0; --i) {
        const interfaceName = names[i];
        if (!interfaceName)
          continue;
        const networkInterfaces = interfaces[interfaceName];
        if (!networkInterfaces)
          continue;
        for (const iface of networkInterfaces) {
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

  get port(): number {
    const address = this._httpServer.address();
    return typeof address === 'object' && address ? address.port : this._port;
  }

  get remoteHostname(): string {
    return `${this._serverIp}:${this.port}`;
  }

  get localHostname(): string {
    return `127.0.0.1:${this.port}`;
  }

  get remoteSocketUrl(): string {
    return `ws://${this.remoteHostname}`;
  }

  get localSocketUrl(): string {
    return `ws://${this.localHostname}`;
  }

  get localServerUrl(): string {
    return `http://${this.localHostname}`;
  }

  /**
   * Gracefully closes the server, disconnecting all clients and stopping the HTTP/WebSocket servers.
   * @returns A promise that resolves when the server has fully closed.
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close all connected WebSocket clients
      for (const client of this._io.clients) {
        client.close(1000, 'Server shutting down');
      }

      // Close the WebSocket server
      this._io.close();

      this._httpServer.closeAllConnections();

      // Close the HTTP server
      this._httpServer.close((err) => {
        if (err) {
          reject(err);
        }
        else {
          this._clientsById.clear();
          resolve();
        }
      });
    });
  }
}

export default Server;
