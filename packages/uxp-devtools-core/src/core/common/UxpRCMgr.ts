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

import fs from 'node:fs';
import path from 'node:path';

interface PluginSession {
  app: {
    id: string;
    version: string;
  };
  [key: string]: unknown;
}

interface PluginInfo {
  [key: string]: unknown;
}

interface PluginData {
  sessions?: PluginSession[];
  info?: PluginInfo;
}

interface RcConfig {
  [key: string]: unknown;
}

interface RcData {
  config?: RcConfig;
  plugin?: PluginData;
  [key: string]: unknown;
}

// Manages the .uxprc resource config file - which stores details of the current plugin session
// in a persistent way.
class UxpRCMgr {
  public uxprcPath: string;

  constructor() {
    this.uxprcPath = path.resolve('.uxprc');
  }

  private _readRc(): RcData {
    let contents = '{}';
    if (fs.existsSync(this.uxprcPath)) {
      contents = fs.readFileSync(this.uxprcPath, 'utf8');
    }
    return JSON.parse(contents) as RcData;
  }

  private _writeToRc(rcObj: RcData): void {
    fs.writeFileSync(this.uxprcPath, JSON.stringify(rcObj, null, 4), 'utf8');
  }

  setUxprcPath(uxprcDirPath: string): void {
    this.uxprcPath = path.join(uxprcDirPath, '.uxprc');
  }

  private _readEntry<K extends keyof RcData>(key: K): RcData[K] {
    const rc = this._readRc();
    return rc[key];
  }

  private _writeEntry<K extends keyof RcData>(key: K, data: RcData[K]): void {
    const rc = this._readRc();
    rc[key] = data;
    this._writeToRc(rc);
  }

  readConfig(): RcConfig | undefined {
    return this._readEntry('config');
  }

  commitConfig(config: RcConfig): void {
    this._writeEntry('config', config);
  }

  readPluginSession(): PluginData | undefined {
    return this._readEntry('plugin');
  }

  writePluginSession(sessions: PluginSession[], pluginInfo?: PluginInfo): void {
    const plugin: PluginData = this._readEntry('plugin') || {};
    plugin.sessions = plugin.sessions || [];
    plugin.info = pluginInfo || {};

    for (const session of sessions) {
      const index = plugin.sessions.findIndex(obj => (obj.app.id === session.app.id && obj.app.version === session.app.version));
      if (index >= 0) {
        plugin.sessions[index] = session;
      }
      else {
        plugin.sessions.push(session);
      }
    }

    this._writeEntry('plugin', plugin);
  }
}

export default new UxpRCMgr();
