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

class UxpCliClient extends Client {
    // eslint-disable-next-line class-methods-use-this
    get type() {
        return "cli";
    }

    // This is sent when the app client socket identifies itself.
    on_didAddRuntimeClient(client) {
        this._sendInitClientMessage(client);
    }

    on_clientDidConnect(client) {
        // If the client is not yet ready, we will just skip it.
        if (client.type === "app" && client.isInitialized) {
            this._sendInitClientMessage(client);
        }
    }

    on_completedConnection() {
        // server has established connection with client - send this final notification to client.
        // client by now will have details of other clients with it -
        // so it can use this event to resume its work on the connected clients.
        this.send({
            command: "didCompleteConnection",
        });
    }

    _sendInitClientMessage(client) {
        this.send({
            command: "didAddRuntimeClient",
            id: client.id,
            platform: client.platform,
            app: client.appInfo,
        });
    }

    on_didPluginUnloaded(data) {
        this.send({
            command: "didPluginUnloaded",
            plugin: data
        });
    }

    on_hostAppLog(data) {
        this.send({
            command: "hostAppLog",
            details: data
        });
    }

    on_clientDidDisconnect(client) {
        if (client.type === "app" && client.isInitialized) {
            this.send({
                command: "didRemoveRuntimeClient",
                id: client.id,
                app: client.appInfo,
            });
        }
    }
}

module.exports = UxpCliClient;
