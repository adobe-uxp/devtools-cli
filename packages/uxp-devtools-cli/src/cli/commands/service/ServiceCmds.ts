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

import type { ArgumentsCamelCase, CommandModule, Options } from 'yargs';
import { CoreHelpers } from '@adobe-fixed-uxp/uxp-devtools-core';

interface StartCommandArgs {
  port: number;
}

interface CommandContext {
  app: {
    server: {
      isDevToolsEnabled: () => Promise<boolean>;
      enableDevTools: () => Promise<boolean>;
      startServer: (port: number) => Promise<boolean>;
    };
  };
}

async function handleServiceStartCommand(this: CommandContext, argv: ArgumentsCamelCase<StartCommandArgs>): Promise<void> {
  // start the service at the given port.
  let isEnabled = false;
  try {
    isEnabled = await this.app.server.isDevToolsEnabled();
    if (!isEnabled) {
      console.log('UXP Developer Tools is not enabled. uxp cli will try to run devtools `enable command` to enable it.');
      isEnabled = await this.app.server.enableDevTools();
    }
  }
  catch (err) {
    console.error(`Devtools enable command failed with ${err}`);
    // silently eat the error so we can continue.
  }

  if (!isEnabled) {
    console.log('UXP Developer workflow is not enabled. Please enable it before you start the cli service');
    return;
  }

  const { port } = argv;
  const isAvailable = await CoreHelpers.isPortAvailable(port);
  if (!isAvailable) {
    throw new Error(`The port ${port} is occupied. Please try another port or close the application which is using the port and try again.`);
  }
  await this.app.server.startServer(port);
}

const startOptions: Record<string, Options> = {
  port: {
    describe: 'The port number for the uxp developer service',
    type: 'number',
    default: 14001,
  },
};

const startCommand: CommandModule<object, StartCommandArgs> = {
  command: 'start',
  describe: 'Starts the UXP Developer service. If UXP Developer Tools support is not currently enabled, this command will also attempt to enable support.',
  builder: startOptions,
  handler: handleServiceStartCommand,
};

// export all service related commands here
export {
  startCommand,
};
