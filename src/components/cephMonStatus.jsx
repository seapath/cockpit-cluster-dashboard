/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';
import PropTypes from 'prop-types';

export default class CephMonStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mons: [],
            quorumNames: [],
        };
    }

    componentDidMount() {
        this.fetchMonStatus();
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastUpdate !== prevProps.lastUpdate) {
            this.fetchMonStatus();
        }
    }

    fetchMonStatus(){
        cockpit.spawn(["ceph", "quorum_status"], {superuser: "try"})
            .then(output => {
                const outputJSON = JSON.parse(output);

                const mons = outputJSON.monmap.mons.map(mons => ({
                    name: mons.name,
                    ip: mons.addr.split(':')[0]
                }));

                const quorumNames = outputJSON.quorum_names.map(quorumNames => quorumNames );

                this.setState({ mons, quorumNames })
            });
    }

    isMonInQuorum(name) {
        return this.state.quorumNames.includes(name);
    }


    render() {
        return (
            <div>
            <h4 className="text">MON list: </h4>
            <table>
            <thead>
                <tr>
                <th>Name</th>
                <th>IP</th>
                </tr>
            </thead>
            <tbody id="mon-table">
                {this.state.mons.map((mon, index) => (
                <tr id={`mon-${mon.name}`} key={index} style={{ backgroundColor: this.isMonInQuorum(mon.name) ? '#77DD76' : '#FF6962' }}>
                    <td>{mon.name}</td>
                    <td>{mon.ip}</td>
                </tr>
                ))}
            </tbody>
            </table>
            </div>
        );
    }
}

CephMonStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
