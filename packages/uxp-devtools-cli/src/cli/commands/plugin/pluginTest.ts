/*
 *  Copyright 2021 Adobe Systems Incorporated. All rights reserved.
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

import type { ArgumentsCamelCase, CommandModule, Options } from 'yargs';

interface TestCommandArgs {
  setup?: boolean;
  port?: number;
  manifest?: string;
  appId?: string;
}

function handlePluginTestCommand(_args: ArgumentsCamelCase<TestCommandArgs>): never {
  throw new Error('Not implemented');
}

const testOptions: Record<string, Options> = {
  setup: {
    describe: 'setup Automation Framework',
    alias: ['s'],
  },
  port: {
    describe: 'The port number for the uxp developer test service',
    type: 'number',
    default: 4797,
  },
  manifest: {
    describe: 'Relative path to plugin\'s manifest.json file. Defaults to the manifest.json in the current working directory.',
    demandOption: false,
  },
  appId: {
    describe: 'Single App ID into which the plugin\'s test should be executed. The supported app IDs can be retrieved using `uxp apps list`. The default action is to execute test on the first host app specified in the plugin\'s manifest.',
    demandOption: false,
  },
};

const testCommand: CommandModule<object, TestCommandArgs> = {
  command: 'test',
  describe: 'Run the tests for plugin',
  handler: handlePluginTestCommand,
  builder: testOptions,
};

export default testCommand;
