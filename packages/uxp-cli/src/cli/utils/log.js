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

const log = require("fancy-log");
const chalk = require("chalk");

// Export a global verbose method on the fancy-log to be used with the rest of the code.
let verboseEnabled = false;

log.setVerbose = (enabled = true) => {
    if (enabled && !verboseEnabled) {
        log.info(chalk.yellow("Verbose logging enabled"));
    }
    verboseEnabled = enabled;
};

log.getVerbose = () => verboseEnabled;

log.verbose = (...args) => {
    if (verboseEnabled) {
        log.info(...args);
    }
};

module.exports = log;
