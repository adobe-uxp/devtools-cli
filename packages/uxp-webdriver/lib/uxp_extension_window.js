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
const wdCallFunction = require("./atoms/call_function");
const { sleep } = require("./utils/uxp_utils");

class UxpExtensionWindow {

    constructor(page) {
        this._page = page;
    }

    _getTarget() {
        return this._page.target();
    }

    id() {
        // use the target-id of this page as id itself.
        return this._getTarget()._targetId;
    }

    url() {
        return this._getTarget().url();
    }

    _isTargetEqual(target) {
        return this._getTarget() == target;
    }

    async evaluate(script, ...scriptArgs) {
        scriptArgs = scriptArgs.map(arg => {
            if (arg instanceof UxpElement) {
                return arg._getElementHandle();
            }
            return arg;
        });
        var result = await this._page.evaluate(script, scriptArgs);
    }

    async callFunction(func, ...args) {
        if (typeof func === "function") {
            func = "" + func;
        }

        var wdCallFunArgs = [ null, func, args ];
        var codeToEvaluate = "(" + wdCallFunction + ").apply(null, " + JSON.stringify(wdCallFunArgs) + ")";

        var codeResult = await this._page.evaluate(codeToEvaluate);
        if (codeResult && codeResult.status === 0) {
            return codeResult.value;
        }
        throw new Error("callFunction script failed with error code " + JSON.stringify(codeResult));
    }

    async _sendRawDevToolMessage(method, params) {
        var cdpSession = await this._page._client;
        return await cdpSession.send(method, params);
    }

    async convertClientRectToScreen(rect) {
        var screenRect = await this._sendRawDevToolMessage("DOM.uxp_convertClientRectToScreen", {
            rect
        });
        return screenRect;
    }

    async performMouseActionUsingDevToolsInput(type, point, options) {
        var result = false;
        if (type == "click") {
            result = await this._page.mouse.click(point.x, point.y,options);
        }
        else if(type == "mousemove") {
            result = await this._page.mouse.move(point.x, point.y);
        }
        else if(type == "mousedown") {
            result = await this._page.mouse.down();
        }
        else if(type == "mouseup") {
            result = await this._page.mouse.up();
        }
        else {
            throw new Error("unknown mouse action type : " + type);
        }
        return result;
    }

    async performMouseActionUsingRobotJS(type, point, options) {
        var screenPos = await this.convertClientRectToScreen(point);
        const PointerInputMgr = require("./utils/PointerInput");
        var result = await PointerInputMgr.performMouseAction(type, screenPos);
        return result;
    }

    /*
     * Currnetly the performDragAction() method is available only on Mac,
     * since convertClientRectToScreen() API is not working on Windows yet.
     */
    async performDragAction(currentPoint, point) {
        /*
         * Since mouse events are fired alternately in two ways (RobotJS and DevTool),
         * the mouse state of RobotJS should be made for firing mousedrag event with firing some RobotJS events
         * before firing a mousedrag event using RobotJS.
         */
        await this.performMouseActionUsingRobotJS("mousemove", currentPoint);
        await this.performMouseActionUsingRobotJS("mouseup", currentPoint);
        await this.performMouseActionUsingRobotJS("mousedown", currentPoint);
        var result =  await this.performMouseActionUsingRobotJS("mousedrag", point);
        return result;
    }

    async performMouseAction(type, point, options) {

        var result = await this.performMouseActionUsingDevToolsInput(type, point, options);
        /*
         * since mouse pointer related methods are asynchronous in nature -
         * lets introduce a delay here so that the action is completed at the uxp side.
         * we should probably move to a more "stable" approach where uxp respond to the above
         * commands only after they are handled fully in the UI.
         */
        await sleep(200);
        return result;
    }

    async getScreenshotOfClientRect(clientRect) {
        var screenRect = await this.convertClientRectToScreen(clientRect);
        const ScreenShotMgr = require("./utils/ScreenShot");
        return ScreenShotMgr.getScreenShotOfRect(screenRect);
    }

    async prepareForAutomation() {
        var script = require("./uxpPrepareExtAutomation");
        await this.callFunction(script);
        /*
         * disable the devtools messsage processing via JS Interrupt approach - this is not required in the automation case.
         * and might lead to issues like UXP-8677
         */
        try {
            await this._sendRawDevToolMessage("UXP.setDevToolsJSInterrupt", {
                enable: false
            });
        }
        catch(err) {
            var msg = "WARNING: UXP.setDevToolsJSInterrupt message is not handled -  \
                    the devtools message might get handled in Interrupt mode which may lead to errors!";
            console.log(msg);
        }
    }
    async enableXPathSupport() {
        if(this._isXPathPolyfillEnabled) {
            return;
        }
        var xpathPolyfill = require("./atoms/xpath_polyfill");
        await this.callFunction(xpathPolyfill);
        await this.callFunction(function() {
            wgxpath.install();
        });
        this._isXPathPolyfillEnabled = true;
    }
}

module.exports = UxpExtensionWindow;
