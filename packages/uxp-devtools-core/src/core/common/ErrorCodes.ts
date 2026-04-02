/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// Error code types - can be either numeric or string codes
type ErrorCode = number | string;

class CoreErrorCodes {
  static PORT_IN_USE = 1;
  static INVALID_COMMAND_NAME = 2;
  static NO_PLUGIN_SESSION = 3;
  static PLUGIN_NO_CONNECTED_APPS = 4;
  static PLUIGN_LOAD_FAILED = 5;
  static PLUIGN_RELOAD_FAILED = 6;
  static PLUIGN_DEBUG_FAILED = 7;
  static COMMAND_FAILED_ON_APP = 8;
  static SERVICE_FAILED_PORT_INUSE = 10;
  static PLUGIN_CMD_PARAM_MANIFEST_PATH = 11;
  static COMMAND_FAILED_IN_APP_MULTIPLE = 12;
  static COMMAND_FAILED_ON_ALL_APPS = 13;
  static PLUIGN_VALIDATE_FAILED = 14;
  static NO_APPS_CONNECTED_TO_SERVICE = 15;
  static PLUGIN_NO_APPLICABLE_APPS = 16;
  static COMMAND_FAILED_IN_APP = 17;

  // Add Plugin
  static NO_MANIFEST = 'ERR2_NOMANIFEST';
  static ALREADY_ADDED = 'ERR2_DUPLICATEPLUGIN';
  static INVALID_MANIFEST = 'ERR2_INVALIDMANIFEST';
  static INVALID_PARAM = 'ERR2_INVALIDPARAM';
  static GENERIC_ADDFAIL = 'ERR2_ADDFAIL';
  static DIALOG_CANCELLED = 'ERR2_DIALOGCANCELLED';

  static ENABLE_DEVTOOLS_FAIL = 'ERR1_ENABLEDEVTOOLSFAIL';
  // Create Plugin
  static INVALID_PERMISSIONS = 'ERR4_DIRPERM';
  static NONEMPTY_DIRECTORY = 'ERR4_NONEMPTY_DIRECTORY';
  static GENERIC_CREATE_FAIL = 'ERR4_CREATEFAIL';

  // Debug Plugin
  static GENERIC_DEBUG_FAIL = 'ERR5_DEBUGFAIL';
  // Load Plugin
  static GENERIC_LOADFAIL = 'ERR3_LOADFAIL';

  // Unload Plugin
  static GENERIC_UNLOADFAIL = 'ERR6_UNLOADFAIL';

  // Package Plugin
  static GENERIC_PACKAGEFAIL = 'ERR7_PACKAGEFAIL';

  // Reload Plugin
  static GENERIC_RELOADFAIL = 'ERR8_RELOADFAIL';

  // Success Messages
  static PLUGIN_LOAD_SUCCESS = 1000;
  static PLUGIN_RELOAD_SUCCESS = 1001;
  static PLUGIN_DEBUG_SUCCESS = 1002;

  // Debug session
  static INVALID_DEBUG_SESSION = 'ERR_INVALID_DEBUG_SESSION';
}

// Alias for backward compatibility
const EC = CoreErrorCodes;

// User-friendly error messages mapped by error code
const CoreErrorUserMessage: Record<ErrorCode, string> = {
  // Numeric error codes
  [CoreErrorCodes.PORT_IN_USE]: 'Port %d is already in use.',
  [CoreErrorCodes.INVALID_COMMAND_NAME]: 'Invalid Command Name',
  [CoreErrorCodes.NO_PLUGIN_SESSION]: 'This plugin doesn\'t have valid develop session. Ensure that the plugin is first loaded in the host app ( via `uxp plugin load` command ) and try again.',
  [CoreErrorCodes.PLUGIN_NO_CONNECTED_APPS]: 'Host Application specified in the plugin manifest is not available. Make sure the host application is started.',
  [CoreErrorCodes.PLUIGN_LOAD_FAILED]: 'Plugin Load Failed',
  [CoreErrorCodes.PLUIGN_RELOAD_FAILED]: 'Plugin Reload Failed',
  [CoreErrorCodes.PLUIGN_DEBUG_FAILED]: 'Plugin Debug Failed',
  [CoreErrorCodes.PLUIGN_VALIDATE_FAILED]: 'Plugin Manifest Validation Failed',
  [CoreErrorCodes.COMMAND_FAILED_IN_APP_MULTIPLE]: 'Command execution failed in all connected applications.',
  [CoreErrorCodes.COMMAND_FAILED_IN_APP]: 'Command execution failed in the application.',
  [CoreErrorCodes.SERVICE_FAILED_PORT_INUSE]: 'Failed to Start Devtools Service. Port %d is already in use.',
  [CoreErrorCodes.PLUGIN_CMD_PARAM_MANIFEST_PATH]: 'Plugin manifest.json file path is not valid',
  [CoreErrorCodes.NO_APPS_CONNECTED_TO_SERVICE]: 'No applications are connected to the service. Make sure the target application is running and connected to the service.',
  [CoreErrorCodes.PLUGIN_NO_APPLICABLE_APPS]: 'Plugin doesn\'t have any of its applicable applications currently connected to service.',
  [CoreErrorCodes.COMMAND_FAILED_ON_ALL_APPS]: 'Command failed on all applications.',

  // Success Messages
  [CoreErrorCodes.PLUGIN_LOAD_SUCCESS]: 'Plugin Load Successful',
  [CoreErrorCodes.PLUGIN_RELOAD_SUCCESS]: 'Plugin Reload Successful',
  [CoreErrorCodes.PLUGIN_DEBUG_SUCCESS]: 'Plugin Debug Successful',

  // String error codes - Add Plugin
  [CoreErrorCodes.NO_MANIFEST]: 'Manifest File not found.',
  [CoreErrorCodes.ALREADY_ADDED]: 'Plugin with same id already exists in workspace',
  [CoreErrorCodes.INVALID_MANIFEST]: 'Invalid Manifest File.',
  [CoreErrorCodes.INVALID_PARAM]: 'Invalid plugin params.',
  [CoreErrorCodes.GENERIC_ADDFAIL]: 'Add Plugin Failed.',
  [CoreErrorCodes.DIALOG_CANCELLED]: 'Dialog Cancelled.',
  [CoreErrorCodes.ENABLE_DEVTOOLS_FAIL]: 'Failed to Enable Developer Mode.',

  // Create Plugin
  [CoreErrorCodes.INVALID_PERMISSIONS]: 'Invalid Directory Permissions.',
  [CoreErrorCodes.NONEMPTY_DIRECTORY]: 'Directory Contains Conflicting Files.',
  [CoreErrorCodes.GENERIC_CREATE_FAIL]: 'Create Plugin Failed',

  // Debug Plugin
  [CoreErrorCodes.GENERIC_DEBUG_FAIL]: 'Debug Command Failed',
  [CoreErrorCodes.INVALID_DEBUG_SESSION]: 'Debug session does not exist for the plugin. Try relaunching the host application for plugin.',

  // Load Plugin
  [CoreErrorCodes.GENERIC_LOADFAIL]: 'Plugin Load Failed.',

  // Unload Plugin
  [CoreErrorCodes.GENERIC_UNLOADFAIL]: 'Failed to unload plugin.',

  // Reload Plugin
  [CoreErrorCodes.GENERIC_RELOADFAIL]: 'Plugin Reload Failed.',

  // Package Plugin
  [CoreErrorCodes.GENERIC_PACKAGEFAIL]: 'Failed to package plugin.',
};

// Internal Log Messages

class CoreLogMessage {
  static SENDING_COMMAND_TO_APP = 'Sending command to host application ... ';
  static COMMAND_FAILED_ON_APP = '%s command failed in App with ID %s and Version %s';
  static COMMAND_SUCCESSFUL_ON_APP = '%s command successfull in App with ID %s and Version %s';
}

function getUserFriendlyMessageFromCode(errorCode: ErrorCode): string | null {
  const msg = CoreErrorUserMessage[errorCode];
  if (msg) {
    return msg;
  }
  return null;
}

export {
  CoreErrorCodes,
  CoreErrorUserMessage,
  CoreLogMessage,
  EC,
  getUserFriendlyMessageFromCode,
};

export type { ErrorCode };
