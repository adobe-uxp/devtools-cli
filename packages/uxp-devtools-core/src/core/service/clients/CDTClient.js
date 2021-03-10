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

const Client = require("./Client");

class CDTClient extends Client {
    // eslint-disable-next-line class-methods-use-this
    get type() {
        return "cdt_client";
    }

    static create(server, socket, url) {
        const urlComps = url.split("/");
        return new CDTClient(server, socket, urlComps[urlComps.length - 1]);
    }

    constructor(server, socket, clientSessionId) {
        super(server, socket);
        this._appClient = server.pluginSessionMgr.getAppClientFromSessionId(server.clients, clientSessionId);
        const pluginDetails = server.pluginSessionMgr.getPluginFromSessionId(clientSessionId);
        if (!this._appClient || !pluginDetails) {
            this._appClient = null;
            return;
        }
        this._plugin = pluginDetails;
        this._plugin.setCDTClient(this);
        this.handlesRawMessages = true;
        this._appClient.handlePluginCDTConnected(this._plugin.hostPlugInSessionId);
    }

    handleClientRawMessage(rawCDTMessage) {
        if (!this._appClient) {
            this.send({
                error: "There is no valid app or plugin session applicable for this CDT client.",
            });
            return;
        }
        this._appClient.sendCDTMessage(rawCDTMessage, this._plugin.hostPlugInSessionId);
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
        this._plugin.setCDTClient(null);
        this._appClient = null;
        this._plugin = null;
        this._socket.close();
    }

    handleDisconnect() {
        if (!this._appClient) {
            return;
        }
        this._appClient.handlePluginCDTDisconnected(this._plugin.hostPlugInSessionId);
    }
}

module.exports = CDTClient;
