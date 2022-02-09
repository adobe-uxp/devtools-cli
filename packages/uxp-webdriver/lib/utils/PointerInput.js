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
var robot = require("robotjs");
const { normalizeScreenRectForRobotJS, sleep } = require("./uxp_utils");

class PointerInputMgr {

    async performMouseAction(type, point, optios) {
        var pt = normalizeScreenRectForRobotJS(point);
        var result = false;
        if (type == "click") {
            robot.moveMouse(pt.x, pt.y);
            robot.mouseClick();
        }
        else if(type == "mousemove") {
            robot.moveMouse(pt.x, pt.y);
        }
        else if(type == "mousedrag") {
            robot.dragMouse(pt.x, pt.y);
        }
        else if(type == "mouseup") {
            robot.mouseToggle("up");
        }
        else if(type == "mousedown") {
            robot.mouseToggle("down");
        }
        else {
            throw new Error("unknown mouse action type : " + type);
        }

        await sleep(250);
        /*
         * since mouse pointer related methods are asynchronous in nature -
         * lets introduce a delay here so that the action is completed at the uxp side.
         * we should probably move to a more "stable" approach where uxp respond to the above
         * commands only after they are handled fully in the UI.
         */
        return result;
    }
}

module.exports = new PointerInputMgr();
