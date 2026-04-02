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

import { LoggerLevel } from './Utils.js';

interface LoggerProvider {
  error: (msg: string) => void;
  warn: (msg: string) => void;
  log: (msg: string) => void;
  verbose: (msg: string) => void;
}

interface LogMethod {
  name: 'error' | 'warn' | 'log' | 'verbose';
  level: number;
}

export class Logger {
  private _level: number;
  private _provider?: LoggerProvider;

  // Dynamically created methods
  error!: (msg: string) => void;
  warn!: (msg: string) => void;
  log!: (msg: string) => void;
  verbose!: (msg: string) => void;

  constructor() {
    this._level = LoggerLevel.DEFAULT;
    this.init();
  }

  private init(): void {
    const methods: LogMethod[] = [{
      name: 'error',
      level: LoggerLevel.ERROR,
    }, {
      name: 'warn',
      level: LoggerLevel.WARN,
    }, {
      name: 'log',
      level: LoggerLevel.INFO,
    }, {
      name: 'verbose',
      level: LoggerLevel.VERBOSE,
    }];

    for (const method of methods) {
      // Capture values directly to avoid closure issues
      const methodName = method.name;
      const methodLevel = method.level;
      this[methodName] = (msg: string): void => {
        if (this._provider) {
          this._provider[methodName](msg);
          return;
        }
        if (this._level < methodLevel) {
          return; // log-level severity is more so ignore.
        }
        const consoleMethodName = methodName === 'verbose' ? 'log' : methodName;
        console[consoleMethodName](msg);
      };
    }
  }

  get level(): number {
    return this._level;
  }

  setProvider(provider: LoggerProvider): void {
    this._provider = provider;
  }

  set level(level: number) {
    this._level = level;
  }
}

const loggerInstance = new Logger();

export default loggerInstance;
