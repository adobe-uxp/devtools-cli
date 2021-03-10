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

const chokidar = require("chokidar");
const _ = require("lodash");
const { createDeferredPromise } = require("../helpers/CommonUtils");

class Watcher {
    constructor(dirToWatch, changeCallback) {
        this._watchPath = dirToWatch;
        this._changeCallback = changeCallback;
    }

    start() {
        const prom = createDeferredPromise();
        const filesExtsToWatch = [ "js", "jsx", "ts", "tsx", "html", "css", "scss" ];
        const paths = filesExtsToWatch.map(ext => {
            const watchPath = this._watchPath + "/**/*." +  ext;
            return watchPath;
        });
        // Ignoring node_modules to improve watch performance.
        const ignorePaths = [ "**/node_modules/**" ];

        const watcherObj = chokidar.watch(paths, {
            usePolling: false,
            useFsEvents: false,
            ignored : ignorePaths
        });
        this._watcherObj = watcherObj;

        watcherObj
            .on("change", () => {
                this._changeCallback();
            })
            .on("error", error => {
                this.stopWatch();
                UxpLogger.error(`${error}`);
                prom.reject("Failed to watch directory " + this._watchPath);
            })
            .on("ready", () => {
                UxpLogger.log(`Started watching ${this._watchPath} directory for changes...`);
                prom.resolve(true);
            });
        return prom.promise;
    }

    stopWatch() {
        return this._watcherObj.close().then(() => {
            UxpLogger.log("\nStop watching directory " + this._watchPath);
            return true;
        });
    }
}

class PathCaretaker {
    static create(pluginPath, pluginId, pluginCallback) {
        const caretaker = new PathCaretaker();
        const observer = { pluginId, pluginCallback };
        caretaker.observersList.push(observer);

        const watchCallback = caretaker.handleWatchCallback.bind(caretaker);
        /* if series of events with in-between (using 'wait'=200ms)
            - time interval > 'wait', it acts as normal throttle of 'wait'
            - time interval < 'wait', squash them into one event(begining)
                with max series time-length of 'maxWait'=1500ms
        */
        const debouncedCallback = _.debounce(watchCallback, 200, {
            "leading": true,
            "trailing": false,
            "maxWait": 1500
        });
        const watcher = new Watcher(pluginPath, debouncedCallback);
        caretaker.watcher = watcher;

        return caretaker;
    }

    constructor() {
        this.watcher = null;
        this.observersList = [];
    }

    handleWatchCallback() {
        for (const { pluginCallback } of this.observersList) {
            pluginCallback();
        }
    }

    addObserver(pluginId, pluginCallback) {
        const index = this.observersList.findIndex(observer => observer.pluginId === pluginId);
        if (index < 0) {
            const observer = { pluginId, pluginCallback };
            this.observersList.push(observer);
        }
    }

    removeObserver(pluginId) {
        const index = this.observersList.findIndex(observer => observer.pluginId === pluginId);
        if (index > -1) {
            this.observersList.splice(index, 1);
        }
    }
}

let sInstance = null;

class WatchServiceMgr {
    static instance() {
        if (!sInstance) {
            sInstance = new WatchServiceMgr();
        }
        return sInstance;
    }

    constructor() {
        this._watchDetails = new Map();
    }

    watchPlugin(pluginPath, pluginCallback, pluginId = "_dummyId") {
        let caretaker = this._watchDetails.get(pluginPath);
        if (caretaker) {
            caretaker.addObserver(pluginId, pluginCallback);
            return Promise.resolve(true);
        }
        else {
            caretaker = PathCaretaker.create(pluginPath, pluginId, pluginCallback);
            this._watchDetails.set(pluginPath, caretaker);
            return caretaker.watcher.start();
        }
    }

    stopPluginWatch(pluginPath, pluginId = "_dummyId") {
        const caretaker = this._watchDetails.get(pluginPath);
        if (caretaker) {
            caretaker.removeObserver(pluginId);
            if (caretaker.observersList.length === 0) {
                this._watchDetails.delete(pluginPath);
                return caretaker.watcher.stopWatch();
            }
        }
        return Promise.resolve(true);
    }
}

module.exports = WatchServiceMgr;
