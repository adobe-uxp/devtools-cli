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
import { UDTApplication } from '@adobe-fixed-uxp/uxp-devtools-core';
import yargs from 'yargs';

interface CommandResult<T = unknown> {
  data?: T;
  error?: Error;
  success: boolean;
}

// Use the standard yargs CommandModule type - handlers should return void | Promise<void>
type ExtendedCommandModule = CommandModule;

class Tool {
  public Tool: typeof Tool;
  public app: ReturnType<typeof UDTApplication.instance>;
  private _commands: ExtendedCommandModule[];
  private _currentCommand: string = '';

  constructor(modules: ExtendedCommandModule[]) {
    this.Tool = Tool;
    this.app = UDTApplication.instance();
    this._commands = modules;
  }

  async run(args: string[]): Promise<void> {
    // Make sure we don't accept paramaters that are not defined.
    const yargsInstance = yargs(args);
    yargsInstance.strict(true);
    const origYargsCommand = yargsInstance.command.bind(yargsInstance);

    type HandlerFn = (args: unknown) => void | Promise<void>;

    const wrapHandler = (handler: HandlerFn | undefined): HandlerFn | undefined => {
      if (!handler) {
        return undefined;
      }
      return async (handlerArgs: unknown): Promise<void> => {
        // return a promise object -
        try {
          await handler.call(this, handlerArgs);
          const commandResult: CommandResult = {
            success: true,
          };
          if (process.env.NODE_ENV === 'test') {
            console.log(JSON.stringify(commandResult));
          }
        }
        catch (err: unknown) {
          console.error(`Command '${this._currentCommand}' failed.`);
          console.error(`${err}`);
          // crajTODO - check if tests gets affected by setting this.
          process.exitCode = 1;
          const commandResult: CommandResult = {
            error: err as Error,
            success: false,
          };
          if (process.env.NODE_ENV === 'test') {
            console.log(JSON.stringify(commandResult));
          }
        }
      };
    };

    // wrap the command handler into common one - we can inject common objects here -
    // and also handle any errors etc.
    (yargsInstance as unknown as { command: (mod: ExtendedCommandModule) => Argv }).command = (mod: ExtendedCommandModule): Argv => {
      const module = { ...mod };
      const wrappedHandler = wrapHandler(module.handler as HandlerFn | undefined);
      if (wrappedHandler) {
        module.handler = wrappedHandler;
      }
      return origYargsCommand(module);
    };

    for (const command of this._commands) {
      yargsInstance.command(command);
    }

    const params = await (yargsInstance.help().recommendCommands().argv);
    const cmds = params._;
    if (!cmds.length) {
      yargsInstance.showHelp();
      return;
    }
    this._currentCommand = cmds.join(' ');
  }
}

export default Tool;
export type { CommandResult, ExtendedCommandModule };
