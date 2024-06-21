/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';

export default class NodeStatus extends React.Component {
    constructor() {
        super();
        this.state = {
            onlineNodes: [],
            offlineNodes: [],
            otherStatusNodes: [],
        };

        cockpit.spawn(["crm", "status", "--exclude=all", "--include=nodes"], {superuser: "try"})
            .then(output => {
                const onlineNodes = extractOnlineNodes(output);
                const offlineNodes = extractOfflineNodes(output);
                const otherStatusNodes = extractOtherStatus(output);

                this.setState({ onlineNodes, offlineNodes, otherStatusNodes });
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
                <p id="other-node-status" className="text">
                    {this.state.otherStatusNodes.map((node, index) => (
                        <span key={index}>{node}<br/></span>
                    ))}
                </p>
            </div>

        );
    }
}

const extractOnlineNodes = (output) => {
    // Catch the list of online nodes inside "Online: [<nodes>]"
    const onlineNodesRegex = /\* Online: \[\s*([\w\s]+?)\s*\]/;
    const onlineMatch = onlineNodesRegex.exec(output);
    // If there is a match with the regex and the online node list is not empty, we collect them in an array
    const onlineNodes = onlineMatch && onlineMatch[1] ? onlineMatch[1].split(' ') : [];

    return onlineNodes;
};

const extractOfflineNodes = (output) => {
    const offlineNodesRegex = /\* OFFLINE: \[\s*([\w\s]+?)\s*\]/;
    const offlineMatch = offlineNodesRegex.exec(output);
    const offlineNodes = offlineMatch && offlineMatch[1] ? offlineMatch[1].split(' ') : [];

    return offlineNodes;
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