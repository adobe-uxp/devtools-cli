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

var robot = require("robotjs");

class KeyBoardInputMgr {
    /*
     * returns array of single key chars ( breaks down any multi chars input into single chars -
     * so that we can then issue a seperate key-down and key-up on each of those chars );
     */

    constructor() {
        this._initializeRobotJsKeyNameMapping();
    }

    _normalizeInputKeys(keys) {
        var allSingleChars = keys.every(k => (k.length == 1));
        if (!allSingleChars) {
            // flatten the array to single chars.
            keys = keys.reduce((agregate, curr) => {
                agregate.concat(Array.from(curr));
            }, []);
        }
        return keys;
    }

    _initializeRobotJsKeyNameMapping() {
        /*
         * from https://www.w3.org/TR/webdriver/#dfn-code and
         * http://robotjs.io/docs/syntax#keys
         */
        this._keyNameMap = {
            "E03D": "command",
            "E003": "backspace",
            "E004": "tab",
            "E007": "enter",
            "E008": "shift",
            "E009": "control",
            "E00A": "alt",
            "E00C": "escape",
            "E00D": "space",
            "E00E": "pageup",
            "E00F": "end",
            "E011": "home",
            "E012": "left",
            "E013": "up",
            "E014": "right",
            "E015": "down",
            "E016": "insert",
            "E017": "delete",
            "E058": "left",
            "E059": "up",
            "E05A": "right",
            "E05B": "down",
            "E05C": "insert",
            "E05D": "delete",
            "E050": "shift",
            "E051": "control",
            "E052": "alt"
        };
    }

    _isModifierKey(codePoint)   {
        var modifierKeys = [ 0xE050, 0xE051, 0xE052, 0xE008, 0xE009, 0xE03D ];
        for(var key of modifierKeys)    {
            if(codePoint == key)    {
                return true;
            }
        }
        return false;
    }

    _getKeyDetails(key)  {
        var codePoint = key.codePointAt(0);
        var isSpecial = this._keyNameMap[codePoint.toString(16).toUpperCase()] != undefined;
        var isModifier = this._isModifierKey(codePoint);
        var isNull = codePoint == 0xE000;
        var res = {
            isSpecial,
            isModifier,
            isNull,
            codePoint
        };
        return res;
    }

    _getRobotKeyNameForKey(key) {
        var codePoint = key.codePointAt(0);
        var codeUnitStr = codePoint.toString(16);
        var robotKeyName = this._keyNameMap[codeUnitStr.toUpperCase()];
        return robotKeyName;
    }

    _toggleModifierKeys(modifierKeys, type) {
        for (var key of modifierKeys) {
            var robotKeyName = this._getRobotKeyNameForKey(key);
            if (robotKeyName) {
                robot.keyToggle(robotKeyName, type);
            }
        }
    }

    sendKeys(keys) {
        keys = this._normalizeInputKeys(keys);
        // send keys via robotjs library.
        var currModifierKeysSet = [];
        var result = false;
        try {
            for(var key of keys) {
                var keyDetails = this._getKeyDetails(key);
                if (keyDetails.isNull) {
                    // unset all the currently set modifier keys.
                    currModifierKeysSet = [];
                }

                else if (keyDetails.isModifier) {
                    var keyName = this._getRobotKeyNameForKey(key);
                    currModifierKeysSet.push(keyName.toString());
                }

                else if (keyDetails.isSpecial) {
                    var robotKeyName = this._getRobotKeyNameForKey(key);
                    robot.keyTap(robotKeyName, currModifierKeysSet);
                }
                else {
                    // Normal Character
                    if(currModifierKeysSet.length > 0)  {
                        robot.keyTap(key, currModifierKeysSet);
                    }
                    else {
                        robot.typeString(key);
                    }
                }
            }
            result = true;
        }
        catch(err) {
            console.log("Uxp-WebDriver : Keyboard send key failed with error " + err.stack);
        }

        // clear all the modifier keys set during the above call.
        if (currModifierKeysSet.length > 0) {
            currModifierKeysSet = [];
        }
        return result;
    }
}


module.exports = new KeyBoardInputMgr;
