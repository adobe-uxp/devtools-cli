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
const fs = require("fs");

const { normalizeScreenRectForRobotJS } = require("./uxp_utils");

class ScreenShotMgr {

    _convertRobotBitmapToImageFormat(robotBitmap, format) {
        return new Promise((resolve, reject) => {
            try {
                var Jimp = require("jimp");
                var picture = robotBitmap;
                var count = 0;
                var image = new Jimp(picture.width, picture.height, function(err, img) {
                    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
                        var rawIndex = (picture.byteWidth * y) + (x * picture.bytesPerPixel);
                        var rimg = picture.image;
                        // on mac  we get the image in  BGRA format.
                        this.bitmap.data[idx + 0] = rimg[rawIndex + 2];
                        this.bitmap.data[idx + 1] = rimg[rawIndex + 1];
                        this.bitmap.data[idx + 2] = rimg[rawIndex];
                        this.bitmap.data[idx + 3] = 255;
                    });
                    var jimpImgFormat = Jimp.MIME_PNG;
                    if (format == "jpg" || format == "jpeg") {
                        jimpImgFormat = Jimp.MIME_JPEG;
                    }
                    img.getBuffer(jimpImgFormat, (err, png) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(png);
                        }
                    });
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async getScreenShotOfRect(screenRect) {
        var sr = normalizeScreenRectForRobotJS(screenRect);
        // check the input rect sanity.
        var size = robot.getScreenSize();
        var srect = {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height
        };

        var isInputRectOutofbounds = !(sr.x >= srect.x && sr.y >= srect.y
                        && (sr.x + sr.width) <= srect.width
                        && (sr.y + sr.height) <= srect.height);
        var isInvalidInputRect = sr.x < 0 || sr.y < 0 || sr.width == 0 || sr.height == 0;

        if (isInvalidInputRect || isInputRectOutofbounds) {
            var msg = "";
            if (isInputRectOutofbounds) {
                msg = " - Expected input rect " + JSON.stringify(sr) + " to be within screen rects " + JSON.stringify(srect);
            }
            else {
                msg = " - Input rect is not valid " + JSON.stringify(sr);
            }
            throw new Error("Screenshot Capture Failed: Invalid screen rects passed " + msg);
        }
        var bitmapObj = robot.screen.capture(sr.x, sr.y, sr.width, sr.height);
        var im = bitmapObj.image;
        var pngBuffer = await this._convertRobotBitmapToImageFormat(bitmapObj, "png");
        var imgBase64Str = pngBuffer.toString("base64");
        return imgBase64Str;
    }
}

function logRobotJSBitmapObjDetails(bitmapObj) {
    console.log("RobotJS ScreenCapture: Image byteWidth: " + bitmapObj.byteWidth);
    console.log("RobotJS ScreenCapture: Image bytePerPixel: " + bitmapObj.bytesPerPixel);
    console.log("RobotJS ScreenCapture: Image bitsPer: " + bitmapObj.bitsPerPixel);
    console.log("RobotJS ScreenCapture: Image Image Length: " + bitmapObj.image.length);
}

module.exports = new ScreenShotMgr;
