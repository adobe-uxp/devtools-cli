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

import type { AppEndPoint, BaseMessage } from '../../../../types/index.js';
import type { PluginSessionData } from '../../../../types/plugins.js';
import type PluginMgr from '../../PluginMgr.js';
import type PluginSession from '../PluginSession.js';
import util from 'node:util';
import { find, isEqual } from 'lodash-es';
import DevToolsError from '../../../common/DevToolsError.js';
import { CoreErrorCodes, CoreLogMessage } from '../../../common/ErrorCodes.js';
import AppsHelper from '../../../helpers/AppsHelper.js';

export interface CommandParams {
  apps?: string[];
  manifest?: string;
  [key: string]: unknown;
}

export interface CommandResult {
  success: boolean;
  data?: unknown;
  app: AppEndPoint;
  err?: Error;
}

export type ResultsCallback<T = unknown> = (results: CommandResult[]) => T;
export type JsonMessageCreator = (pluginSessionId: string) => BaseMessage;

class PluginBaseCommand {
  protected pm: PluginMgr;
  protected _pluginSession?: PluginSession;
  protected params!: CommandParams;

  constructor(pluginMgr: PluginMgr) {
    this.pm = pluginMgr;
  }

  set pluginSession(session: PluginSession | undefined) {
    this._pluginSession = session;
  }

  get pluginSession(): PluginSession | undefined {
    return this._pluginSession;
  }

  get name(): string {
    return '';
  }

  execute(): Promise<unknown> {
    const validationResult = this.validateParams();
    const validationPromise = validationResult instanceof Promise ? validationResult : Promise.resolve(true);
    return validationPromise.then(() => {
      return this.executeCommand();
    });
  }

  executeCommand(): Promise<unknown> | void {
    // To be overridden by subclasses
  }

  validateParams(): Promise<boolean> | void {
    // To be overridden by subclasses - return Promise<boolean> or void
  }

  getPluginSessions(): PluginSessionData[] {
    const pluginSession = this._pluginSession;
    if (!pluginSession || !Array.isArray(pluginSession.sessions)) {
      throw new DevToolsError(DevToolsError.ErrorCodes.NO_PLUGIN_SESSION);
    }
    return pluginSession.sessions;
  }

  protected _getApplicableAppsForCommand(sessions: PluginSessionData[], inputAppsList: string[]): AppEndPoint[] {
    let loadedAppsEndPoints = sessions.map(session => session.app);
    if (!this.params.apps?.length) {
      return loadedAppsEndPoints;
    }
    loadedAppsEndPoints = AppsHelper.getApplicableAppsFromInput(loadedAppsEndPoints, inputAppsList);
    return loadedAppsEndPoints;
  }

  protected _filterConnectedAppsFromApplicableList(applicableEndPoints: AppEndPoint[]): AppEndPoint[] {
    const connectedApps = this.pm._cliClientMgr.getConnectedApps();
    const applicableAppsForDebugging = AppsHelper.filterConnectedAppsForPlugin(connectedApps, applicableEndPoints);

    if (!applicableAppsForDebugging.length) {
      throw new DevToolsError(DevToolsError.ErrorCodes.PLUGIN_NO_CONNECTED_APPS);
    }
    return applicableAppsForDebugging;
  }

  protected _getSessionDetailsForAppEndpoints(sessions: PluginSessionData[], aep: AppEndPoint[]): PluginSessionData[] {
    const filtered = sessions.filter((session) => {
      const obj = find(aep, ep => isEqual(ep, session.app));
      return !!obj;
    });
    return filtered;
  }

  getSessionDetailsOfApplicableApps(inputAppsList: string[]): PluginSessionData[] {
    const sessions = this.getPluginSessions();
    const applicableEndPoints = this._getApplicableAppsForCommand(sessions, inputAppsList);
    const applicableAppsList = this._filterConnectedAppsFromApplicableList(applicableEndPoints);
    const sessionDetails = this._getSessionDetailsForAppEndpoints(sessions, applicableAppsList);
    return sessionDetails;
  }

  sendMessageToAppsWithReply(appsEndPoint: AppEndPoint[], messages: BaseMessage | BaseMessage[]): Promise<CommandResult[]> {
    const allPromises: Promise<CommandResult>[] = [];
    const cliMgr = this.pm._cliClientMgr;
    const isArray = Array.isArray(messages);
    let index = 0;
    for (const app of appsEndPoint) {
      const message = isArray ? messages[index++] : messages;
      if (!message) {
        continue;
      }
      const prom: Promise<CommandResult> = cliMgr.sendMessageToAppWithReply(app, message)
        .then(data => ({
          success: true,
          data,
          app,
        }))
        .catch(err => ({
          success: false,
          err,
          app,
        }));
      allPromises.push(prom);
    }
    return Promise.all(allPromises);
  }

  protected _sendMessageToAppsAndReconcileResults<T = boolean>(
    appsList: AppEndPoint[],
    messageList: BaseMessage | BaseMessage[],
    resultsCallback?: ResultsCallback<T>,
  ): Promise<T> {
    const prom = this.sendMessageToAppsWithReply(appsList, messageList);
    const isSingleApp = appsList.length === 1;
    return prom.then((results) => {
      let failCount = 0;
      const successfullCommandResults: CommandResult[] = [];
      for (const result of results) {
        if (!result.success) {
          ++failCount;
          const commandFailedOnApp = util.format(CoreLogMessage.COMMAND_FAILED_ON_APP, this.name, result.app.id, result.app.version);
          UxpLogger.error(commandFailedOnApp);
        }
        else {
          const commandSuccessfullOnApp = util.format(CoreLogMessage.COMMAND_SUCCESSFUL_ON_APP, this.name, result.app.id, result.app.version);
          UxpLogger.log(commandSuccessfullOnApp);
          successfullCommandResults.push(result);
        }
      }
      if (failCount === results.length) {
        // all reqs have failed so mark this promise as failed
        if (failCount === 1 && results[0]?.err) {
          // only one app - just use the error code here -
          throw results[0].err;
        }
        const code = isSingleApp ? CoreErrorCodes.COMMAND_FAILED_IN_APP : CoreErrorCodes.COMMAND_FAILED_IN_APP_MULTIPLE;
        throw new DevToolsError(code);
      }
      return resultsCallback ? resultsCallback(successfullCommandResults) : true as unknown as T;
    });
  }

  runCommandOnAllApplicableApps<T = boolean>(jsonMessageCreator: JsonMessageCreator, resultsCallback?: ResultsCallback<T>): Promise<T> {
    const sessionDetails = this.getSessionDetailsOfApplicableApps(this.params.apps || []);
    const applicableAppsList = sessionDetails.map(ses => ses.app);
    const jsonMessagesList = sessionDetails.map(session => jsonMessageCreator(session.pluginSessionId));
    return this._sendMessageToAppsAndReconcileResults(applicableAppsList, jsonMessagesList, resultsCallback);
  }
}

export default PluginBaseCommand;
