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

const { CoreHelpers } = require("@adobe/uxp-devtools-core");

function handleServiceStartCommand(argv) {
    // start the service at the given port.
    const prom = this.app.server.isDevToolsEnabled();
    const devToolsProm = prom.then((result) => {
        if (!result) {
            console.log("UXP Developer Tools is not enabled. uxp cli will try to run devtools `enable command` to enable it.");
            return this.app.server.enableDevTools();
        }
        return result;
    }).catch((err) => {
        console.error(`Devtools enable command failed with ${err}`);
        // silently eat the error so we can.
        return false;
    });
    return devToolsProm.then((result) => {
        if (!result) {
            console.log("UXP Developer workflow is not enabled. Please enable it before you start the cli service");
            return false;
        }
        const { port } = argv;
        return CoreHelpers.isPortAvailable(port).then((isAvailable) => {
            if (!isAvailable) {
                throw new Error(`The port ${port} is occupied. Please try another port or close the application which is using the port and try again.`);
            }
            return this.app.server.startServer(port);
        });
    });
}

const startOptions = {
    port: {
        describe: "The port number for the uxp developer service",
        type: "number",
        default: 14001,
    },
};

const startCommand = {
    command: "start",
    description: "Starts the UXP Developer service. If UXP Developer Tools support is not currently enabled, this command will also attempt to enable support.",
    builder: startOptions,
    handler: handleServiceStartCommand,
};

// export all service related commands here
module.exports = {
    startCommand,
};
