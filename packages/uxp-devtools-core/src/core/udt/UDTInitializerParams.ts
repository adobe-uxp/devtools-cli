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

import type UxpDevtoolsHostDelegate from './HostDelegate.js';

export interface LoggerProvider {
  error: (msg: string) => void;
  warn: (msg: string) => void;
  log: (msg: string) => void;
  verbose: (msg: string) => void;
}

class UxpDevtoolsInitializerParams {
  private _servicePort?: number;
  private _logger?: LoggerProvider;
  private _hostDelegate?: UxpDevtoolsHostDelegate;

  set servicePort(port: number | undefined) {
    this._servicePort = port;
  }

  get servicePort(): number | undefined {
    return this._servicePort;
  }

  set logger(logg: LoggerProvider | undefined) {
    this._logger = logg;
  }

  get logger(): LoggerProvider | undefined {
    return this._logger;
  }

  set hostDelegate(delegate: UxpDevtoolsHostDelegate | undefined) {
    this._hostDelegate = delegate;
  }

  get hostDelegate(): UxpDevtoolsHostDelegate | undefined {
    return this._hostDelegate;
  }
}

export default UxpDevtoolsInitializerParams;
