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

var ELEMENT_CLEAR = function(elem) {
    function checkEditable(elem) {
        var isHidden = elem.style.display == "none";
        var isDisabled = elem.disabled;

        if (isHidden || isDisabled) {
            throw new Error("Element is not currently interactable and may not be manipulated");
        }

        function isEditable(element) {
            var tagName = element.tagName;
            if (tagName == "TEXTAREA") {
                return true;
            }

            var TEXTUAL_INPUT_TYPES_ = [
                "text",
                "search",
                "tel",
                "url",
                "email",
                "password",
                "number"
            ];

            if (tagName == "INPUT") {
                return TEXTUAL_INPUT_TYPES_.includes(element.type.toLowerCase());
            }
            return false;
        }

        if (!isEditable(elem) || elem.readonly) {
            throw new Error("Element must be user-editable in order to clear it.");
        }

        return true;
    }

    checkEditable(elem);

    if (elem.value) {
        elem.value = "";
    }
};

module.exports = ELEMENT_CLEAR;
