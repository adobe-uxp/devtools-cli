/*
 * Type definitions for uxp-devtools-helper
 */

export type DeferredPromise<T> = PromiseWithResolvers<T> & {
  handled?: boolean;
};

export interface AppInfo {
  appId: string;
  appVersion: string;
  name: string;
}

export interface PortListenerData {
  payload: string;
  appId: string;
  appVersion: string;
}

export type PortListener = (type: string, data: PortListenerData) => void;

export interface DevToolsCommandOptions {
  controlled?: boolean;
  scriptsFolder?: string;
}

export interface VulcanAdapter {
  getAppsList: () => string[];
  setServerDetails: (isStarted: boolean, payload: string) => void;
  getServicePort: (callback: (type: string, payload: string, appId: string, appVersion: string) => void) => void;
  disconnect: () => void;
}

export interface DevToolsNativeLibType {
  VulcanAdapter: new (appId: string, version: string) => VulcanAdapter;
}
