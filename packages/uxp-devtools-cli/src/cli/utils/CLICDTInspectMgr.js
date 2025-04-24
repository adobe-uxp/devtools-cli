
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
const child_process = require("child_process");
const process = require("process");
const { createDeferredPromise } = require("./common");
const os = require('os');

function getDevtoolsAppExecutablePath() {
    let uxpDevtoolAppDir =  require.resolve("@adobe/uxp-inspect-frontend/package.json");
    uxpDevtoolAppDir = path.dirname(uxpDevtoolAppDir);

    const productName = "Adobe UXP Developer Tool";
    const baseFolder = path.resolve(uxpDevtoolAppDir, "dist");

    let executablePath = "";
    const arch = os.arch();
    if (process.platform === "darwin") {
        executablePath = arch === 'arm64'?`${baseFolder}/mac-arm64/${productName}.app/Contents/MacOS/${productName}`:`${baseFolder}/mac/${productName}.app/Contents/MacOS/${productName}`;
    }
    else if (process.platform === "win32") {
        executablePath = `${baseFolder}/win-unpacked/${productName}.exe`;
    }

    return executablePath;
}

function wrapArg(name, arg) {
    return `--${name}=${arg}`;
}

function lauchDevtoolsInspectApp(cdtDebugWsUrl, details) {
    const detailsStr = JSON.stringify(details);
    const a1 = wrapArg("cdtDebugWsUrl", cdtDebugWsUrl);
    const a2 = wrapArg("details", detailsStr);

    const args = [ "./main/index.js", a1, a2 ];

    const child = child_process.execFile(getDevtoolsAppExecutablePath(), args, (err, stdout, stderr) => {
        if (err) {
            throw err;
        }
        console.log(stdout);
        console.log(stderr);
    });
    const deferred = createDeferredPromise();

    child.on("error", (err) => {
        deferred.reject(err);
    });

    child.on("exit", (code, signal) => {
        deferred.resolve({
            code,
            signal
        });
    });

    const handleTerminationSignal = function(signal) {
        process.on(signal, () => {
            if (!child.killed) {
                child.kill(signal);
            }
        });
    };
    handleTerminationSignal("SIGINT");
    handleTerminationSignal("SIGTERM");
    return deferred.promise;
}

module.exports = {
    lauchDevtoolsInspectApp
};
