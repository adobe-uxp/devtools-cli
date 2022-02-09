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

const { startServer } = require("./lib/uxp_webdriver_server");
const yargs = require("yargs");

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 4797;

async function main() {
    let port = yargs.argv.port || DEFAULT_PORT;
    let host = yargs.argv.host || DEFAULT_HOST;
    return startServer(port, host);
}

main();
