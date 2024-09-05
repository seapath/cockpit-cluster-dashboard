/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';
import PropTypes from 'prop-types';

export default class CephPoolStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stored:0,
            used:0,
            available:0,
        };
    }

    componentDidMount() {
        this.fetchPoolStatus();
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastUpdate !== prevProps.lastUpdate) {
            this.fetchPoolStatus();
        }
    }

    fetchPoolStatus(){
        cockpit.spawn(["ceph", "df", "-f", "json"], {superuser: "try"})
            .then(output => {
                const outputJSON = JSON.parse(output);
                const rbd = outputJSON.pools.find(n => n.name === "rbd");

                this.setState({
                    stored: rbd.stats.stored,
                    used: rbd.stats.kb_used*1024,
                    available: rbd.stats.max_avail,
                });
            });
    }

    render() {
        return (
            <div>
                <h4 className="text"> Pool RBD: </h4>
                <table>
                    <thead>
                        <tr>
                            <th>Data stored</th>
                            <th>Space used</th>
                            <th>Space available</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{ cockpit.format_bytes(this.state.stored) }</td>
                            <td>{ cockpit.format_bytes(this.state.used) }</td>
                            <td>{ cockpit.format_bytes(this.state.available) }</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

CephPoolStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
