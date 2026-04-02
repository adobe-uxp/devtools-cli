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

import type { CommandModule } from 'yargs';
import { CoreHelpers } from '@adobe-fixed-uxp/uxp-devtools-core';
import Table from 'cli-table3';

interface AppInfo {
  id: string;
  version: string;
  name: string;
}

interface CommandContext {
  app: {
    logLevel: number;
    client: {
      executePluginCommand: (command: string, ...args: unknown[]) => Promise<AppInfo[]>;
    };
  };
}

async function handleAppsListCommand(this: CommandContext): Promise<void> {
  this.app.logLevel = CoreHelpers.LoggerLevel.WARN;
  const appsList = await this.app.client.executePluginCommand('connectedApps');
  if (!appsList || !appsList.length) {
    console.warn('No Host apps are currently connected to uxp devtools cli service');
    console.warn('Please make sure that you have launched an application that supports UXP Developer Tools and try again.');
    return;
  }

  const tableOptions = {
    head: ['ID', 'Version', 'Name'],
    style: { head: ['green'] },
    wordWrap: true,
  };
  const table = new Table(tableOptions);
  appsList.forEach((app) => {
    table.push([app.id, app.version, app.name]);
  });

  console.log('List of Host Apps currently connected to UXP devtools cli service');
  console.log(table.toString());
}

const appsListCommand: CommandModule = {
  command: 'list',
  describe: 'List Applications that are currently connected to the uxp devtools cli service.',
  handler: handleAppsListCommand,
};

export {
  appsListCommand,
};
