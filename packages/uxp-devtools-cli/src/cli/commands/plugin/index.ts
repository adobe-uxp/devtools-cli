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

import type { Argv, CommandModule } from 'yargs';
import debugCommand from './debug.js';
import initCommand from './init.js';
import loadCommand from './load.js';
import logCommand from './log.js';
import packageCommand from './package.js';
import testCommand from './pluginTest.js';
import reloadCommand from './reload.js';
import unloadCommand from './unload.js';
import validateCommand from './validate.js';
import watchCommand from './watch.js';

function registerPluginSubCommands(yargs: Argv): Argv {
  return yargs.command(loadCommand).command(debugCommand).command(reloadCommand).command(logCommand).command(initCommand).command(validateCommand).command(unloadCommand).command(watchCommand).command(packageCommand).command(testCommand);
}

const PluginCommand: CommandModule = {
  command: 'plugin <command>',
  describe: 'Load, reload, watch, debug, unload, test, package, validate plugins',
  builder: registerPluginSubCommands,
  handler: () => {},
};

export default PluginCommand;
