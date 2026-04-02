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

import type {
  AppConnectionListener,
  AppEndPoint,
  BaseMessage,
  HostAppLogDetails,
  HostAppLogListener,
  PluginStateListener,
} from '../../../types/index.js';
import { find, isEqual, remove } from 'lodash-es';
import Connection from './Connection.js';
import HostAppClient from './HostAppClient.js';

interface HostAppClientData {
  id: number;
  app: {
    appId: string;
    appName: string;
    appVersion: string;
    uxpVersion: string;
  };
}

interface DidRemoveRuntimeClientData {
  id: number;
  app: {
    appId: string;
    appName: string;
    appVersion: string;
    uxpVersion: string;
  };
}

interface DidPluginUnloadedData {
  plugin: {
    pluginId: string;
  };
}

interface ConnectionError extends Error {
  code?: string;
}

function isErrorConnectionError(err: unknown): err is ConnectionError {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export class CliClientController {
  public appClients: HostAppClient[];
  private _appConnectionListener: AppConnectionListener | null = null;
  private _pluginStateListener: PluginStateListener | null = null;
  private _hostAppLogListener: HostAppLogListener | null = null;
  private _callerPromise: PromiseWithResolvers<void> | null = null;
  private _connection: Connection | null = null;
  private _port: number = 0;

  constructor() {
    this.appClients = [];
  }

  registerAppConnectionsListener(listener: AppConnectionListener): void {
    this._appConnectionListener = listener;
  }

  registerPluginStateListener(listener: PluginStateListener): void {
    this._pluginStateListener = listener;
  }

  registerHostAppLogListener(listener: HostAppLogListener): void {
    this._hostAppLogListener = listener;
  }

  onConnectionReady(): void {
    UxpLogger.log(`Connected to UXP Developer Tool Service at port ${this._port}`);
    if (this._callerPromise) {
      if (this._connection) {
        this._callerPromise.resolve();
      }
      else {
        this._callerPromise.reject(new Error('Connection to service got terminated unexpectedly'));
      }
      this._callerPromise = null;
    }
    if (this._appConnectionListener) {
      this._appConnectionListener('clientConnectionReady');
    }
  }

  onConnectionError(err: unknown): void {
    if (this._callerPromise) {
      if (isErrorConnectionError(err) && err.code === 'ECONNREFUSED') {
        const errorMsg = 'uxp cli service is not running. Start the cli service and try again.';
        this._callerPromise.reject(new Error(errorMsg));
      }
      else {
        this._callerPromise.reject(err);
      }
    }
    else if (typeof err === 'object' && err !== null && 'message' in err) {
      // Log error even if there's no pending promise
      UxpLogger.error(`Connection error: ${err.message || String(err)}`);
    }
    else {
      UxpLogger.error(`Connection error: ${String(err)}`);
    }
  }

  reset(): void {
    this._callerPromise = null;
    this.appClients = [];
    if (this._connection) {
      this._connection.removeAllListeners();
      const connection = this._connection;
      this._connection = null;
      connection.terminate();
    }
  }

  onConnectionClose(): void {
    if (this._connection) {
      // Looks like the cli service got disconnected abruptly.
      this._connection.clearPendingCallbacks('Error: Connection to service got terminated unexpectedly');
    }
    this.reset();

    if (this._appConnectionListener) {
      this._appConnectionListener('clientConnectionClosed');
    }
  }

  private _createConnection(): void {
    this._connection = new Connection();
    this._connection.on('ready', this.onConnectionReady.bind(this));
    this._connection.on('error', this.onConnectionError.bind(this));
    this._connection.on('close', this.onConnectionClose.bind(this));
  }

  private _connectToServiceAtPort(port: number): Promise<void> {
    this._createConnection();
    this._port = port;
    const url = `ws://127.0.0.1:${port}/socket/cli`;
    this._callerPromise = Promise.withResolvers<void>();
    this._connection!.connect(this, url);
    return this._callerPromise.promise;
  }

  connectToService(port: number): Promise<void> {
    if (this._connection) {
      return Promise.resolve();
    }
    return this._connectToServiceAtPort(port);
  }

  disconnect(): void {
    this.reset();
  }

  sendMessageToAppWithReply(appEndPoint: AppEndPoint, message: BaseMessage): Promise<BaseMessage> {
    if (!this._connection) {
      return Promise.reject(new Error('Websocket Connection to Service is not valid. Reconnect and try again.'));
    }
    const hostAppClient = this._getHostAppClient(appEndPoint);
    if (!hostAppClient) {
      return Promise.reject(new Error('cli controller - No such app is connected to send required message'));
    }
    return hostAppClient.sendMessageWithReply(this._connection, message);
  }

  addHostAppClient(data: HostAppClientData): void {
    const appClient = new HostAppClient(data);
    this.appClients.push(appClient);
    if (this._appConnectionListener) {
      this._appConnectionListener('appConnected', { id: data.app.appId, version: data.app.appVersion });
    }
  }

  removeHostAppClient(data: DidRemoveRuntimeClientData): void {
    remove(this.appClients, client => client.id === data.id);
    if (this._appConnectionListener) {
      this._appConnectionListener('appDisconnected', { id: data.app.appId, version: data.app.appVersion });
    }
  }

  getConnectedApps(): AppEndPoint[] {
    return this.appClients.map(client => client.appEndPoint);
  }

  private _getHostAppClient(appEndPoint: AppEndPoint): HostAppClient | undefined {
    return find(this.appClients, client => isEqual(client.appEndPoint, appEndPoint));
  }

  handlePluginUnload(data: DidPluginUnloadedData): void {
    if (this._pluginStateListener) {
      this._pluginStateListener('pluginUnloaded', data.plugin);
    }
  }

  handleHostAppLog(data: HostAppLogDetails): void {
    if (this._hostAppLogListener) {
      this._hostAppLogListener('hostAppLog', data);
    }
  }

  get port(): number {
    return this._port;
  }
}

export default CliClientController;
