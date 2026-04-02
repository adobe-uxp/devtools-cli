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

import type { ErrorCode } from './ErrorCodes.js';
import { CoreErrorCodes, getUserFriendlyMessageFromCode } from './ErrorCodes.js';

interface DevToolsErrorInterface extends Error {
  code: ErrorCode;
  details: unknown;
  hasDetails: boolean;
}

class DevToolsError extends Error implements DevToolsErrorInterface {
  private _code: ErrorCode;
  private _details: unknown;
  private _message: string | undefined;
  private _stack: string | undefined;

  constructor(errorCode: ErrorCode, details?: unknown, message?: string) {
    super(message);
    this._message = message;
    this._code = errorCode;
    this._details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DevToolsError);
    }
    else {
      try {
        throw new Error('Stack trace');
      }
      catch (e) {
        this._stack = (e as Error).stack;
      }
    }

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, DevToolsError.prototype);
  }

  override get message(): string {
    const msg = this._message;
    if (msg) {
      return msg;
    }
    const preMsg = getUserFriendlyMessageFromCode(this.code);
    return preMsg || '';
  }

  override get name(): string {
    return 'DevToolsError';
  }

  get code(): ErrorCode {
    return this._code;
  }

  override get stack(): string | undefined {
    return this._stack;
  }

  get details(): unknown {
    return this._details;
  }

  get hasDetails(): boolean {
    return !!this._details;
  }

  static ErrorCodes = CoreErrorCodes;
  static getUserFriendlyMessageFromCode = getUserFriendlyMessageFromCode;
}

export default DevToolsError;
