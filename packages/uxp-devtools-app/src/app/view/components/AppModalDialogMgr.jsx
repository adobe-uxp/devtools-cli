/* eslint-disable class-methods-use-this */
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

import React from "react";
import { action, observable, computed } from "mobx";
import { View, DialogTrigger } from "@adobe/react-spectrum";
import { EventEmitter } from "events";

class AppModalDialogMgr extends EventEmitter {
    @observable _dialogCompCls;

    @action
    showModalDialog(dialogCompCls) {
        this._dialogCompCls = dialogCompCls;
    }

    dialogCloseCommon() {
        if(!!this._dialogCompCls) {
            this.emit("dialog-closed");
        }
        this._dialogCompCls = null;
    }

    handleDialogClose(close) {
        this._closedCalled = true;
        close();
        this.dialogCloseCommon();
    }

    handleOnOpenChange(open) {
        if (open || !this._dialogCompCls || this._closedCalled) {
            return;
        }
        this.dialogCloseCommon();
    }

    resetInternalState() {
        this._closedCalled = false;
    }

    @computed
    get dialog() {
        if (this._dialogCompCls) {
            this.resetInternalState();
            const ClientComp = this._dialogCompCls;
            this.emit("dialog-opened");
            return (<DialogTrigger defaultOpen={true} type="modal" onOpenChange={this.handleOnOpenChange.bind(this)}>
                <View></View>
                {
                    (close) => <ClientComp closeHandler={() => this.handleDialogClose(close)} />
                }
            </DialogTrigger>);
        }
        return null;
    }
}

export default new AppModalDialogMgr();
