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

/*
 * This is origijnal selenium atom getAttribute function code as defined here
 * https://github.com/SeleniumHQ/selenium/blob/master/javascript/atoms/domcore.js#L57
 * The standard selenium getAttribute method (file ./getAtomsAttribute.js) was failing for attibutes that are case sensitive - esp Custom Attributes eg: "imageChecked".
 * UXP keeps the attribute name as is internally and doesn't normalize to lowerCase and hence we need a fall-back mechanism to fetch the attribute as is.
 * and hence we have created this new wrapper method for uxp.
 */

var UXP_GET_ATTRIBUTE = "function(...args) { var elem = args[0]; var attrName = args[1]; var attr = elem.getAttributeNode(attrName); var result = attr ? attr.value : null; return result;}";
module.exports = UXP_GET_ATTRIBUTE;
