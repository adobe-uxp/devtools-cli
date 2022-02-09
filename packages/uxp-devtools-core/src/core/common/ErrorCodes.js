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

class CoreErrorCodes {
}

CoreErrorCodes.PORT_IN_USE = 1;
CoreErrorCodes.INVALID_COMMAND_NAME = 2;
CoreErrorCodes.NO_PLUGIN_SESSION = 3;
CoreErrorCodes.PLUGIN_NO_CONNECTED_APPS = 4;
CoreErrorCodes.PLUIGN_LOAD_FAILED = 5;
CoreErrorCodes.PLUIGN_RELOAD_FAILED = 6;
CoreErrorCodes.PLUIGN_DEBUG_FAILED = 7;
CoreErrorCodes.COMMAND_FAILED_ON_APP = 8;
CoreErrorCodes.SERVICE_FAILED_PORT_INUSE = 10;
CoreErrorCodes.PLUGIN_CMD_PARAM_MANIFEST_PATH = 11;
CoreErrorCodes.COMMAND_FAILED_IN_APP_MULTIPLE = 12;
CoreErrorCodes.COMMAND_FAILED_ON_ALL_APPS = 13;
CoreErrorCodes.PLUIGN_VALIDATE_FAILED = 7;
CoreErrorCodes.NO_APPS_CONNECTED_TO_SERVICE = 8;
CoreErrorCodes.PLUGIN_NO_APPLICABLE_APPS = 9;


// Add Plugin
CoreErrorCodes.NO_MANIFEST = "ERR2_NOMANIFEST";
CoreErrorCodes.ALREADY_ADDED = "ERR2_DUPLICATEPLUGIN";
CoreErrorCodes.INVALID_MANIFEST = "ERR2_INVALIDMANIFEST";
CoreErrorCodes.INVALID_PARAM = "ERR2_INVALIDPARAM";
CoreErrorCodes.GENERIC_ADDFAIL = "ERR2_ADDFAIL";
CoreErrorCodes.DIALOG_CANCELLED = "ERR2_DIALOGCANCELLED";

CoreErrorCodes.ENABLE_DEVTOOLS_FAIL = "ERR1_ENABLEDEVTOOLSFAIL";
// Create Plugin
CoreErrorCodes.INVALID_PERMISSIONS = "ERR4_DIRPERM";
CoreErrorCodes.NONEMPTY_DIRECTORY = "ERR4_NONEMPTY_DIRECTORY";
CoreErrorCodes.GENERIC_CREATE_FAIL = "ERR4_CREATEFAIL";

// Debug Plugin
CoreErrorCodes.GENERIC_DEBUG_FAIL = "ERR5_DEBUGFAIL";
// Load Plugin
CoreErrorCodes.GENERIC_LOADFAIL = "ERR3_LOADFAIL";

// Unload Plugin
CoreErrorCodes.GENERIC_UNLOADFAIL = "ERR6_UNLOADFAIL";

// Package Plugin
CoreErrorCodes.GENERIC_PACKAGEFAIL = "ERR7_PACKAGEFAIL";

// Reload Plugin
CoreErrorCodes.GENERIC_RELOADFAIL = "ERR8_RELOADFAIL";

// Success Messages
CoreErrorCodes.PLUGIN_LOAD_SUCCESS = 1000;

const EC = CoreErrorCodes;

class CoreErrorUserMessage {

}

// short name
const User = CoreErrorUserMessage;

User[EC.PORT_IN_USE] = "Port %d is already in use.";
User[EC.PORT_IN_USE_DETAILED] = "The port ${port} is already in use. Please try using another port from UXP Developer Tools preferences and relaunch the application.";
User[EC.INVALID_COMMAND_NAME] = "Invalid Command Name";
User[EC.NO_PLUGIN_SESSION] = "This plugin doesn't have valid develop session. Ensure that the plugin is first loaded in the host app ( via `uxp plugin load` command ) and try again.";
User[EC.PLUGIN_NO_CONNECTED_APPS] = "Host Application specified in the plugin manifest is not available. Make sure the host application is started.";
User[EC.PLUIGN_LOAD_FAILED] = "Plugin Load Failed";
User[EC.PLUIGN_RELOAD_FAILED] = "Plugin Reload Failed";
User[EC.PLUIGN_DEBUG_FAILED] = "Plugin Debug Failed";
User[EC.PLUIGN_VALIDATE_FAILED] = "Plugin Manifest Validation Failed";
User[EC.COMMAND_FAILED_IN_APP_MULTIPLE] = "Command execution failed in all connected applications.";
User[EC.COMMAND_FAILED_IN_APP] = "Command execution failed in the application.";
User[EC.SERVICE_FAILED_PORT_INUSE] = "Failed to Start Devtools Service. Port %d is already in use.";
User[EC.PLUGIN_CMD_PARAM_MANIFEST_PATH] = "Plugin manifest.json file path is not valid";
User[EC.NO_APPS_CONNECTED_TO_SERVICE] = "No applications are connected to the service. Make sure the target application is running and connected to the service.";
User[EC.PLUGIN_NO_APPLICABLE_APPS] = "Plugin doesn't have any of its applicable applications currently connected to service.";

// Success Messages

User[EC.PLUGIN_LOAD_SUCCESS] = "Plugin Load Successfull";
User[EC.PLUGIN_RELOAD_SUCCESS] = "Plugin Reload Successfull";
User[EC.PLUGIN_DEBUG_SUCCESS] = "Plugin Debug Successfull";

User[EC.INVALID_PERMISSIONS] = "User does not have valid permissions for the selected folder.";
User[EC.NONEMPTY_DIRECTORY] = "The selected directory is non-empty.";



// Add Plugin Fail messages

User[EC.NO_MANIFEST ] = "Manifest File not found.";
User[EC.ALREADY_ADDED ] = "Plugin with same id already exists in workspace";
User[EC.INVALID_MANIFEST ] = "Invalid Manifest File.";
User[EC.INVALID_PARAM ] = "Invalid plugin params.";
User[EC.GENERIC_ADDFAIL ] = "Add Plugin Failed.";
User[EC.DIALOG_CANCELLED ] = "Dialog Cancelled.";
User[EC.ENABLE_DEVTOOLS_FAIL ] = "Failed to Enable Developer Mode.";


// Create Plugin Fail messages

User[EC.INVALID_PERMISSIONS ] = "Invalid Directory Permissions.";
User[EC.NONEMPTY_DIRECTORY ] = "Directory Contains Conflicting Files.";
User[EC.GENERIC_CREATE_FAIL ] = "Create Plugin Failed";

// Debug Plugin
User[EC.GENERIC_DEBUG_FAIL ] = "Debug Command Failed";
User[EC.INVALID_DEBUG_SESSION ] = "Debug session does not exist for the plugin.Try relaunching the host application for plugin.";
User[EC.GENERIC_LOADFAIL ] = "Plugin Load Failed.";
User[EC.GENERIC_UNLOADFAIL ] = "Failed to unload plugin.";
User[EC.GENERIC_RELOADFAIL ] = "Plugin Reload Failed.";

// Package Plugin
User[EC.GENERIC_PACKAGEFAIL ] = "Failed to package plugin.";


// Internal Log Messages

class CoreLogMessage {

}

CoreLogMessage.SENDING_COMMAND_TO_APP = "Sending command to host application ... ";
CoreLogMessage.COMMAND_FAILED_ON_APP = "%s command failed in App with ID %s and Version %s";
CoreLogMessage.COMMAND_SUCCESSFUL_ON_APP = "%s command successfull in App with ID %s and Version %s";

function getUserFriendlyMessageFromCode(errorCode) {
    const msg = CoreErrorUserMessage[errorCode];
    if (msg) {
        return msg;
    }
    return null;
}

module.exports = {
    getUserFriendlyMessageFromCode,
    CoreErrorUserMessage,
    CoreErrorCodes,
    CoreLogMessage
};
