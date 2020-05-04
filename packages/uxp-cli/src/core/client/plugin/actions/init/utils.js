/* eslint-disable no-bitwise */
/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the Licrrense for the specific language
 *  governing permissions and limitations under the License.
 *
 */

const fs = require('fs-extra');
const chalk = require('chalk');
const { execSync } = require('child_process');
const dns = require('dns');
const url = require('url');
const _ = require('lodash');


// Check for file conflicts.
function getConflictingFilesList(root) {
    const unsafeFiles = [
        'package.json',
        'manifest.json',
        'yarn.lock',
    ];
    const fileNames = fs.readdirSync(root);
    const removeFiles = _.intersection(fileNames, unsafeFiles);
    return removeFiles;
}


function sanityCheckPluginDirectory(root) {
    // Check user has read/write access to the directory.
    try {
        fs.accessSync(root, fs.constants.W_OK | fs.constants.R_OK);
    } catch (error) {
        throw new Error(`User does not have read/write access to the directory.`);
    }

    // Check if directory has conflicting files.
    const removeFiles = getConflictingFilesList(root);
    if (removeFiles.length > 0) {
        console.log(
            chalk.red(`The directory contains files that can conflict:`),
        );
        removeFiles.forEach((file) => {
            console.log(chalk.cyan(`    ${file}`));
        });
        throw new Error('Either select a new directory or remove the above mentioned files.');
    }
}


function checkYarnPkg() {
    const yarnDefaultRegistery = execSync('yarnpkg config get registry').toString().trim();
    if (!(yarnDefaultRegistery === 'https://registry.yarnpkg.com')) {
        throw new Error(`Can not find yarn on the system. \n`);
    }
}

// Get proxy
function getProxy() {
    if (process.env.https_proxy) {
        return process.env.https_proxy;
    }
    try {
        // Trying to read https-proxy from .npmrc
        const httpsProxy = execSync('npm config get https-proxy')
            .toString()
            .trim();
        return httpsProxy !== 'null' ? httpsProxy : undefined;
    } catch (e) {
    }
}


function checkIfOnline() {
    return new Promise((resolve) => {
        dns.lookup('registry.yarnpkg.com', (err) => {
            let proxy;
            if (err != null && (proxy = getProxy())) {
            // If a proxy is defined, we likely can't resolve external hostnames.
            // Try to resolve the proxy name as an indication of a connection.
                dns.lookup(url.parse(proxy).hostname, (proxyErr) => {
                    resolve(proxyErr == null);
                });
            } else {
                resolve(err == null);
            }
        });
    });
}


module.exports = {
    sanityCheckPluginDirectory,
    checkYarnPkg,
    checkIfOnline,
};
