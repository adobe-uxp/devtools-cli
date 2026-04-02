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
import type UxpDevtoolsInitializerParams from './UDTInitializerParams.js';
import Logger from '../common/Logger.js';
import UxpDevtoolsClient from './UDTClient.js';
import UxpDevtoolsServer from './UDTServer.js';

interface AppState {
  servicePort?: number;
  hostDelegate?: UxpDevtoolsHostDelegate;
  client?: UxpDevtoolsClient;
  server?: UxpDevtoolsServer;
}

const appState: AppState = {};

function installGlobalLogger(logger: typeof Logger): void {
  if (globalThis.UxpLogger) {
    console.error('Global Logger is already initialized. This should not be the case');
  }
  globalThis.UxpLogger = logger;
}

class UxpDevtoolsApplicationImpl {
  constructor(initParams: UxpDevtoolsInitializerParams) {
    appState.servicePort = initParams.servicePort;
    const { logger } = initParams;
    if (logger) {
      Logger.setProvider(logger);
    }
    installGlobalLogger(Logger);
    appState.hostDelegate = initParams.hostDelegate;
  }

  get logLevel(): number {
    return Logger.level;
  }

  set logLevel(level: number) {
    Logger.level = level;
  }

  get client(): UxpDevtoolsClient {
    if (!appState.client) {
      appState.client = new UxpDevtoolsClient(appState.servicePort);
    }
    return appState.client;
  }

  get server(): UxpDevtoolsServer {
    if (!appState.server) {
      appState.server = new UxpDevtoolsServer();
    }
    return appState.server;
  }
}

let sIntializerInstance: UxpDevtoolsApplicationImpl | null = null;

class UxpDevtoolsApplication {
  static createInstance(initializerParams: UxpDevtoolsInitializerParams): void {
    if (sIntializerInstance) {
      throw new Error('Devtools Initializer instance is already created!');
    }
    sIntializerInstance = new UxpDevtoolsApplicationImpl(initializerParams);
  }

  static instance(): UxpDevtoolsApplicationImpl | null {
    return sIntializerInstance;
  }
}

export default UxpDevtoolsApplication;
