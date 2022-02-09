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

// these functions are not part of automation atoms per se - but js methods specific to Uxp automation.
var IS_FOCUS_ELEMENT = "function (element) {\n    var doc = element.ownerDocument || element;\n    return element == doc.activeElement; \n}";
module.exports = IS_FOCUS_ELEMENT;
