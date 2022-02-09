/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const path = require("path");
const url = require("url");

function getChromeInspectorBaseUrl() {
    const cdtPage = "front_end/devtools_app.html";
    const inspectorPage = path.join(path.resolve(__dirname, ".."), cdtPage);
    return inspectorPage;

}

const encodeChar = (c) => "%" + c.charCodeAt(0).toString(16);

function getCompleteInspectorUrlWithTitle(cdtDebugWsUrl, details) {
    const inspectorPage = getChromeInspectorBaseUrl();
    const inspectorUrl = url.pathToFileURL(inspectorPage);
    // Handling special chars here in the URL due to a bug in devtools-frontend due to which
    // icons are missing, see (https://jira.corp.adobe.com/browse/UXP-18095).
    // This bug is now fixed in the devtools-frontend,
    // see (https://chromium-review.googlesource.com/c/devtools/devtools-frontend/+/3035144).
    // The handling done here is temporary and will be removed once CDT front_end is upgraded.
    inspectorUrl.pathname = inspectorUrl.pathname
        .replace(/[;,:?@&=+$\^!~'()]/g, encodeChar);
    const wsUrlStartIndex = 3; // web socket url is of the form "ws=<URL>"
    inspectorUrl.searchParams.append(
        "ws",
        cdtDebugWsUrl.substring(wsUrlStartIndex)
    );

    const uxpWindowTitle = `${details.plugin.name} - ${details.app.name} v${details.app.version} (${details.consoleOnly ? "Logs" : "Debug"})`;
    inspectorUrl.searchParams.append("uxp_window_title", uxpWindowTitle);
    inspectorUrl.searchParams.append(
        "uxp_window_type",
        `${details.consoleOnly ? "console" : "debug"}`
    );
    inspectorUrl.searchParams.append(
        "memory_tab",
        false
    );
    inspectorUrl.searchParams.append(
        "protocol_monitor",
        false
    );
    return inspectorUrl.toString();
}

module.exports = {
    getCompleteInspectorUrlWithTitle
};

