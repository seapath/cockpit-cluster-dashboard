/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';

export default class CephMgrStatus extends React.Component {
    constructor() {
        super();
        this.state = {
            available: "",
            activeName: "",
        };

        cockpit.spawn(["ceph", "mgr", "stat", "-f", "json"], {superuser: "try"})
            .then(output => {
                const outputJSON = JSON.parse(output);

                this.setState({ available: outputJSON.available.toString() });
                this.setState({ activeName: outputJSON.active_name });
            });
    }

    render() {
        return (
            <div>
                <p>
                    {"MGR available: "}
                    { this.state.available }
                </p>
                <p>
                    {"MGR: "}
                    { this.state.activeName }
                </p>
            </div>
        );
    }
}
