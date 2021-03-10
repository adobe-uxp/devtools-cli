/** ***********************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2018 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

import React from "react";
import { action, observable } from "mobx";
// Toasts to register:
import BannerToast from "./BannerToast";
import { addToast, removeToast } from "./BannerContainer";

/**
 * Manager for toasts in the panel. Creates an easy interface for opening toasts and ensures that only one toast is ever shown.
 * If you want to show a toast, just call `toastManager.openToast(name, message)`. Message should be an already localized string.
 * A toast component will appear at the top of the panel.
 * Clicking anywhere else in the panel will dismiss it. Otherwise it will time out and fade.
 *
 * Note: Since clicking anywhere else in the panel will dismiss the toast, and the only toasts currently are a result of user action
 * in the panel, it's not possible to have more than one toast. Will need to refactor if need to support multiple toasts or toasts as push notifications.
 */
class BannerManager {
    // Keyed by toastName
    _toasts = {};

    @observable.ref _openToast; // {name, data}

    constructor() {
        this.register(BannerToast);
        // New toasts only need to be added if they will be structurally different.
    }

    register(toastClass) {
        this._toasts[toastClass.toastName] = toastClass;
    }

    /**
     * Open a toast by name, with optional data. e.g. `openToast('undoDelete')` or the basic case: `openToast('message', { message })`
     * @param {string} name - toastName property of the toast class
     * @param {Object} [data] - Optional object with props expected by the toast. e.g. `message` for the MessageToast, which should be a translated string.
     */
    @action
    openToast(name, data) {
        const ToastClass = this._toasts[name];
        if (!ToastClass) {
            throw new Error(`Open Toast: Toast of type ${name} does not exist.`);
        }

        const openToast = { name, data };
        const BannerToastCls = this._toasts[openToast.name];
        if (!BannerToastCls) {
            return;
        }
        // return <Toast { ...openToast.data } close={ this.closeToast } />;
        const bannerToast = <BannerToastCls {...openToast.data } />;
        this._bannerToast = bannerToast;
        addToast(bannerToast);
    }

    @action
    closeToast = () => {
        this._openToast = undefined;
        if (this._bannerToast) {
            removeToast(this._bannerToast);
            this._bannerToast = null;
        }
    }
}

export default new BannerManager();
