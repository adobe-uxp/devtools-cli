/* eslint-disable class-methods-use-this */
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

class UxpDevtoolsInitializerParams {
    set servicePort(port) {
        this._servicePort = port;
    }

    get servicePort() {
        return this._servicePort;
    }

    set logger(logg) {
        this._logger = logg;
    }

    get logger() {
        return this._logger;
    }

    set hostDelegate(delegate) {
        this._hostDelegate = delegate;
    }

    get hostDelegate() {
        return this._hostDelegate;
    }
}

module.exports = UxpDevtoolsInitializerParams;
