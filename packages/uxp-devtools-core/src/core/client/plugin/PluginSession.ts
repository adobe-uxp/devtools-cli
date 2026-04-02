import type { AppEndPoint } from '../../../types/index.js';
import type { LoadResult, PluginSessionData } from '../../../types/plugins.js';
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
import { find, isEqual } from 'lodash-es';
import UxpRcMgr from '../../common/UxpRCMgr.js';

export interface PluginInfo {
  id: string;
  name?: string;
}

class PluginSession {
  private _sessions: PluginSessionData[];
  private _pluginInfo: PluginInfo;

  static createFromRcFile(): PluginSession {
    const data = UxpRcMgr.readPluginSession();
    if (!data) {
      throw new Error('No data found in .uxprc file');
    }
    if (!data.sessions) {
      throw new Error('No sessions found in .uxprc file');
    }
    if (!data.info) {
      throw new Error('No info found in .uxprc file');
    }
    // Convert sessions from RC file format to PluginSessionData format
    const sessions: PluginSessionData[] = data.sessions.map(session => ({
      app: {
        id: session.app.id,
        version: session.app.version,
      },
      pluginSessionId: (session as { pluginSessionId?: string }).pluginSessionId ?? '',
    }));
    return new PluginSession(sessions, data.info as unknown as PluginInfo);
  }

  static createFromLoadResults(loadResults: LoadResult[], pluginInfo: PluginInfo): PluginSession {
    const sessions = loadResults.map((res) => {
      const { app, data } = res;
      return {
        app,
        pluginSessionId: data!.pluginSessionId,
      };
    });
    return new PluginSession(sessions, pluginInfo);
  }

  constructor(sessions: PluginSessionData[], pluginInfo?: PluginInfo) {
    this._sessions = sessions;
    this._pluginInfo = pluginInfo || { id: '' };
  }

  get sessions(): PluginSessionData[] {
    return this._sessions;
  }

  get pluginInfo(): PluginInfo {
    return this._pluginInfo;
  }

  getSessionForApp(appEndPoint: AppEndPoint): PluginSessionData | undefined {
    return find(this._sessions, ses => isEqual(ses.app, appEndPoint));
  }

  commitToRc(uxprcDirPath: string): void {
    UxpRcMgr.setUxprcPath(uxprcDirPath);
    // Convert PluginSessionData[] to the format expected by UxpRcMgr
    const sessions = this._sessions.map(session => ({
      app: {
        id: session.app.id,
        version: session.app.version ?? '',
      },
      pluginSessionId: session.pluginSessionId,
    }));
    // Cast to the PluginInfo type expected by UxpRcMgr (has index signature)
    UxpRcMgr.writePluginSession(sessions, this._pluginInfo as unknown as { [key: string]: unknown });
  }
}

export default PluginSession;
