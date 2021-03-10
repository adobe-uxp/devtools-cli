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

const { getUserFriendlyMessageFromCode, CoreErrorCodes } = require("./ErrorCodes");

function DevToolsError(errorCode, details, message) {
    this._message = message;
    this._code = errorCode;
    this._details = details;
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DevToolsError);
    }
    else {
        try {
            throw new Error();
        }
        catch (e) {
            this._stack = e.stack;
        }
    }
}

DevToolsError.prototype = Object.create(Error.prototype);

Object.defineProperties(DevToolsError.prototype, {
    message: {
        get() {
            const msg = this._message;
            if (msg) {
                return msg;
            }
            const preMsg = getUserFriendlyMessageFromCode(this.code);
            return preMsg || "";
        }
    },
    name: {
        get() {
            return "DevToolsError";
        }
    },
    code: {
        get() {
            return this._code;
        }
    },
    stack: {
        get() {
            return this._stack;
        }
    },
    details: {
        get() {
            return this._details;
        }
    },
    hasDetails: {
        get() {
            return !!this._details;
        }
    }
});

DevToolsError.ErrorCodes = CoreErrorCodes;
DevToolsError.getUserFriendlyMessageFromCode = getUserFriendlyMessageFromCode;

module.exports = DevToolsError;
