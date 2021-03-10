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

/*
Note: this script set-up the Chrome Frontend devtools to be compatible for UXP devtools needs.
Only some tabs in CDT front-end are relevant for UXP devtools - for eg: Application and Security tabs are not appropriate.
Also, for Plugin logs - we leverage the Console tab of the CDT Inspect window - To show only the Console tab in the window -
We have customized the modules json file of CDT Front-end appropriately.

CDT Inspect is pretty modular in nature and Module json files define what features are required for the final App.
and the Runtime then loads the required modules in the App.

We have two use cases -
Main use : Where we use the CDT inspect for Inspection purpose - here we want to the show the following Tabs
Elements, Sources ( Debugging ), Console, Network, Javasript Profiling

Developer Notes : To help figure out the missing dependency - I added the following line in Runtime.js file at line 723
    for (let i = 0; dependencies && i < dependencies.length; ++i) {
      const depName = dependencies[i];
      const dep = this._manager._modulesMap[depName];
      if (!dep) {
        console.error("Check: Error : The dep is not present " + depName);
      }
      dependencyPromises.push(dep._loadPromise());
    }
This shows the dependency name - and we then just need to add the missing dep in the module.json file.

Console Use-case has some extra changes - I have craeted a new sub module ( uxp-devtools-console ) which registers
some extensions, which controls the js and css source map related settings - else we see Runtime Exceptions.

We just copy the required data into the chrome devtools package and then use our custom html files to load the app.

Timeline and Profiler module.json overwrites -
We are overwriting these modules to disable the following features -

1. Profiler module by default shows "Performance" Tab - Doesn't work in UXP yet.
2. Timeline module by default shows "Memory" tab - where one can do heap profiling- but this feature is not supported in uxp yet.

Timeline Module is used mainly for "Javascript Profiler" - which works on UXP plugins.

Some more details present in front_end/uxp_console_app.js file as well.
*/

const fs = require("fs-extra");
const path = require("path");

function getChromeDevtoolsPackageFolder() {
    const chromeDevtoolsPackagePath = require.resolve("chrome-devtools-frontend/package.json");
    const devtoolsBaseFolder = path.dirname(chromeDevtoolsPackagePath);
    return devtoolsBaseFolder;
}

function setupCDTInspectForUXP() {
    const cdtBaseFolder = getChromeDevtoolsPackageFolder();
    const cdtFrontEndDest = path.resolve(cdtBaseFolder, "front_end");

    const frontEndSourceDir = path.resolve(__dirname, "front_end");

    // copy console related files
    fs.copySync(frontEndSourceDir, cdtFrontEndDest);

    // copy main uxp devtools inspector files
    fs.copySync(frontEndSourceDir, cdtFrontEndDest);

    // overwrite timeline and profiler module custom changes
    const timeLineModuleSrcPath = path.resolve(__dirname, "custom", "timeline", "module.json");
    const profilereModuleSrcPath = path.resolve(__dirname, "custom", "profiler", "module.json");

    const timeLineDestPath = path.resolve(cdtFrontEndDest, "timeline", "module.json");
    const profilereDestPath = path.resolve(cdtFrontEndDest, "profiler", "module.json");

    fs.copyFileSync(timeLineModuleSrcPath, timeLineDestPath);
    fs.copyFileSync(profilereModuleSrcPath, profilereDestPath);
}

setupCDTInspectForUXP();
