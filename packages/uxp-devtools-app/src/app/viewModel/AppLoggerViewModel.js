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

import { observable, action, computed } from "mobx";

class AppBatchLog {
    @observable logs = [];

    constructor(details) {
        this._details = details;
    }

    @action
    appendLog(type, data) {
        this.logs.push({
            type,
            message: data.message
        });
    }

    get details() {
        return this._details;
    }
}

const kLogTypeMap = {
    log: "info",
    error: "negative",
    warn: "notice"
};

export default class AppLoggerViewModel {
    // we will keep this as number which keeps incrementing when ever we get new logs.
    @observable _logs = [];
    @observable _allLogBatches = [];

    constructor(appLogger) {
        const logTypes = [ "log", "error", "warn" ];
        for (let type of logTypes) {
            appLogger.on(type, (data) => {
                this.handleNewLog(type, data);
            });
        }

        this._currentBatch = null;
    }

    @action
    handleNewLog(type, data) {
        const autoCreateBatch = !this._currentBatch;

        if (autoCreateBatch) {
            this.beginBatch(null, null);
        }

        try {
            const logType = kLogTypeMap[type] || "neutral";
            this._currentBatch.appendLog(logType, data);
        }
        catch (err) {
            console.error("Error Logging the details");
        }

        if (autoCreateBatch) {
            this.endBatch();
        }
    }

    @action
    clearLogs() {
        this._allLogBatches = [];
    }

    @computed
    get logs() {
        return this._allLogBatches;
    }

    // details are similar to that of the dialog component here-
    // https://react-spectrum.adobe.com/react-spectrum/Dialog.html
    // where we will have - title, header-content, footer etc

    beginBatch(details) {
        if (this._currentBatch) {
            this.endBatch();
        }
        this._currentBatch = new AppBatchLog(details);
        this._allLogBatches.unshift(this._currentBatch);
    }

    endBatch() {
        this._currentBatch = null;
    }
}
