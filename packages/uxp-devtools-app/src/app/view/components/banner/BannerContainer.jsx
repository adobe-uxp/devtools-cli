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

import classNames from "classnames";
import CSSTransition from "react-transition-group/CSSTransition";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import TransitionGroup from "react-transition-group/TransitionGroup";

import "./style.css";

/* eslint react/jsx-no-undef: 0 */  // --> OFF

const TOAST_TIMEOUT = 5000;
const TOAST_ANIMATION_TIME = 300;

const TOAST_DATA = new Map;
export const TOAST_CONTAINERS = new Map;
export let TOAST_PLACEMENT = "top center";

export function setToastPlacement(placement) {
    TOAST_PLACEMENT = placement;

    for (let container of TOAST_CONTAINERS.values()) {
        container.setState({ placement });
    }
}

const PREFIX = "react-spectrum-";
let incrementor = 0;
const createId = () => PREFIX + ++incrementor;


class Timer {
    constructor(callback, delay) {
        this.callback = callback;
        this.remaining = delay;
        this.resume();
    }

    pause() {
        window.clearTimeout(this.timerId);
        this.remaining -= new Date() - this.start;
    }

    resume() {
        this.start = new Date();
        if (this.timerId) {
            window.clearTimeout(this.timerId);
        }
        this.timerId = window.setTimeout(this.callback, this.remaining);
    }
}


export default class BannerContainer extends Component {

    state = {
        placement: TOAST_PLACEMENT,
        toasts: []
    };

    timerAction(toast, action) {
        if (TOAST_DATA.has(toast)) {
            let timer = TOAST_DATA.get(toast).timer;
            if (timer) {
                timer[action]();
            }
        }
    }

    add(toast, timeout = TOAST_TIMEOUT) {
        if (timeout < 0) {
            timeout = TOAST_TIMEOUT;
        }
        TOAST_DATA.set(toast, {
            timer: timeout === 0 ? null : new Timer(this.remove.bind(this, toast), timeout),
            id: createId()
        });

        this.setState({
            toasts: [ ...this.state.toasts, toast ]
        });
    }

    remove(toast, e) {
        const { toasts: currentToasts } = this.state;
        const toasts = currentToasts.filter(t => t !== toast);

        if (toasts.length !== currentToasts.length && toast.props.onClose) {
            toast.props.onClose(e);
        }

        this.setState({ toasts });

        this.timerAction(toast, "pause");
        TOAST_DATA.delete(toast);
    }

    onFocus(toast) {
        this.timerAction(toast, "pause");
        if (toast.props.onFocus) {
            toast.props.onFocus();
        }
    }

    onBlur(toast) {
        this.timerAction(toast, "resume");
        if (toast.props.onBlur) {
            toast.props.onBlur();
        }
    }

    render() {
        let position = "bottom";
        let containerPlacement = "center";
        let className = classNames(
            "react-spectrum-ToastContainer",
            `react-spectrum-ToastContainer--${position}`,
            containerPlacement && `react-spectrum-ToastContainer--${containerPlacement}`,
        );

        return (
            <TransitionGroup className={className}>
                {this.state.toasts.map((toast) =>
                    (<CSSTransition key={TOAST_DATA.get(toast).id} classNames={`react-spectrum-Toast-slide-${position}`} timeout={TOAST_ANIMATION_TIME}>
                        {React.cloneElement(toast, {
                            onClose: this.remove.bind(this, toast),
                        })}
                    </CSSTransition>)
                )}
            </TransitionGroup>
        );
    }
}

function createToastNode(container) {
    let parent = container || document.getElementById("uxpDevtoolsMainContainerId");
    let node = document.createElement("div");
    parent.appendChild(node);
    return node;
}

function ensureToastContainer(container, callback) {
    let toastContainer = TOAST_CONTAINERS.get(container);

    /* eslint react/no-find-dom-node: 0 */  // --> OFF
    // Make sure that toastContainer is a real DOM node, not only a memory footprint of previously cached node.
    if (toastContainer && document.body.contains(ReactDOM.findDOMNode(toastContainer))) {
        callback(toastContainer);
    }
    else {
        let toastContainerRef;
        ReactDOM.render(<BannerContainer ref={ref => toastContainerRef = ref} />, createToastNode(container), () => {
            TOAST_CONTAINERS.set(container, toastContainerRef);
            callback(toastContainerRef);
        });
    }
}


export function addToast(toast, timeout, container) {
    ensureToastContainer(container, toastContainer => toastContainer.add(toast, timeout));
}

export function removeToast(toast, container) {
    ensureToastContainer(container, toastContainer => toastContainer.remove(toast));
}

export function positive(message, options = {}) {
    addToast(<Toast variant="positive" {...options}>{message}</Toast>, options.timeout, options.container);
}

export function negative(message, options = {}) {
    addToast(<Toast variant="negative" {...options}>{message}</Toast>, options.timeout, options.container);
}

export function info(message, options = {}) {
    addToast(<Toast variant="info" {...options}>{message}</Toast>, options.timeout, options.container);
}
