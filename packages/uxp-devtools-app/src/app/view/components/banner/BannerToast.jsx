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

import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { Button, ClearButton } from "@react-spectrum/button";

import AlertMedium from "@spectrum-icons/ui/AlertMedium";
import CrossMedium from "@spectrum-icons/ui/CrossMedium";
import SuccessMedium from "@spectrum-icons/ui/SuccessMedium";
import InfoMedium from "@spectrum-icons/ui/InfoMedium";

import "./banner.scss";

/**
 * Most common toast type -- just displays a simple message (which should already be translated).
 */

export const ICONS = {
    info: InfoMedium,
    negative: AlertMedium,
    positive: SuccessMedium
};


@observer
export default class BannerToast extends React.Component {

    static propTypes = {
        message: PropTypes.string.isRequired, // a translated string,
        variant: PropTypes.oneOf([ "negative", "warning", "positive", "info" ]) // This isn't used currently, but we need to standardize this API for external cases
    };

    // We add this property because the actual class name can change when minified, but strings wont.
    static toastName = "message";

    static getMessage(props) {
        return props.message;
    }

    render() {
        let { variant, message, actionLabel } = this.props;
        let Icon = ICONS[variant];
        return  (

            <div className={classNames(
                "spectrum-Toast",
                { ["spectrum-Toast--" + variant]: variant })}>
                <Icon UNSAFE_className={classNames("spectrum-Toast-typeIcon")}/>
                <div className={classNames("spectrum-Toast-body")}>
                    <div className={classNames("spectrum-Toast-content")}>{message}</div>
                    {actionLabel
                            && <Button isQuiet="true" UNSAFE_className={classNames("spectrum-Toast-More-Button")}
                                variant="overBackground" onPress={this.props.OnAction} >{actionLabel}</Button>
                    }
                </div>
                <div className={classNames("spectrum-Toast-buttons")}>
                    <ClearButton variant="overBackground" onPress={this.props.onClose}>
                        <CrossMedium />
                    </ClearButton>
                </div>
            </div>
        );
    }
}
