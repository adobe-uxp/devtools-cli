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

/* eslint-disable no-unused-vars */
const { BaseDriver } = require("appium-base-driver");
const { errors: WebDriverErrors } = require("appium-base-driver");
const UxpDevToolsBridge = require("./uxp_devtool_bridge");
const { sleep } = require("./utils/uxp_utils");

const kDefaultScriptTimeout = 300 * 1000; // 300 seconds - script time out is in milliseconds;
let gScriptTimeout = kDefaultScriptTimeout;
class UxpDriver extends BaseDriver {

    constructor(opts = {}) {
        super(opts, false);
        this.setProtocolW3C();
        this._uxpDevToolsBridge = new UxpDevToolsBridge();

        this.initializeElementMethods();
        this._isMouseButtonPressed = false;
    }


    checkCapabilties(caps) {
        /*
         * the capabilties should be same as the one used for Chrome browser.
         * the capabilies object passes should have chromeOptions and a debuggerAddress (
         * uxp-DevTools debug port address that an Extension for inspection ) to connect to.
         */


        /*
         * Added support for WebDriverIO version 6+ and nightwatch version 1.5+
         * In the wdio/nightwatch.config.js, the key "chromeoptions" is now "goog.chromeoptions"
         * https://nightwatchjs.org/gettingstarted/configuration/
         * https://webdriver.io/docs/configurationfile.html
         */
        const chromeOptions = caps.chromeOptions ||  caps["goog:chromeOptions"];

        if (caps.browserName !== "chrome" || !chromeOptions.debuggerAddress) {
            var msg = "The capabilities object should have a chromeOptions with a debuggerAddress in it.";
            throw new WebDriverErrors.SessionNotCreatedError(msg);
        }

        if (caps.timeouts) {
            this._setGlobalScriptTimeout(caps.timeouts.script);
        }
        return chromeOptions;
    }

    async _setTopLevelBrowsingContext(extTarget) {
        this._currentTopLevelBrowsingContext = extTarget;
        await this.prepareUxpExtensionForAutomation();
    }

    _getCurrentUxpExtensionTarget() {
        // we currently use _currentTopLevelBrowsingContext itself to store the extension target.
        var extTarget = this._currentTopLevelBrowsingContext;
        return extTarget;
    }

    _handleOnUxpDevToolBridgeDisconnect() {
        return this.startUnexpectedShutdown().catch(err => {
            // just silently consume the reported error.
            return true;
        });
    }

    _getExtensionTargetForPluginId(pluginId) {
        const targets = this._uxpDevToolsBridge.getAllExtensionTargets();
        if (!pluginId) {
            return targets.length > 0 ? targets[0] : null;
        }
        const extTarget = targets.filter((target) => {
            return target.url() == pluginId;
        });
        return extTarget.length > 0 ? extTarget[0] : null;
    }

    _parseChromeOptionArgsList(chromeOptionsArgs) {
        if (!chromeOptionsArgs) {
            console.log("Arguments not specified under chromeOptions ");
            return;
        }
        let options = {};
        // Eg. of arg is '--adobe-uxp-plugin-id=0123driverPlugin'
        for (var index in chromeOptionsArgs) {
            let arg = chromeOptionsArgs[index];
            let [ key, value ] = arg.split("=");
            key = key.replace(/^--/, "");
            options[key.trim()] = value ? value.trim() : true;
        }
        return options;
    }

    _getPluginId(chromeOptionsArgs) {
        const pluginId = chromeOptionsArgs ? chromeOptionsArgs["adobe-uxp-plugin-id"] : null;
        if(!pluginId) {
            console.log('PluginId not specified in "chromeOptions.args". Connecting with the most recently loaded Plugin');
        }
        return pluginId;
    }

    async createSession(...args) {
        var desiredCapabilities = args[0];
        var chromeOptions = this.checkCapabilties(desiredCapabilities);
        var chromeOptionsArgs =  this._parseChromeOptionArgsList(chromeOptions.args);
        await this._uxpDevToolsBridge.connect(chromeOptions, chromeOptionsArgs);
        this._uxpDevToolsBridge.on("disconnected", this._handleOnUxpDevToolBridgeDisconnect.bind(this));
        const pluginId = this._getPluginId(chromeOptionsArgs);
        var extTarget = this._getExtensionTargetForPluginId(pluginId);
        if (!extTarget) {
            var msg = "Couldn't find any UXP Plugin to connect with the pluginId " + pluginId;
            throw new WebDriverErrors.SessionNotCreatedError(msg);
        }
        // https://www.w3.org/TR/webdriver1/#dfn-current-top-level-browsing-context
        await this._setTopLevelBrowsingContext(extTarget);
        /*
         * TODO - we should also have support for child browsing context -
         * when we introduce support for iFrames in uxp Extensions.
         * this._setChildBrowsingContextId(extHandle);
         */

        this._hasValidDevToolsConnection = true;
        let [ sessionId, caps ] = await super.createSession(...args);
        return [ sessionId, caps ];
    }

    async prepareUxpExtensionForAutomation() {
        var uxpExtensionTarget = this._getCurrentUxpExtensionTarget();
        await uxpExtensionTarget.prepareForAutomation();
    }

    async executeCommand(cmd, ...args) {
        var isTargetCommand = (cmd !== "createSession" && cmd !== "deleteSession"
                                && cmd !== "getWindowHandles" && cmd !== "setWindow");

        if (isTargetCommand) {
            /*
             * before we forward the session-command request to the base-driver check if the
             * current top level browsing context ( which maps to an uxp-Extension target ) is valid or not.
             */
            if (!this._hasValidDevToolsConnection) {
                throw new WebDriverErrors.NoSuchDriverError("Connection to Uxp DevTools is not started or terminated!");
            }

            var extTarget = this._getCurrentUxpExtensionTarget();
            var isCurrentExtensionValid = this._uxpDevToolsBridge.isExtensionTargetValid(extTarget);
            if (!isCurrentExtensionValid) {
                throw new WebDriverErrors.NoSuchWindowError("The Uxp extension window is no longer valid.");
            }
        }

        /*
         * console.log("craj: Received command with name : " + cmd);
         * console.log("craj: its arguments are : " + JSON.stringify(args));
         */
        return super.executeCommand(cmd, ...args);
    }

    async getWindowHandles() {
        var allExtTargets = this._uxpDevToolsBridge.getAllExtensionTargets();
        var extHandles = allExtTargets.map(ext => ext.id());
        return extHandles;
    }

    _findExtensionTargetFromHandle(handle) {
        var allExtTargets = this._uxpDevToolsBridge.getAllExtensionTargets();
        var extTarget = allExtTargets.find(ext => {
            return ext.id() === handle;
        });
        return extTarget;
    }

    async setWindow(...args) {
        var extHandle = args[0];
        var extTarget = this._findExtensionTargetFromHandle(extHandle);
        if (!extTarget) {
            throw new WebDriverErrors.NoSuchWindowError("Cannot find an Uxp Extension Target with given Id");
        }
        await this._setTopLevelBrowsingContext(extTarget);
    }

    async getUrl() {
        var uxpExtensionTarget = this._getCurrentUxpExtensionTarget();
        return Promise.resolve(uxpExtensionTarget.url());
    }

    async _executeCallFunctionWithScript(script, ...args) {
        var uxpExtensionTarget = this._getCurrentUxpExtensionTarget();
        var result = await uxpExtensionTarget.callFunction(script, ...args);
        return result;
    }

    async _findElementsByCSS(bOnlyOne, ...args) {
        var scriptFileName = bOnlyOne ? "find_element" : "find_elements";
        var findElemScript = require("./atoms/" + scriptFileName);
        var [ strategy, selector ] = args;
        var findElemAtomScriptArgs = {};
        findElemAtomScriptArgs[strategy] = selector;
        // args.length > 3 means we are searching within an element (passed as args[2]) and not from root
        var element = args.length > 3 ? { "ELEMENT": args[2] } : null;
        return this._executeCallFunctionWithScript(findElemScript, findElemAtomScriptArgs, element);
    }

    async _findElementsByXPath(bOnlyOne, ...args)  {

        var uxpExtensionTarget = this._getCurrentUxpExtensionTarget();
        await uxpExtensionTarget.enableXPathSupport();

        var findByXPathScript = require("./atoms/find_elements_by_xpath");
        var xpathInput = args[1];
        /*
         *  If args.length > 3 means that the element should be searched within a given element
         *  The third element in args is the parent element within which we should search
         */
        var parentElement = args.length > 3 ? { "ELEMENT": args[2] } : null;
        var results = await this._executeCallFunctionWithScript(findByXPathScript, xpathInput, parentElement);
        if (results && results.length > 0) {
            return bOnlyOne ? results[0] : results;
        }
        return null;
    }

    async _findElement(bOnlyOne, ...args)    {
        var strategy = args[0];
        if(strategy == "css selector") {
            return await this._findElementsByCSS(bOnlyOne, ...args);
        }
        else if(strategy == "xpath") {
            return await this._findElementsByXPath(bOnlyOne, ...args);
        }

        throw new WebDriverErrors.InvalidSelectorError("The selector " + strategy + " is not supported");
    }

    _sendKeys(keys) {
        var KeyBoardInputMgr = require("./utils/KeyboardInput");
        var result =  KeyBoardInputMgr.sendKeys(keys);
        return result;
    }

    wrapElementIdArg(elemId) {
        return {
            ELEMENT: elemId
        };
    }

    getElementMethodArgs(...args) {
        /*
         * element-Id will be last second ( last is session Id)
         * appium-base-driver sends the args in that order.
         * we need to wrap the incoming raw element-id into "Element" Object and place it at the begining.
         */
        var methodArgs = args.slice(0, args.length - 1).reverse();
        methodArgs[0] = this.wrapElementIdArg(methodArgs[0]);
        return methodArgs;
    }

    initializeElementMethods() {
        var elementMethods = [
            "getText",
            "getName",
            "elementSelected",
            "getCssProperty",
            "elementDisplayed",
            "getAtomsAttribute",
            "elementEnabled",
            "getSize",
            "getLocation",
            "getProperty",
            "active",
            "uxp_element_focus",
            "uxp_is_element_focus",
            "uxp_element_scroll_into_view",
            "uxp_getAttribute",
            "uxp_element_check_editable",
            "uxp_element_clear",
            "uxp_element_blur"
        ];

        for (var method of elementMethods) {
            let scriptName = "./atoms/" + method;
            this[method] = async function(...args) {
                var scriptArgs = this.getElementMethodArgs(...args);
                var scriptCode = require(scriptName);
                return await this._executeCallFunctionWithScript(scriptCode, ...scriptArgs);
            };
        }

        var findElemMethods = [
            "findElement",
            "findElementFromElement",
            "findElements",
            "findElementsFromElement"
        ];

        for (let i = 0; i < findElemMethods.length; ++i) {
            this[findElemMethods[i]] = async function(...args) {
                let isOnlyOne = i < 2; // the first two methods are single element only.
                return await this._findElement(isOnlyOne, ...args);
            };
        }

    }

    async getElementRect(...args) {
        var location = await this["getLocation"](...args);
        var size = await this["getSize"](...args);
        return {
            x: location.x,
            y: location.y,
            height: size.height,
            width: size.width
        };
    }

    async getAttribute(...args) {
        var result = await this["getAtomsAttribute"](...args);
        if (result == null) {
            result = await this["uxp_getAttribute"](...args);
        }
        return result;
    }


    async moveTo(...args) {
        let elemRect = {
            x: 0,
            y: 0,
            height: 0,
            width: 0
        };

        if (args[0]) {
            await this["uxp_element_scroll_into_view"](args[0], args[args.length - 1]);
            elemRect = await this.getElementRect(args[0], args[args.length - 1]);
        }
        var xOff = (args[1] && typeof args[1] === "number") ? args[1] : 0;
        var yOff = (args[2] && typeof args[2] === "number") ? args[2] : 0;

        var moveToPoint = {
            x: elemRect.x + (elemRect.width / 2) +  xOff,
            y: elemRect.y + (elemRect.height / 2) + yOff
        };

        var uxpExtension = this._getCurrentUxpExtensionTarget();
        var res = false;

        if (this._isMouseButtonPressed) {
            res = await uxpExtension.performDragAction(this._currMousePosition, moveToPoint);
        }
        else {
            res = await uxpExtension.performMouseAction("mousemove", moveToPoint);
        }
        this._currMousePosition = moveToPoint;
        return res;
    }

    async click(...args) {
        await this["uxp_element_scroll_into_view"](...args);
        var elemRect = await this.getElementRect(args[0], args[args.length - 1]);
        var clickPoint = {
            x: elemRect.x + (elemRect.width / 2),
            y: elemRect.y + (elemRect.height / 2)
        };

        var uxpExtension = this._getCurrentUxpExtensionTarget();
        var res = await uxpExtension.performMouseAction("click", clickPoint);
        return res;
    }
    _convertButtonNumberToString(btn) {
        var res = "left";
        if (btn == 1) {
            res = "middle";
        }
        else if (btn == 2) {
            res = "right";
        }
        return res;
    }

    async clickCurrent(...args) {
        var btn = this._convertButtonNumberToString(args[0]);
        var options = {
            button: btn
        };
        if (!this._currMousePosition) {
            var msg = "Cannot perform operation. Mouse current position is not known. First set it via, eg: move command";
            throw new WebDriverErrors.InvalidArgumentError();
        }
        var uxpExtension = this._getCurrentUxpExtensionTarget();
        var res = await uxpExtension.performMouseAction("click", this._currMousePosition, options);
        return res;
    }

    async doubleClick(...args) { // the only argument received is sessionID
        var options = {
            clickCount: 2
        };
        var uxpExtension = this._getCurrentUxpExtensionTarget();
        var res = await uxpExtension.performMouseAction("click", this._currMousePosition, options);
    }

    async buttonUp(...args) {
        if (!this._currMousePosition) {
            var msg = "Cannot perform operation. Mouse current position is not known. First set it via, eg: move command";
            throw new WebDriverErrors.InvalidArgumentError();
        }
        var uxpExtension = this._getCurrentUxpExtensionTarget();
        this._isMouseButtonPressed = false;
        var res = await uxpExtension.performMouseActionUsingRobotJS("mouseup", this._currMousePosition);
        return res;
    }

    async buttonDown(...args) {
        if (!this._currMousePosition) {
            var msg = "Cannot perform operation. Mouse current position is not known. First set it via, eg: move command";
            throw new WebDriverErrors.InvalidArgumentError();
        }
        var uxpExtension = this._getCurrentUxpExtensionTarget();
        this._isMouseButtonPressed = true;
        await uxpExtension.performMouseActionUsingRobotJS("mouseup", this._currMousePosition);
        await uxpExtension.performMouseActionUsingRobotJS("mousemove", this._currMousePosition);
        var res = await uxpExtension.performMouseActionUsingRobotJS("mousedown", this._currMousePosition);
        return res;
    }

    // Makes the element interactable - scroll into view and bring element into focus.
    async _makeElementInteractable(...args) {
        // scroll the element into view.
        await this["uxp_element_scroll_into_view"](...args);
        // then set focus on the element.
        var res = await this["uxp_element_focus"](...args);
        // check if the element is in focus before proceeding.

        var isFocus = false;
        for (let i = 0; i < 2; ++i) {
            await sleep(250); // empharical value.
            isFocus = await this["uxp_is_element_focus"](...args);
            if (isFocus) {
                break;
            }
            await this["uxp_element_focus"](...args);
        }
        if (!isFocus) {
            throw new WebDriverErrors.ElementNotInteractableError("Failed to get the element into focus.");
        }
    }

    async clear(...args) {
        // perform checks to see if the element is editable.
        await this["uxp_element_check_editable"](...args);
        // first make the element interactable ( scroll into view and bring element into focus )
        await this._makeElementInteractable(...args);
        // perform clear on element
        await this["uxp_element_clear"](...args);
        // un-focus the element
        await this["uxp_element_blur"](...args);
    }

    async setValue(...args) {
        await this._makeElementInteractable(...args);
        return this._sendKeys(args[0]);
    }

    async keys(...args) {
        return this._sendKeys(args[0]);
    }

    async _getScreenshotOfClientRect(rect) {
        var extTarget = this._getCurrentUxpExtensionTarget();
        var pngBase64Str = await extTarget.getScreenshotOfClientRect(rect);
        return pngBase64Str;
    }

    async getScreenshot(...args) {
        var documentViewPortSizeScript = function() {
            return {
                x: 0,
                y: 0,
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight
            };
        };

        var viewPortSize = await this._executeCallFunctionWithScript(documentViewPortSizeScript);
        return this._getScreenshotOfClientRect(viewPortSize);
    }

    async getElementScreenshot(...args) {
        var elemRect = await this.getElementRect(...args);
        return this._getScreenshotOfClientRect(elemRect);
    }

    async getLocationInView(...args)    {
        await this["uxp_element_scroll_into_view"](...args);
        var location = await this["getLocation"](...args);
        return {
            x: location.x,
            y: location.y
        };
    }

    _setGlobalScriptTimeout(timeoutValue) {
        gScriptTimeout =   timeoutValue;
    }

    async timeouts(...args) {

        /*
         * Nightwatch uses Protocol MJSONWP and sends request as { type: 'script', ms: 10000 }
         * arguments as ["script",10000,null,null,null,<sessionID>]
         */
        var scriptTimeout = args[1];
        if (args[0] == "script") {
            this._setGlobalScriptTimeout(scriptTimeout);
        }
        /*
         * Javascript and WebDriver IO used protocol W3C and sends request as { script: 20000 }
         * arguments as [null,null,20000,null,null,<sessionID>]
         */
        scriptTimeout = args[2];
        if ((typeof (scriptTimeout) == "number") && (scriptTimeout > 0)) {
            this._setGlobalScriptTimeout(scriptTimeout);
        }
    }
    async asyncScriptTimeout(...args) {
        /*
         * This API is used by nightwatch automation Framework
         * arguments received [scriptTimeoutInMs, sessionId]
         */
        this._setGlobalScriptTimeout(args[0]);
    }
    async execute(...args) {
        var [ script, scriptArgs ] = args;
        return this._executeCallFunctionWithScript(script, ...scriptArgs);
    }

    async executeAsync(...args) {
        var [ script, scriptArgs ] = args;
        var fnScript = "function(){" + script + "}";
        var finalInputFn = "return (" + fnScript + ").apply(null, arguments);";
        var asyncScriptArgs = [ finalInputFn, scriptArgs, true, kDefaultScriptTimeout ];

        var { wdExecuteAsyncScriptFunc, wdCheckCurrentAsyncFuncResult } = require("./atoms/execute_async_script");
        var res = await this._executeCallFunctionWithScript(wdExecuteAsyncScriptFunc, ...asyncScriptArgs);
        var checkAsyncResultScript = "return (" + wdCheckCurrentAsyncFuncResult + ").apply(null);";
        var kAsyncTimeOutMilliSec = gScriptTimeout;
        var kSleepTimeMilliSec = 500;
        var tryOutCount = kAsyncTimeOutMilliSec / kSleepTimeMilliSec;
        // ideally, this should be a while(true) loop - but we will just use a threshold of kDefaultScriptTimeout (currently 300 seconds ) .
        for (let i = 0; i < tryOutCount; ++i) {
            var asyncResObj = await this._executeCallFunctionWithScript(checkAsyncResultScript);
            if (asyncResObj) {
                if (asyncResObj.status !== 0) {
                    var errorCls = WebDriverErrors.JavaScriptError;
                    if (asyncResObj.status == 28) {
                        errorCls = WebDriverErrors.ScriptTimeoutError;
                    }
                    throw new errorCls();
                }
                if (Object.prototype.hasOwnProperty.call(asyncResObj, "value")) {
                    // async script execution was successful with a value - so return that to the caller.
                    return asyncResObj.value;
                }
            }
            await sleep(kSleepTimeMilliSec);
        }
        throw new WebDriverErrors.TimeoutError();
    }

    async deleteSession() {
        if (this._hasValidDevToolsConnection) {
            await this._uxpDevToolsBridge.disconnect();
            this._hasValidDevToolsConnection = false;
        }

        await super.deleteSession();
    }

}

module.exports = UxpDriver;
