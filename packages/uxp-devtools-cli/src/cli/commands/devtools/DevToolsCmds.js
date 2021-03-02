/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const readline = require("readline");

function createDeferredPromise() {
    const obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

function waitForKey(keyNames) {
    const deferred = createDeferredPromise();
    const rl = readline.createInterface(process.stdin);
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    process.stdin.on("keypress", (c, k) => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        rl.close();
        if (keyNames.includes(k.name)) {
            deferred.resolve(true);
            return;
        }
        deferred.resolve(false);
    });
    return deferred.promise;
}

function promptUserForTermsAccept(enable) {
    if (enable) {
        console.log(`\nAdministrator privileges are needed to enable UXP Developer Tools on this system. By continuing you agree to `);
        console.log(`1) Adobe's Terms of Use: https://www.adobe.com/legal/terms.html`);
        console.log(`2) Adobe Developer Additional Terms: http://www.adobe.com/go/developer-terms`);
    }
    else {
        console.log(`\nAdministrator privileges are needed to disable UXP Developer Tools on this system`);
    }

    console.log("Press Enter to Continue...");
    return waitForKey([ "return", "enter" ]);
}


function handleEnableCommand() {
    const prom = promptUserForTermsAccept(true);
    return prom.then((accept) => {
        if (accept) {
            return this.app.server.enableDevTools();
        }
        return false;
    }).then((result) => {
        if (result) {
            console.log("UXP DevTools is Enabled now.");
        }
    });
}

const enableCommand = {
    command: "enable",
    description: "Configures the UXP Developer service to permit loading and debugging of plugins in development.",
    handler: handleEnableCommand,
};

function handleDisableCommand() {
    const prom = promptUserForTermsAccept(false);
    return prom.then((accept) => {
        if (accept) {
            return this.app.server.disableDevTools();
        }
        return false;
    }).then((result) => {
        if (result) {
            console.log("UXP Developer Tools is Disabled now.");
        }
    });
}

const disableCommand = {
    command: "disable",
    description: "Prevents plugins in development from being loaded or debugged.",
    handler: handleDisableCommand,
};

module.exports = {
    enableCommand,
    disableCommand,
};
