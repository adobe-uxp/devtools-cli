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
  BaseMessage,
  HostAppLogDetails,
} from '../../../types/index.js';
import type { CliClientController } from './CliClientController.js';
import EventEmitter from 'node:events';

interface RequestCallback {
  resolve: (value: BaseMessage) => void;
  reject: (reason: Error) => void;
  clientId?: number;
}

interface DidAddRuntimeClientData extends BaseMessage {
  id: number;
  app: {
    appId: string;
    appName: string;
    appVersion: string;
    uxpVersion: string;
  };
}

interface DidRemoveRuntimeClientData extends BaseMessage {
  id: number;
  app: {
    appId: string;
    appName: string;
    appVersion: string;
    uxpVersion: string;
  };
}

interface DidPluginUnloadedData extends BaseMessage {
  plugin: {
    pluginId: string;
  };
}

interface HostAppLogData extends BaseMessage {
  details: HostAppLogDetails;
}

export interface ClientInfo {
  id: number;
}

type ConnectionHandler = (data: BaseMessage) => void;

export type ConnectionErrorEvent = Parameters<NonNullable<WebSocket['onerror']>>[0];
interface ConnectionEventMap {
  ready: [];
  error: [err: ConnectionErrorEvent];
  close: [];
}
class Connection extends EventEmitter<ConnectionEventMap> {
  private socket!: WebSocket;
  private _nextRequestId: number = 0;
  private _callbacks: Map<number, RequestCallback> = new Map();
  private _isClosed: boolean = false;
  public cliController!: CliClientController;

  connect(cliController: CliClientController, url: string): void {
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

  clearPendingCallbacks(msg: string): void {
    this._callbacks.forEach((val) => {
      val.reject(new Error(msg));
    });
    this._callbacks.clear();
  }

  terminate(): void {
    if (this._isClosed) {
      return;
    }
    this.socket.close();
  }

  onOpen(): void {
    // Connection opened
  }

  onError(evt: ConnectionErrorEvent): void {
    console.error(evt);
    UxpLogger.error(`Websocket error ${evt.type}`);
    this.emit('error', evt);
  }

  onClose(): void {
    this._isClosed = true;
    this.emit('close');
  }

  onMessage(evt: MessageEvent): void {
    let data: BaseMessage;
    try {
      data = JSON.parse(evt.data as string) as BaseMessage;
    }
    catch (e) {
      UxpLogger.error(`Error while parsing the data from the socket: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }

    const handlerName = `msg_${data.command}`;
    const handler = (this as unknown as Record<string, ConnectionHandler | undefined>)[handlerName];
    if (!handler) {
      UxpLogger.error(data.error || 'Unknown error');
      return;
    }

    handler.call(this, data);
  }

  msg_didCompleteConnection(): void {
    // send the ready event so that we can now continue with the client side processing.
    this.emit('ready');
  }

  msg_didAddRuntimeClient(data: DidAddRuntimeClientData): void {
    this.cliController.addHostAppClient(data);
  }

  msg_didPluginUnloaded(data: DidPluginUnloadedData): void {
    this.cliController.handlePluginUnload(data);
  }

  msg_hostAppLog(data: HostAppLogData): void {
    this.cliController.handleHostAppLog(data.details);
  }

  private _rejectClientCallbacks(clientId: number): void {
    this._callbacks.forEach((val, key) => {
      if (val.clientId === clientId) {
        val.reject(new Error('App got disconnected from devtools service. Start the application and try again.'));
        this._callbacks.delete(key);
      }
    });
  }

  msg_didRemoveRuntimeClient(data: DidRemoveRuntimeClientData): void {
    this.cliController.removeHostAppClient(data);
    // reject all callbacks - waiting on this client;
    this._rejectClientCallbacks(data.id);
  }

  msg_reply(data: BaseMessage): void {
    const { requestId } = data;
    if (!requestId) {
      return;
    }

    const callback = this._callbacks.get(requestId);
    if (!callback) {
      UxpLogger.error('client connection - no callback found for message reply');
      return;
    }
    this._callbacks.delete(requestId);

    if (data.error) {
      callback.reject(new Error(data.error));
      return;
    }

    callback.resolve(data);
  }

  sendMessage(message: BaseMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  sendMessageWithReply(msg: BaseMessage, clientId: number | undefined = undefined): Promise<BaseMessage> {
    const message = msg;
    return new Promise((resolve, reject) => {
      message.requestId = ++this._nextRequestId;
      this._callbacks.set(message.requestId, { resolve, reject, clientId });
      this.socket.send(JSON.stringify(message));
    });
  }

  sendClientMessageWithReply(client: ClientInfo, message: BaseMessage): Promise<BaseMessage> {
    return this.sendMessageWithReply({
      command: 'proxy',
      clientId: client.id,
      message,
    } as BaseMessage & { clientId: number; message: BaseMessage }, client.id);
  }
}

export default Connection;
