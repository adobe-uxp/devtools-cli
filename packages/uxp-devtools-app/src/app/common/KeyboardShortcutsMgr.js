/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

let sInstance = null;

class KeyboardShortcutsMgr {
    static instance() {
        if (!sInstance) {
            sInstance = new KeyboardShortcutsMgr();
        }
        return sInstance;
    }

    constructor() {
        // this._mousetrap = new Mousetrap();
        this._initialiseContext();
        this.enabled = true;
    }

    _initialiseContext() {
        this._contextStack = [];
        this.pushBindings(new Map());
    }

    reset() {
        this._initialiseContext();
    }

    _handlerWrapper(e, keys) {
        if(!this.enabled) {
            return;
        }
        const handler = this.currentContext.get(keys);
        if (handler) {
            handler(e, keys);
        }
    }

    triggerHandle(key) {
        if(!key) {
            return;
        }
        this._handlerWrapper(null, key);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    /*
		bindingsMap is Map() of key: shortcut, value: handler
        options -
            replace:  should replace or else push bindingsMap to contextStack
            bind: true | false, if bindings should be bound to mousetrap instance
	*/
    pushBindings(bindingsMap, { replace = false , bind = false } = {}) {
        if (replace) {
            for (const [ k, v ] of bindingsMap) {
                this.currentContext.set(k, v);
            }
        }
        else {
            this._contextStack.push(bindingsMap);
        }
        if(!bind) {
            return;
        }
        for (const [ k ] of bindingsMap) {
            this._mousetrap.bind(k, this._handlerWrapper.bind(this));
        }
    }

    pop() {
        this._contextStack.pop();
    }

    get currentContext() {
        const count = this._contextStack.length;
        if (count === 0) {
            throw Error("No context for keyboard shortcuts");
        }
        else {
            return this._contextStack[count - 1];
        }
    }
}

export default KeyboardShortcutsMgr;
