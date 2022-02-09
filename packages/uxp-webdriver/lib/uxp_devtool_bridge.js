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

/* eslint-disable no-empty */
const puppeteer = require("puppeteer-core");
var request = require("request");
const EventEmitter = require("events");
const UxpExtensionTarget = require("./uxp_extension_window");
const URL = require("url").URL;

class UxpDevToolsBridge extends EventEmitter {
    constructor() {
        super();
        this._browser = null;
        this._extensionsList  = [];
    }

    getUxpDevToolsBrowserTargetEndPoint(devToolsUrl) {
        devToolsUrl = this._getNormalizedDevtoolsUrl(devToolsUrl);
        return new Promise(function(resolve, reject) {
            var jsonVersionHttpUrl = devToolsUrl + "json/version";
            request(jsonVersionHttpUrl, function(error, response, body) {
                if(error) {
                    reject(error);
                    return;
                }
                var data = JSON.parse(body);
                if (!data.webSocketDebuggerUrl) {
                    reject(new Error("Failed to Connect to DevTools Port: debugger Url is unknown"));
                    return;
                }
                resolve(data.webSocketDebuggerUrl);
            });
        });
    }

    _getNormalizedDevtoolsUrl(inputUrl) {
        try {
            const devtoolsUrl = new URL(inputUrl);
            return devtoolsUrl.href;
        }
        catch (err) {
        }
        // not a valid input url path - try with http:// appended
        try {
            const devtoolsUrl = new URL("http://" + inputUrl);
            return devtoolsUrl.href;
        }
        catch(err) {
            throw new Error("UxpWebDriver Error: Invalid devtools Url Path " + inputUrl);
        }
    }

    getAllExtensionTargets() {
        return this._extensionsList;
    }

    getActiveExtensionTarget() {
        var exts = this._extensionsList;
        if (exts.length > 0) {
            return exts[0];
        }
        return null;
    }

    async startUxpDevToolsSession(webSocketDebuggerUrl) {

        var options = {
            browserWSEndpoint: webSocketDebuggerUrl,
            defaultViewport: null
        };

        var browser = await puppeteer.connect(options);
        return browser;
    }

    async _setBrowser(browser) {
        this._browser = browser;
        this._browser.on("disconnected", this._onBrowserConnected.bind(this));
        this._browser.on("targetcreated", this._onDevToolTargetCreated.bind(this));
        this._browser.on("targetdestroyed", this._onDevToolTargetDestroyed.bind(this));
        var pages = await this._browser.pages();
        this._extensionsList = pages.map(page => new UxpExtensionTarget(page));
    }

    _onDevToolTargetCreated(target) {
        return target.page().then(page => {
            if (page) {
                this._extensionsList.push(new UxpExtensionTarget(page));
            }
        });
    }

    _onDevToolTargetDestroyed(target) {
        this._extensionsList = this._extensionsList.filter(ext => {
            return !ext._isTargetEqual(target);
        });
    }

    _onBrowserConnected() {
        this._browser = null;
        this.emit(UxpDevToolsBridge.Events.Disconnected);
    }

    _appendUXPSearchParams(webSocketDebuggerUrl, chromeOptionsArgs) {

        let url = new URL(webSocketDebuggerUrl);
        url.searchParams.append("adobe-uxp-app-id", chromeOptionsArgs["adobe-uxp-app-id"]);
        url.searchParams.append("adobe-uxp-plugin-id", chromeOptionsArgs["adobe-uxp-plugin-id"]);
        return url.toString();
    }

    async connect(chromeOptions, chromeOptionsArgs) {

        var webSocketDebuggerUrl = await this.getUxpDevToolsBrowserTargetEndPoint(chromeOptions.debuggerAddress);

        /*
         * TODO: puppeteer.connect() fails on appending query parameters with webSocketDebuggerUrl of the format: ws://${host}:${port}/devtools/browser/<id>
         * The same works when webSocketDebuggerUrl is of the format ws://127.0.0.1:14001/socket/browser_cdt/?adobe-uxp-app-id=PS&adobe-uxp-plugin-id=starterPlugin
         */
        if (chromeOptionsArgs &&  webSocketDebuggerUrl.includes("browser_cdt")) {
            webSocketDebuggerUrl =  this._appendUXPSearchParams(webSocketDebuggerUrl, chromeOptionsArgs);
        }
        var browserObj = await this.startUxpDevToolsSession(webSocketDebuggerUrl);
        return await this._setBrowser(browserObj);
    }

    async disconnect() {
        if (this._browser) {
            await this._browser.disconnect();
            this._browser = null;
        }
    }

    isExtensionTargetValid(extTarget) {
        return this._extensionsList.includes(extTarget);
    }
}


UxpDevToolsBridge.Events = {
    Disconnected: "disconnected",
    ExtensionHandleDestroyed: "extensionHandleDestroyed"
};

module.exports = UxpDevToolsBridge;
