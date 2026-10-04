/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';
import PropTypes from 'prop-types';
import { extractNodesStatus, extractOtherStatus } from '../lib/parsing';

export default class NodeStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            onlineNodes: [],
            offlineNodes: [],
            remoteOnlineNodes: [],
            remoteOfflineNodes: [],
            guestOnlineNodes: [],
            guestOfflineNodes: [],
            otherStatusNodes: [],
        };
    }

    componentDidMount() {
        this.fetchNodeStatus();
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastUpdate !== prevProps.lastUpdate) {
            this.fetchNodeStatus();
        }
    }

    fetchNodeStatus() {
        cockpit.spawn(["crm", "status", "--exclude=all", "--include=nodes"], {superuser: "try"})
            .then(output => {
                const onlineNodes = extractNodesStatus(output,"Online");
                const offlineNodes = extractNodesStatus(output, "OFFLINE");

                const remoteOnlineNodes = extractNodesStatus(output,"RemoteOnline");
                const remoteOfflineNodes = extractNodesStatus(output,"RemoteOFFLINE");


                const guestOnlineNodes = extractNodesStatus(output,"GuestOnline");
                const guestOfflineNodes = extractNodesStatus(output,"GuestOFFLINE");

                const otherStatusNodes = extractOtherStatus(output);

                this.setState({
                    onlineNodes,
                    offlineNodes,
                    otherStatusNodes,
                    remoteOnlineNodes,
                    remoteOfflineNodes,
                    guestOnlineNodes,
                    guestOfflineNodes
                 });
            });
    }

    render() {
        return (
            <div id="node-status-online-offline">
                <p id="node-status-online-nodes" className="text">
                    { cockpit.format(("online nodes : $0"), this.state.onlineNodes.join(' ')) }
                </p>
                <p id="node-status-offline-nodes" className="text">
                    { cockpit.format(("offline nodes : $0"), this.state.offlineNodes.join(' ')) }
                </p>

                {this.state.guestOnlineNodes.length > 0 && (
                    <p className="text">
                        {cockpit.format(("guest online nodes : $0"), this.state.guestOnlineNodes.join(' '))}
                    </p>
                )}
                {this.state.guestOfflineNodes.length > 0 && (
                    <p className="text">
                        {cockpit.format(("guest offline nodes : $0"), this.state.guestOfflineNodes.join(' '))}
                    </p>
                )}
                {this.state.remoteOnlineNodes.length > 0 && (
                    <p className="text">
                        {cockpit.format(("remote online nodes : $0"), this.state.remoteOnlineNodes.join(' '))}
                    </p>
                )}
                {this.state.remoteOfflineNodes.length > 0 && (
                    <p className="text">
                        {cockpit.format(("remote offline nodes : $0"), this.state.remoteOfflineNodes.join(' '))}
                    </p>
                )}

                <p id="other-node-status" className="text">
                    {this.state.otherStatusNodes.map((node, index) => (
                        <span key={index}>{node}<br/></span>
                    ))}
                </p>
            </div>

        );
    }
}

NodeStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
