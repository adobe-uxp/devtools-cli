#!/usr/bin/env node
import type { ExtendedCommandModule } from './cli/utils/Tool.js';
import { UDTApplication } from '@adobe-fixed-uxp/uxp-devtools-core';

import appsCommand from './cli/commands/apps/index.js';
import devtoolsCommand from './cli/commands/devtools/index.js';
import pluginCommand from './cli/commands/plugin/index.js';
import serviceCommand from './cli/commands/service/index.js';
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
import Tool from './cli/utils/Tool.js';

const commands: ExtendedCommandModule[] = [
  appsCommand,
  devtoolsCommand,
  pluginCommand,
  serviceCommand,
  // TODO(craj) - disabling init related command - webpack has some issues with this.
  // require("./cli/commands/plugin/init"),
];

class UxpDevtoolsCLI {
  static run(): void {
    // Pass empty object - optional params will use defaults
    UDTApplication.createInstance({} as Parameters<typeof UDTApplication.createInstance>[0]);

    const args = process.argv.slice(2);
    const tool = new Tool(commands);
    tool.run(args);
  }
}

UxpDevtoolsCLI.run();
