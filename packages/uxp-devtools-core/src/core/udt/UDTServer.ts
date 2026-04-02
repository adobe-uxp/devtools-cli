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

import type { DevToolsCommandOptions } from '../common/DevToolsMgr.js';
import DevToolsMgr from '../common/DevToolsMgr.js';
import kill from '../common/KillProcess.js';
import ServiceMgr from '../service/ServiceMgr.js';

export interface ServiceRunningResult {
  success: boolean;
  port?: number;
}

class UxpDevToolsServer {
  private _serviceMgr: ServiceMgr;
  private _devToolsMgr: DevToolsMgr;

  constructor() {
    this._serviceMgr = new ServiceMgr();
    this._devToolsMgr = new DevToolsMgr(true);
  }

  async enableDevTools(options: DevToolsCommandOptions | null = null): Promise<void> {
    await this._devToolsMgr.enableDevTools(options ?? undefined);
  }

  async disableDevTools(options: DevToolsCommandOptions | null = null): Promise<void> {
    await this._devToolsMgr.disableDevTools(options ?? undefined);
    if (options?.port) {
      await kill(options.port, 'tcp');
    }
  }

  isServiceRunning(): Promise<ServiceRunningResult> {
    const result: ServiceRunningResult = { success: false };
    return this._devToolsMgr.discoverServicePort().then((port) => {
      result.success = true;
      result.port = port ?? undefined;
      return result;
    }).catch(() => {
      return result;
    });
  }

  isDevToolsEnabled(): Promise<boolean> {
    return this._devToolsMgr.isDevToolsEnabled();
  }

  startServer(port: number): Promise<boolean> {
    const prom = this._serviceMgr.start(port);
    return prom.then(() => {
      UxpLogger.log(`UXP Developer Service now running at port ${port}`);
      // set the server port details - so that it can be discovered by
      // clients via Vulcan Messages.
      this.setServerDetails(port);
      return true;
    });
  }

  handleAppQuit(): void {
    this._serviceMgr.handleAppQuit();
  }

  setServerDetails(port: number): void {
    this._devToolsMgr.setServerDetails(port);
  }
}

export default UxpDevToolsServer;
