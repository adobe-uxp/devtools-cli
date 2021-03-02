/*
Copyright 2020 Adobe. All rights reserved.
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

function getChromeInspectorBaseUrl(consoleOnly) {
    const chromeDevtoolsPackagePath = require.resolve("chrome-devtools-frontend/package.json");
    const devtoolsBaseFolder = path.dirname(chromeDevtoolsPackagePath);
    const cdtPage = "front_end/" + (consoleOnly ? "uxp_console_app.html" : "uxp_devtools_app.html");
    const inspectorPage = path.join(devtoolsBaseFolder, cdtPage);
    return inspectorPage;
}

function getInspectorUrlForDebugUrl(cdtDebugWsUrl, consoleOnly) {
    const inspectorPage = getChromeInspectorBaseUrl(consoleOnly);
    let inspectorUrl = url.pathToFileURL(inspectorPage);
    inspectorUrl += `?${cdtDebugWsUrl}`;
    return inspectorUrl;
}

function getCompleteInspectorUrlWithTitle(cdtDebugWsUrl, details) {
    const cdtInpsectorUrl = getInspectorUrlForDebugUrl(cdtDebugWsUrl, details.consoleOnly);
    const title =  `${details.plugin.name} - ${details.app.name} v${details.app.version}`;
    let fullUxpDevtoolsUrl = `${cdtInpsectorUrl}&uxp_window_title=${title}`;
    return fullUxpDevtoolsUrl;
}

module.exports = {
    getCompleteInspectorUrlWithTitle,
    getInspectorUrlForDebugUrl
};

