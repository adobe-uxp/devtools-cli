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

var ELEMENT_FIND_XPATH = function(xpathExpression, context) { // context is the node within which the element should be looked for
    var searchNode = context ? context : document;
    var nodeSnapshot = document.evaluate(xpathExpression, searchNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let results = [];
    for (let i = 0; i < nodeSnapshot.snapshotLength; i++) {
        results.push(nodeSnapshot.snapshotItem(i));
    }
    return results;
};

module.exports = ELEMENT_FIND_XPATH;
