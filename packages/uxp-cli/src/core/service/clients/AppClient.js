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

class AppClient extends Client {
    // eslint-disable-next-line class-methods-use-this
    get type() {
        return "app";
    }

    constructor(server, socket) {
        super(server, socket);
        this.isInitialized = false;
        this.platform = null;
        // Send a ready message to unblock the inspector.
        this.send({
            command: "ready",
        });
    }

    _getPluginForMessage(message) {
        const { pluginSessionId } = message;
        return this._server.pluginSessionMgr.getPluginFromHostSessionId(pluginSessionId);
    }

    _getCDTClientForMessage(message) {
        const plugin = this._getPluginForMessage(message);
        if (!plugin) {
            return null;
        }
        return plugin.getCDTClient();
    }

    _handlePluginUnloadCommon(plugin) {
        // this plugin was unloaded at the uxp side -
        // so, end the debugging session with Inspect, if any.
        const cdtClient = plugin.getCDTClient();
        if (cdtClient) {
            cdtClient.handleHostPluginUnloaded();
        }
        // remove this plugin from session manager.
        this._server.pluginSessionMgr.removePlugin(plugin);
    }

    msg_UXP(message) {
        const plugin = this._getPluginForMessage(message);
        if (!plugin) {
            return;
        }
        if (message.action === "unloaded") {
            this._handlePluginUnloadCommon(plugin);
        }
    }

    msg_CDT(message) {
        const cdtClient = this._getCDTClientForMessage(message);
        if (!cdtClient) {
            return;
        }
        if (message.cdtMessage) {
            cdtClient.sendRaw(message.cdtMessage);
        }
    }

    handleDevToolsAppInfo(data) {
        this.appInfo = data;
        this.isInitialized = true;
        this.platform = data.platform;

        console.info(`${this.appInfo.appId}(${this.appInfo.appVersion}) connected to service ... `);
        // Make sure that we send a notification when this client
        // is added.
        this._server.broadcastEvent("didAddRuntimeClient", this);
    }

    // eslint-disable-next-line class-methods-use-this
    msg_initRuntimeClient() {
        // ask for app info.
        const message = {
            command: "App",
            action: 'info',
        };
        this.sendRequest(message, (err, reply) => {
            if (err) {
                console.error(`WS Error while processing request for ${message.command} with error ${err}`);
                return;
            }
            this.handleDevToolsAppInfo(reply);
        });
    }

    _createMessageWithPluginSession(message, callback) {
        const clientSessionId = message.pluginSessionId;
        const plugin = this._server.pluginSessionMgr.getPluginFromSessionId(clientSessionId);
        if (!plugin) {
            const reply = {
                error: "Could not start a debug session for this plugin, since it hasn't been loaded yet. Please use `uxp plugin load` first and then try again",
            };
            callback(null, reply);
            return null;
        }
        // get the host plugin session id for this plugin and send that to the host app.
        // eslint-disable-next-line no-param-reassign
        message.pluginSessionId = plugin.hostPlugInSessionId;
        return message;
    }

    _handlePluginDebugRequest(message, callback) {
        const clientSessionId = message.pluginSessionId;
        const msgWithSession = this._createMessageWithPluginSession(message, callback);
        if (!msgWithSession) {
            return;
        }

        const response = {
            command: "reply",
        };
        const wsServerUrl = this._server.localHostname;
        const cdtWSDebugUrl = `${wsServerUrl}/socket/cdt/${clientSessionId}`;
        response.wsdebugUrl = `ws=${cdtWSDebugUrl}`;
        response.chromDevToolsUrl = `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=${cdtWSDebugUrl}`;
        callback(null, response);
    }

    _handlePluginLoadRequest(message, callback) {
        this.sendRequest(message, (err, reply) => {
            if (err) {
                callback(err, reply);
                return;
            }
            const { pluginSessionId } = reply;
            if (!pluginSessionId) {
                console.error("Plugin Load result doesn't contain a valid plugin session id in it");
                return;
            }
            // store the plugin session details - we try to restore the session back when the
            // app connects back again ( say, due to restart )
            const sessionMgr = this._server.pluginSessionMgr;
            const sessionId = sessionMgr.addPlugin(pluginSessionId, this.appInfo);
            const response = reply;
            response.pluginSessionId = sessionId;
            callback(err, response);
        });
    }

    _handlePluginUnloadRequest(message, callback) {
        const msgWithSession = this._createMessageWithPluginSession(message, callback);
        if (!msgWithSession) {
            return;
        }
        this.sendRequest(msgWithSession, (err, reply) => {
            if (err) {
                callback(err, reply);
                return;
            }
            const plugin = this._getPluginForMessage(message);
            if (plugin) {
                this._handlePluginUnloadCommon(plugin);
            }
            // eslint-disable-next-line no-param-reassign
            reply.pluginSessionId = message.pluginSessionId;
            callback(null, reply);
        });
    }

    handler_Plugin(message, callback) {
        const { action } = message;
        if (action === "load") {
            this._handlePluginLoadRequest(message, callback);
        } else if (action === "debug") {
            this._handlePluginDebugRequest(message, callback);
        } else if (action === "unload") {
            this._handlePluginUnload(message, callback);
        } else {
            const msgWithSession = this._createMessageWithPluginSession(message, callback);
            if (msgWithSession) {
                this.sendRequest(msgWithSession, callback);
            }
        }
    }

    sendCDTMessage(cdtMessage, hostPluginSessionId) {
        const message = {
            command: "CDT",
            pluginSessionId: hostPluginSessionId,
            cdtMessage,
        };
        this.send(message);
    }

    handlePluginCDTConnected(hostPluginSessionId) {
        const message = {
            command: "Plugin",
            action: "cdtConnected",
            pluginSessionId: hostPluginSessionId,
        };
        this.sendRequest(message, (err, reply) => {
            if (reply.error) {
                console.error(`Plugin CDTConnected message failed with error ${reply.error}`);
            }
        });
    }

    handlePluginCDTDisconnected(hostPluginSessionId) {
        const message = {
            command: "Plugin",
            action: "cdtDisconnected",
            pluginSessionId: hostPluginSessionId,
        };
        this.sendRequest(message, (err, reply) => {
            if (reply.error) {
                console.error(`Plugin CDTDisconnected message failed with error ${reply.error}`);
            }
        });
    }

    handleDisconnect() {
        const data = this.appInfo;
        if (data) {
            console.info(`${this.appInfo.appId}(${this.appInfo.appVersion}) got disconnected from service.`);
        }
        super.handleDisconnect();
    }
}

module.exports = AppClient;
