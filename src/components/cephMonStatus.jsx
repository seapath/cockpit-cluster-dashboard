/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';
import PropTypes from 'prop-types';

import {Table, Thead, Tr, Th, Tbody, Td} from '@patternfly/react-table';

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
                <label className='title3'>Ceph monitor daemons</label>
                <Table variant='compact'>
                    <Thead>
                    <Tr>
                        <Th textCenter>Name</Th>
                        <Th textCenter>IP</Th>
                    </Tr>
                    </Thead>
                    <Tbody id="mon-table">
                        {this.state.mons.map((mon, index) => (
                        <Tr
                            id={`mon-${mon.name}`}
                            key={index}
                            style={{
                                backgroundColor: this.isMonInQuorum(mon.name) ? '#4ed86033' : '#d83d3d33',
                            }}
                        >
                            <Td textCenter>{mon.name}</Td>
                            <Td textCenter>{mon.ip}</Td>
                        </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>
        );
    }
}

CephMonStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
