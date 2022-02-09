
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeScreenRectForRobotJS(screenRect) {
    var robotJS = require("robotjs");
    var sr = {
        x: screenRect.x || screenRect.left,
        y: screenRect.y || screenRect.top,
        width: screenRect.width,
        height: screenRect.height
    };

    sr.x = parseInt(sr.x); sr.y = parseInt(sr.y);
    sr.width = parseInt(sr.width); sr.height = parseInt(sr.height);

    if (process.platform.toLowerCase() === "darwin") {
        /*
         * screen rect 0,0 is bottom left on MacOS - we need to convert this to one compatible with
         * robotJS which uses top-left as 0,0.
         */
        let screenSize = robotJS.getScreenSize();
        // invert the y.
        sr.y = screenSize.height - (sr.y + sr.height);
    }
    return sr;
}

module.exports = {
    sleep,
    normalizeScreenRectForRobotJS
};
