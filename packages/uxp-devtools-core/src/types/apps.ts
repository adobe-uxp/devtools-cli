/*
 * App-related type definitions
 */

import type { AppEndPoint } from './messages.js';
import type { AppInfo } from './plugins.js';

export type { AppInfo } from './plugins.js';

export interface ConnectedApp {
  id: number;
  appEndPoint: AppEndPoint;
  appInfo?: AppInfo;
}

export interface RuntimeClientData {
  id: number;
  app: AppEndPoint;
}

export interface HostAppClient {
  id: number;
  appEndPoint: AppEndPoint;
  sendMessageWithReply: (connection: unknown, message: unknown) => Promise<unknown>;
}

export type AppConnectionEvent
  = | 'clientConnectionReady'
    | 'clientConnectionClosed'
    | 'appConnected'
    | 'appDisconnected';

export type PluginStateEvent = 'pluginUnloaded';

export type HostAppLogEvent = 'hostAppLog';

export type AppConnectionListener = (event: AppConnectionEvent, app?: AppEndPoint) => void;
export type PluginStateListener = (event: PluginStateEvent, plugin: { pluginId: string }) => void;
export type HostAppLogListener = (event: HostAppLogEvent, data: unknown) => void;
