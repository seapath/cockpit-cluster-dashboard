/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';
import PropTypes from 'prop-types';

export default class CephMgrStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            available: "",
            activeName: "",
        };
    }

    componentDidMount() {
        this.fetchMgrStatus();
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastUpdate !== prevProps.lastUpdate) {
            this.fetchMgrStatus();
        }
    }

    fetchMgrStatus(){
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

CephMgrStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
