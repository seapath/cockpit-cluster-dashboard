/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';

import {Table, Thead, Tr, Th, Tbody, Td} from '@patternfly/react-table';

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
                <label className='title3'>Pool RBD</label>
                <Table variant='compact'>
                    <Thead>
                        <Tr>
                            <Th>Data stored</Th>
                            <Th>Space used</Th>
                            <Th>Space available</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        <Tr>
                            <Td>{ cockpit.format_bytes(this.state.stored) }</Td>
                            <Td>{ cockpit.format_bytes(this.state.used) }</Td>
                            <Td>{ cockpit.format_bytes(this.state.available) }</Td>
                        </Tr>
                    </Tbody>
                </Table>
            </div>
        );
    }
}
