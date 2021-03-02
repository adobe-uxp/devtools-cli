// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Note: The same is done in uxp_console_app.js file - so make sure to change it if this is chagned
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


const prom = Runtime.startApplication("uxp_devtools_app");
prom.then(function() {
    SDK.targetManager.addEventListener(SDK.TargetManager.Events.InspectedURLChanged, handleInspectedURLChanged);
});
