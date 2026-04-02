/*
 * Plugin-related type definitions
 */

import type { AppEndPoint } from './messages.js';

export interface PluginManifest {
  id: string;
  name?: string;
  version?: string;
  host?: HostConfig | HostConfig[];
  [key: string]: unknown;
}

export interface HostConfig {
  app: string;
  minVersion?: string;
}

export interface PluginSessionInfo {
  pluginId: string;
  pluginPath: string;
  hostPlugInSessionId: string;
  appInfo: AppInfo;
  clientSessionId?: string;
}

export interface PluginSessionData {
  app: AppEndPoint;
  pluginSessionId: string;
}

export interface PluginLoadParams {
  manifest?: string;
  apps?: string[];
  breakOnStart?: boolean;
  [key: string]: unknown;
}

export interface PluginDebugParams {
  manifest?: string;
  apps?: string[];
  [key: string]: unknown;
}

export interface PluginReloadParams {
  manifest?: string;
  apps?: string[];
  [key: string]: unknown;
}

export interface PluginUnloadParams {
  manifest?: string;
  apps?: string[];
  [key: string]: unknown;
}

export interface PluginValidateParams {
  manifest?: string;
  apps?: string[];
  [key: string]: unknown;
}

export interface PluginPackageParams {
  manifest?: string;
  apps?: string[];
  outputPath?: string;
  [key: string]: unknown;
}

export interface PluginLogParams {
  manifest?: string;
  apps?: string[];
  [key: string]: unknown;
}

export interface PluginTestParams {
  manifest?: string;
  apps?: string[];
  driverPort?: number;
  servicePort?: number;
  [key: string]: unknown;
}

export interface AppInfo {
  appId: string;
  appName: string;
  appVersion: string;
  uxpVersion: string;
  platform?: string;
  sandbox?: boolean;
  sandboxStoragePath?: string;
}

export interface LoadResult {
  success: boolean;
  data?: {
    pluginSessionId: string;
  };
  app: AppEndPoint;
  err?: Error;
}

export interface DebugResult {
  wsdebugUrl: string;
  chromeDevToolsUrl: string;
}
