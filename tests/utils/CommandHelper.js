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

const { spawnSync } = require('child_process');


function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function processOutput(output) {
    const result = {};
    const success = output.match(/success":(.*)}/)[1];
    result.success = (success === 'true');

    if (success === 'true') {
        const data = output.match(/data":(.*),/)[1];
        result.result = data;
    } else {
        const error = output.match(/error":(.*),/)[1];
        result.result = error;
    }

    return result;
}

function executeCommandSync(command, options = {
    cwd: process.cwd(),
}) {
    const args = command.split(' ');
    const service = spawnSync(args[0], args.slice(1), options);
    const output = `${service.output}`;
    const result = processOutput(output);
    console.log(`'${command}' output is`);
    console.log(output);
    return result;
}

module.exports = {
    executeCommandSync,
    wait,
};
