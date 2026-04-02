/*
 * Handler type definitions for dynamic method dispatch
 */

import type { AppEndPoint, BaseMessage, CDTBrowserMessage, CDTMessage, HostAppLogDetails, PluginMessage, ProxyMessage, UXPMessage } from './messages.js';

// Callback type for request handlers
export type RequestCallback<T = BaseMessage> = (err: Error | null, reply: T) => void;

// Message command types
export type MessageCommand
  = | 'reply'
    | 'proxy'
    | 'UXP'
    | 'CDT'
    | 'CDTBrowser'
    | 'initRuntimeClient';

// Handler command types (for handleRequestWithReply)
export type HandlerCommand = 'Plugin';

// Event names for handleEvent
export type ServerEventName
  = | 'didAddRuntimeClient'
    | 'clientDidConnect'
    | 'completedConnection'
    | 'didPluginUnloaded'
    | 'hostAppLog'
    | 'clientDidDisconnect'
    | 'UDTAppQuit';

// Connection message commands
export type ConnectionMessageCommand
  = | 'didCompleteConnection'
    | 'didAddRuntimeClient'
    | 'didPluginUnloaded'
    | 'hostAppLog'
    | 'didRemoveRuntimeClient'
    | 'reply';

// Message handler function types
export type MessageHandler<T extends BaseMessage = BaseMessage> = (message: T) => void;
export type RequestHandler<T extends BaseMessage = BaseMessage> = (message: T, callback: RequestCallback) => void;
export type EventHandler = (...args: unknown[]) => void;

// Interface for classes with message handlers
export interface MessageHandlerMixin {
  msg_reply?: (data: BaseMessage) => void;
  msg_proxy?: (data: ProxyMessage) => void;
  msg_UXP?: (message: UXPMessage) => void;
  msg_CDT?: (message: CDTMessage) => void;
  msg_CDTBrowser?: (message: CDTBrowserMessage) => void;
  msg_initRuntimeClient?: () => void;
}

// Interface for classes with request handlers
export interface RequestHandlerMixin {
  handler_Plugin?: (message: PluginMessage, callback: RequestCallback) => void;
}

// Interface for classes with event handlers
export interface EventHandlerMixin {
  on_didAddRuntimeClient?: (data: { app: AppEndPoint }) => void;
  on_clientDidConnect?: () => void;
  on_completedConnection?: () => void;
  on_didPluginUnloaded?: (data: { plugin: { pluginId: string } }) => void;
  on_hostAppLog?: (data: HostAppLogDetails) => void;
  on_clientDidDisconnect?: () => void;
  on_UDTAppQuit?: () => void;
}

// Connection message handlers
export interface ConnectionMessageHandlers {
  msg_didCompleteConnection?: () => void;
  msg_didAddRuntimeClient?: (data: BaseMessage) => void;
  msg_didPluginUnloaded?: (data: BaseMessage) => void;
  msg_hostAppLog?: (data: BaseMessage & { details?: HostAppLogDetails }) => void;
  msg_didRemoveRuntimeClient?: (data: BaseMessage & { id?: number }) => void;
  msg_reply?: (data: BaseMessage) => void;
}

// Helper type for dynamic method access
export type DynamicMethodKey<Prefix extends string, Commands extends string> = `${Prefix}${Commands}`;
