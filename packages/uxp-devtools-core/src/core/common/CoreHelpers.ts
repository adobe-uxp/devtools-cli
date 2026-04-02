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

import net from 'node:net';
import PluginSession from '../client/plugin/PluginSession.js';
import { LoggerLevel } from '../common/Utils.js';
import WatchServiceMgr from '../common/WatchServiceMgr.js';
import ManifestHelper from '../helpers/ManifestHelper.js';

function isPortAvailable(port: number): Promise<boolean> {
  const deferred = Promise.withResolvers<boolean>();

  const sock = new net.Socket();
  sock.setTimeout(2000);
  sock.on('connect', () => {
    sock.destroy();
    deferred.resolve(false);
  }).on('error', () => {
    deferred.resolve(true);
  }).on('timeout', () => {
    deferred.resolve(true);
  }).connect(port, '127.0.0.1');

  return deferred.promise;
}

export default {
  isPortAvailable,
  PluginSession,
  LoggerLevel,
  ManifestHelper,
  WatchServiceMgr,
};

export { isPortAvailable };
