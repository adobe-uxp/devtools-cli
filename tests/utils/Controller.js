/* eslint-disable no-unused-vars */
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

const {
    spawn, exec, execSync, spawnSync,
} = require('child_process');
const path = require("path");
const os = require("os");
const fs = require("fs");
const { wait, executeCommandSync } = require("./CommandHelper");

const demoappPath = path.resolve(__dirname, "../../build/out/bin/macos/v8/nativeui/Release/demo.app/Contents/Macos");


function createDeferredPromise() {
    const obj = {};
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

class TestController {
    constructor(config) {
        this._config = config;
    }

    setup() {
        const versions = this._config.versions || [];
        const port = this._config.port || 14001;
        const { plugin } = this._config;
        this.processList = [];

        this._uxpService = [];
        this._uxpDemoappList = [];

        const options = {
            cwd: demoappPath,
        };
        const demoApp = this.startDemoApp(versions, options);

        return demoApp.then(() => this.startUxpService(port))
            .then(() => wait(1000))
            .then(() => {
                if (plugin) {
                    this.pluginLoad(plugin);
                    return wait(1000);
                }
            }).catch((error) => {
                console.log(`Setup failed: ${error}`);
            });
    }

    startDemoApp(versions, options) {
        const deffered = createDeferredPromise();

        versions.forEach((version) => {
            const appInstance = spawn('./demo', ['--devtools', version], options);
            if (appInstance.pid) {
                this._uxpDemoappList.push(appInstance);
            }
            appInstance.on('error', (data) => {
                console.log(`Error while starting Demo App ${data}s`);
                deffered.reject(new Error('Demo app failed to start.'));
            });
        });

        // Ensure all the instances of demoapp have been launched.
        if (this._uxpDemoappList.length === versions.length) {
            deffered.resolve(true);
        }

        return deffered.promise;
    }

    startUxpService(port) {
        const deffered = createDeferredPromise();

        const service = spawn('uxp', ['service', 'start', '--port', port]);
        if (service.pid) {
            this._uxpService.push(service);
        }

        // uxp service failed to start.
        service.stderr.on('data', (data) => {
            deffered.reject(new Error('uxp service falied to start.'));
        });

        // service started successfully.
        service.stdout.on('data', (data) => {
            deffered.resolve(true);
        });

        return deffered.promise;
    }

    tearDownSetup() {
        // Kill all the uxp demo app
        this._uxpDemoappList.forEach((subprocess) => {
            subprocess.kill();
        });

        // Kill the uxp service.
        this._uxpService.forEach((subprocess) => {
            subprocess.kill();
        });
    }

    // eslint-disable-next-line class-methods-use-this
    pluginLoad(plugin) {
        const { success } = executeCommandSync(`uxp plugin load`, {
            cwd: plugin,
        });

        if (success === false) {
            throw new Error('Plugin Load Failed.');
        }
    }
}

module.exports = TestController;
