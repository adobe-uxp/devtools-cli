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

class HostAppClient {
    constructor(data) {
        this.id = data.id;
        if (!data.app || !data.app.appId || !data.app.appVersion || !data.app.uxpVersion) {
            UxpLogger.verbose("HostAppClient: data doesn't contain the required app details in it");
        }
        this.appEndPoint = {
            id: data.app.appId,
            version: data.app.appVersion,
            name: data.app.appName,
            uxpVersion: data.app.uxpVersion
        };
    }

    sendMessageWithReply(connection, message) {
        return connection.sendClientMessageWithReply(this, message);
    }
}

module.exports = HostAppClient;
