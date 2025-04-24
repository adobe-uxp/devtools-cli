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

const Client = require("./Client");
const chalk = require("chalk");

/*
*   Browser CDT Client is there to support workflows like WebDriver / Puppeteer.
*   These frameworks mainly look for the top - level "Browser Target", through which it interacts with the underlying Page - targets(the Extensions in UXP case)
*   https://pptr.dev/#?product=Puppeteer&version=v3.1.0&show=api-overview
*   Page in the above diagram corresponds to a UXP Extension / Plugin.
*   There is only one Browser Client - in this udt - cli case - this Browser client manages the
*   all the plugins loaded through it.
 */

class BrowserCDTClient extends Client {
    get type() {
        return "browser_cdt_client";
    }

    static create(server, socket, url) {
        // url is of form  "/socket/browser_cdt/?uxp-app-id=PS" hence added a baseURL
        let cliUrl = new URL(url, "http://127.0.0.1:14001");
        const searchParams = cliUrl.searchParams;
        const uxpAppID = searchParams.get("adobe-uxp-app-id");
        let browserCDTClient =  new BrowserCDTClient(server, socket, uxpAppID);
        return browserCDTClient;
    }

    _getSupportedAppClient(server, uxpAppID) {
        let appClient = null;
        server.clients.forEach((client) => {
            if (client.type === "app" && client.appInfo.appId == uxpAppID) {
                appClient = client;
            }
        });
        return appClient;
    }

    _handleBrowserCDTConnected() {
        this._appClient.handleBrowserCDTConnected(this);
    }

    constructor(server, socket, uxpAppID) {
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

    handleClientRawMessage(rawCDTMessage) {
        if (!this._appClient) {
            this.send({
                error: "There is no valid app or plugin session applicable for this CDT client.",
            });
            return;
        }
        this._appClient.sendBrowserCDTMessage(rawCDTMessage);
    }

    on_clientDidDisconnect(client) {
        // If the client is not yet ready, we will just skip it.
        if (!this._appClient) {
            return;
        }
        if (client.type === "app" && client.id === this._appClient.id) {
            // the app connection got closed - so terminate this cdt debugging session.
            this.handleHostPluginUnloaded();
        }
    }

    handleHostPluginUnloaded() {
        this._appClient = null;
        this._socket.close();
    }

    handleDisconnect() {
        if (!this._appClient) {
            return;
        }
        this._appClient.handleBrowserCDTDisconnected(this);
        super.handleDisconnect();
    }
}

module.exports = BrowserCDTClient;
