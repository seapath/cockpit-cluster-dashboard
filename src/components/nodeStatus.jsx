/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';

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

const extractNodesStatus = (output, status) => {
    // Get the list of nodes for a given status
    // Ex with status = "Online":
    // Online: [ adv-1 nuc1 observer ] -> adv-1 nuc1 observer
    const statusNodesRegex = new RegExp(`${status}:\\s+\\[\\s*([^\\]]+)\\s*\\]`);
    const nodesMatch = statusNodesRegex.exec(output);
    // If there is a match with the regex and the online node list is not empty, we collect them in an array
    const nodeList = nodesMatch && nodesMatch[1] ? nodesMatch[1].split(' ') : [];

    return nodeList;
};

// The nodes can also be in maintenance or standby mode
const extractOtherStatus = (output) => {
    const regex = /^\s*\* Node.*$/gm;

    const matchArray = [];
    let match;

    while ((match = regex.exec(output)) !== null) {
        matchArray.push(match[0]);
    }

    return matchArray;
};
