/*
 * Message type definitions
 */

export interface BaseMessage {
  command: string;
  requestId?: number;
  error?: string;
}

export interface ReplyMessage extends BaseMessage {
  command: 'reply';
}

export interface ProxyMessage extends BaseMessage {
  command: 'proxy';
  clientId: number;
  message: BaseMessage;
}

interface PluginMessageBase extends BaseMessage {
  command: 'Plugin';
}

export interface PluginProviderParams {
  provider: {
    type: string;
    id: string;
    path: string;
  };
}

/**
 * Flexible plugin message type for internal mutable operations.
 * Use the discriminated union `PluginMessage` for type-safe external APIs.
 */
export interface PluginMessageAny extends BaseMessage {
  command: 'Plugin';
  action: PluginMessage['action'];
  pluginSessionId?: string;
  breakOnStart?: boolean;
  params?: {
    provider?: {
      type?: string;
      id?: string;
      path?: string;
    };
    [key: string]: unknown;
  };
  manifest?: unknown;
}

export interface PluginLoadMessage extends PluginMessageBase {
  action: 'load';
  params: PluginProviderParams;
  breakOnStart?: boolean;
}

export interface PluginUnloadMessage extends PluginMessageBase {
  action: 'unload';
  pluginSessionId: string;
}

export interface PluginReloadMessage extends PluginMessageBase {
  action: 'reload';
  pluginSessionId: string;
}

export interface PluginDebugMessage extends PluginMessageBase {
  action: 'debug';
  pluginSessionId: string;
}

export interface PluginListMessage extends PluginMessageBase {
  action: 'list';
}

export interface PluginValidateMessage extends PluginMessageBase {
  action: 'validate';
  params: PluginProviderParams;
  manifest: unknown;
}

export interface PluginCdtConnectedMessage extends PluginMessageBase {
  action: 'cdtConnected';
  pluginSessionId: string;
}

export interface PluginCdtDisconnectedMessage extends PluginMessageBase {
  action: 'cdtDisconnected';
  pluginSessionId: string;
}

export interface PluginDiscoverMessage extends PluginMessageBase {
  action: 'discover';
}

export type PluginMessage =
  | PluginLoadMessage
  | PluginUnloadMessage
  | PluginReloadMessage
  | PluginDebugMessage
  | PluginListMessage
  | PluginValidateMessage
  | PluginCdtConnectedMessage
  | PluginCdtDisconnectedMessage
  | PluginDiscoverMessage;

interface UXPMessageBase extends BaseMessage {
  command: 'UXP';
}

export interface UXPUnloadedMessage extends UXPMessageBase {
  action: 'unloaded';
  pluginSessionId: string;
}

export interface UXPLogMessage extends UXPMessageBase {
  action: 'log';
  level: string;
  message: string;
}

export type UXPMessage = UXPUnloadedMessage | UXPLogMessage;

export interface CDTMessage extends BaseMessage {
  command: 'CDT';
  pluginSessionId?: string;
  cdtMessage?: string;
}

interface CDTBrowserMessageBase extends BaseMessage {
  command: 'CDTBrowser';
}

export interface CDTBrowserCdtMessage extends CDTBrowserMessageBase {
  action: 'cdtMessage';
  cdtMessage: string;
}

export interface CDTBrowserConnectedMessage extends CDTBrowserMessageBase {
  action: 'cdtConnected';
}

export interface CDTBrowserDisconnectedMessage extends CDTBrowserMessageBase {
  action: 'cdtDisconnected';
}

export type CDTBrowserMessage =
  | CDTBrowserCdtMessage
  | CDTBrowserConnectedMessage
  | CDTBrowserDisconnectedMessage;

export interface AppInfoMessage extends BaseMessage {
  command: 'App';
  action: 'info';
}

export interface InitRuntimeClientMessage extends BaseMessage {
  command: 'initRuntimeClient';
}

export interface DidCompleteConnectionMessage extends BaseMessage {
  command: 'didCompleteConnection';
}

export interface DidAddRuntimeClientMessage extends BaseMessage {
  command: 'didAddRuntimeClient';
  app?: AppEndPoint;
}

export interface DidRemoveRuntimeClientMessage extends BaseMessage {
  command: 'didRemoveRuntimeClient';
  id?: number;
  app?: AppEndPoint;
}

export interface DidPluginUnloadedMessage extends BaseMessage {
  command: 'didPluginUnloaded';
  plugin?: PluginInfo;
}

export interface HostAppLogMessage extends BaseMessage {
  command: 'hostAppLog';
  details?: HostAppLogDetails;
}

export interface AppEndPoint {
  id: string;
  version?: string;
}

export interface PluginInfo {
  pluginId: string;
  pluginPath: string;
}

export interface HostAppLogDetails {
  level: string;
  message: string;
  appInfo: {
    appId: string;
    appName: string;
    appVersion: string;
    uxpVersion: string;
  };
}

export type AnyMessage
  = | BaseMessage
    | ReplyMessage
    | ProxyMessage
    | PluginMessage
    | UXPMessage
    | CDTMessage
    | CDTBrowserMessage
    | AppInfoMessage
    | InitRuntimeClientMessage
    | DidCompleteConnectionMessage
    | DidAddRuntimeClientMessage
    | DidRemoveRuntimeClientMessage
    | DidPluginUnloadedMessage
    | HostAppLogMessage;
