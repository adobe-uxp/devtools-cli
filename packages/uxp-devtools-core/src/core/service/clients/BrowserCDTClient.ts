/*
 *  Copyright 2021 Adobe Systems Incorporated. All rights reserved.
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

import type { WebSocket } from 'ws';
import type AppClient from './AppClient.js';
import type { Server } from './Client.js';
import chalk from 'chalk';
import Client from './Client.js';

/*
*   Browser CDT Client is there to support workflows like WebDriver / Puppeteer.
*   These frameworks mainly look for the top - level "Browser Target", through which it interacts with the underlying Page - targets(the Extensions in UXP case)
*   https://pptr.dev/#?product=Puppeteer&version=v3.1.0&show=api-overview
*   Page in the above diagram corresponds to a UXP Extension / Plugin.
*   There is only one Browser Client - in this udt - cli case - this Browser client manages the
*   all the plugins loaded through it.
 */

// Client interface for event handling
interface ClientWithType extends Client {
  type: string;
  id: number;
}

class BrowserCDTClient extends Client {
  public uxpAppID: string | null;
  private _appClient: AppClient | null = null;

  override get type(): string {
    return 'browser_cdt_client';
  }

  static create(server: Server, socket: WebSocket, url: string): BrowserCDTClient {
    // url is of form  "/socket/browser_cdt/?uxp-app-id=PS" hence added a baseURL
    const cliUrl = new URL(url, 'http://127.0.0.1:14001');
    const searchParams = cliUrl.searchParams;
    const uxpAppID = searchParams.get('adobe-uxp-app-id');
    const browserCDTClient = new BrowserCDTClient(server, socket, uxpAppID);
    return browserCDTClient;
  }

  private _getSupportedAppClient(server: Server, uxpAppID: string | null): AppClient | null {
    let appClient: AppClient | null = null;
    server.clients.forEach((client) => {
      const typedClient = client as AppClient;
      if (typedClient.type === 'app' && typedClient.appInfo.appId === uxpAppID) {
        appClient = typedClient;
      }
    });
    return appClient;
  }

  private _handleBrowserCDTConnected(): void {
    this._appClient!.handleBrowserCDTConnected(this);
  }

  constructor(server: Server, socket: WebSocket, uxpAppID: string | null) {
    super(server, socket);
    this.handlesRawMessages = true;
    this.uxpAppID = uxpAppID;
    this._appClient = this._getSupportedAppClient(server, uxpAppID);
    if (!this._appClient) {
      UxpLogger.error(chalk.red(`There is no valid app  or plugin session applicable for this CDT client.`));
      return;
    }
    this._handleBrowserCDTConnected();
  }

  protected override handleClientRawMessage(rawCDTMessage: string): void {
    if (!this._appClient) {
      this.send({
        error: 'There is no valid app or plugin session applicable for this CDT client.',
      });
      return;
    }
    this._appClient.sendBrowserCDTMessage(rawCDTMessage);
  }

  on_clientDidDisconnect(client: ClientWithType): void {
    // If the client is not yet ready, we will just skip it.
    if (!this._appClient) {
      return;
    }
    if (client.type === 'app' && client.id === this._appClient.id) {
      // the app connection got closed - so terminate this cdt debugging session.
      this.handleHostPluginUnloaded();
    }
  }

  handleHostPluginUnloaded(): void {
    this._appClient = null;
    if (!this._socket) {
      throw new Error('Socket not set');
    }
    this._socket.close();
  }

  override handleDisconnect(): void {
    if (!this._appClient) {
      return;
    }
    this._appClient.handleBrowserCDTDisconnected();
    super.handleDisconnect();
  }
}

export default BrowserCDTClient;
