// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const prom = Runtime.startApplication("uxp_console_app");

/**
 * Note: SDK.DebuggerModel's _agent's setBreakpointsActive controls whether the
 * Breaks-points are honored or not - so, we need to disable this when running in console mode.
 */
class UxpCustomizationMgr {
    modelAdded(debuggerModel) {
        // setting the break-point to false in console mode.
        // We are mimicking the
        // front_end/sdk/DebuggerModel.js -> SDK.DebuggerModel class's _breakpointsActiveChanged method here.
        debuggerModel._agent.setBreakpointsActive(false);
    }

    modelRemoved() {

    }
}

// The same is done in uxp_devtools_app.js file - so make sure to change it if this is chagned
function handleInspectedURLChanged() {
    try {
        let url = new URL(location.href);
        let searchParams = new URLSearchParams(url.search);
        let title = searchParams.get("uxp_window_title");
        if (!!title) {
            // Chrome CDT overwrites the window title with "Devtool - "
            // We need to use uxp plugin info here - We get the title from the query-params
            // and override the title again here.
            document.title = title;
        }
    }
    catch (err) {
        console.error("Failed to set Window title to UXP Devtools");
    }
}

const uxpCustomizationMgr = new UxpCustomizationMgr();
prom.then(function() {
    // restore back the original title of the window - as set from electron side.
    SDK.targetManager.addEventListener(SDK.TargetManager.Events.InspectedURLChanged, handleInspectedURLChanged);
    SDK.targetManager.observeModels(SDK.DebuggerModel, uxpCustomizationMgr);

});
