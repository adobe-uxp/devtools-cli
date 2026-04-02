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

import type { Buffer } from 'node:buffer';
import type { WebSocket } from 'ws';
import type {
  BaseMessage,
  RequestCallback,
} from '../../../types/index.js';
import EventEmitter from 'node:events';

// Types for the Server interface used by Client
interface Server {
  getClientById: (id: number) => Client | undefined;
  pluginSessionMgr: {
    getPluginFromHostSessionId: (sessionId: string) => unknown;
    getPluginFromSessionId: (sessionId: string) => unknown;
    removePlugin: (plugin: unknown) => void;
    getAppClientFromSessionId: (clients: Map<number, Client>, sessionId: string) => Client | null;
    addPlugin: (pluginId: string, pluginPath: string, hostSessionId: string, appInfo: unknown, existingClientSessionId?: string | null) => string;
  };
  localHostname: string;
  featureConfigMgr: {
    getConfigForHostApp: (appId: string, appVersion: string) => { isReloadSupported: () => boolean };
  };
  broadcastEvent: (name: string, ...args: unknown[]) => void;
  clients: Map<number, Client>;
}

let lastId = 0;

interface ClientEventMap {
  message: [message: Buffer | string];
  disconnect: [];
  connect: [];
}

class Client extends EventEmitter<ClientEventMap> {
  protected _id: number;
  protected _server: Server;
  protected _socket: WebSocket | null;
  protected _nextRequestId: number;
  protected _requestsById: Map<number, RequestCallback>;
  protected _sendCallback: (err?: Error) => void;

  // Allow raw message handling in subclasses
  public handlesRawMessages?: boolean;

  constructor(server: Server, socket: WebSocket | null) {
    super();

    this._id = ++lastId;
    this._server = server;
    this._socket = socket;
    this._nextRequestId = 0;
    this._requestsById = new Map();

    this._sendCallback = (err?: Error): void => {
      if (err) {
        this._handleSendError(err);
      }
    };

    if (socket) {
      socket.on('message', this._handleClientMessage.bind(this));
    }
    UxpLogger.verbose(`New Server client Connected : Type : ${this.type}`);
  }

  handleDisconnect(): void {
    // This method is called when the client connection is disconnected.
    UxpLogger.verbose(`Server Client Disconnected Type :  ${this.type}`);
  }

  get id(): number {
    return this._id;
  }

  get type(): string {
    return 'client';
  }

  handleEvent(name: string, ...args: unknown[]): void {
    const methodName = `on_${name}`;
    const fn = (this as unknown as Record<string, ((...args: unknown[]) => void) | undefined>)[methodName];
    if (fn) {
      fn.apply(this, args);
    }
  }

  protected _handleClientMessage(messageJson: Buffer | string): void {
    // todo: is this conversion needed in another place as well?
    const messageString = typeof messageJson === 'string' ? messageJson : messageJson.toString('utf8');
    if (this.handlesRawMessages) {
      this.handleClientRawMessage(messageString);
      return;
    }
    let message: BaseMessage;
    try {
      message = JSON.parse(messageString);
    }
    catch (err) {
      UxpLogger.log(`Error while parsing message from remote ${this.type}: ${messageString}`);
      UxpLogger.error(err instanceof Error ? err.message : String(err));
      return;
    }

    if (!message) {
      UxpLogger.verbose(`Remote message is not an object ${this.type}: ${messageString}`);
      return;
    }

    const methodName = `msg_${message.command}`;
    const fn = (this as unknown as Record<string, ((message: BaseMessage) => void) | undefined>)[methodName];
    if (fn) {
      fn.call(this, message);
    }
    else {
      UxpLogger.warn(`Invalid message ${message.command} for client ${this.type}: ${JSON.stringify(message, null, 4)}`);
    }
  }

  // Override this in subclasses that handle raw messages
  protected handleClientRawMessage(_rawMessage: string): void {
    // Default implementation does nothing
  }

  protected _checkReqHandler(message: BaseMessage, callback: RequestCallback): boolean {
    const methodName = `handler_${message.command}`;
    const fn = (this as unknown as Record<string, ((message: BaseMessage, callback: RequestCallback) => void) | undefined>)[methodName];
    if (fn) {
      fn.call(this, message, callback);
      return true;
    }
    return false;
  }

  handleRequestWithReply(message: BaseMessage, callback: RequestCallback): void {
    const handled = this._checkReqHandler(message, callback);
    if (!handled) {
      this.sendRequest(message, callback);
    }
  }

  handleRequest(message: BaseMessage, callback: RequestCallback): void {
    const handled = this._checkReqHandler(message, callback);
    if (!handled) {
      this.send(message);
    }
  }

  send(data: unknown): void {
    if (!this._socket) {
      throw new Error('Socket not set');
    }
    this._socket.send(JSON.stringify(data), this._sendCallback);
  }

  sendRaw(data: string): void {
    if (!this._socket) {
      throw new Error('Socket not set');
    }
    this._socket.send(data, this._sendCallback);
  }

  msg_reply(data: BaseMessage & { requestId?: number }): void {
    const { requestId } = data;
    if (requestId === undefined) {
      UxpLogger.verbose(`Reply message missing requestId ${this.type}: ${JSON.stringify(data)}`);
      return;
    }
    const callback = this._requestsById.get(requestId);
    if (!callback) {
      UxpLogger.verbose(`Invalid request id received from ${this.type}: ${JSON.stringify(data)}`);
      return;
    }

    this._requestsById.delete(requestId);
    callback(null, data);
  }

  msg_proxy(data: BaseMessage & { clientId?: number; message?: BaseMessage; requestId?: number }): void {
    const client = data.clientId !== undefined ? this._server.getClientById(data.clientId) : undefined;
    if (!client || !data.message) {
      UxpLogger.verbose(`Invalid proxy request:${(data as { id?: number }).id}`);
      return;
    }

    const { requestId } = data;
    if (requestId) {
      client.handleRequestWithReply(data.message, (err: Error | null, reply: BaseMessage) => {
        if (err) {
          UxpLogger.verbose(`Error while handling proxy request for ${JSON.stringify(data.message)} ${err}`);
          const errorReply: BaseMessage & { requestId: number } = {
            requestId,
            command: 'reply',
            error: err.message || String(err),
          };
          this.send(errorReply);
          return;
        }
        const request = reply as BaseMessage & { requestId?: number };
        request.requestId = requestId;
        this.send(request);
      });
    }
    else {
      client.handleRequest(data.message, (err: Error | null) => {
        if (err) {
          this._handleSendError(err);
        }
      });
    }
  }

  handleRequestTimeout(action: string, requestId: number, maxInterval: number): void {
    const timeoutReply: BaseMessage & { requestId: number } = {
      requestId,
      command: 'reply',
      error: `Plugin ${action} timed out. Check the host application to see if it is busy or in a modal state and try again.`,
    };
    setTimeout(() => {
      const callback = this._requestsById.get(requestId);
      if (!callback) {
        return;
      }
      this._requestsById.delete(requestId);
      callback(null, timeoutReply);
    }, maxInterval);
  }

  sendRequest(request: BaseMessage & { requestId?: number }, callback: RequestCallback): number {
    const requestId = ++this._nextRequestId;
    this._requestsById.set(requestId, callback);
    request.requestId = requestId;
    this.send(request);
    return requestId;
  }

  protected _handleSendError(err: Error): void {
    UxpLogger.error(`Error while sending message to remote ${this.type} ${err}`);
  }
}

export default Client;
export type { Server };
