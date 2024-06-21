/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';

export default class ClusterStatus extends React.Component {
  constructor() {
    super();
    this.state = {
        clusterStatus: "",
        clusterLogs: "",
    };

    cockpit.spawn(["crm", "status", "--simple-status"], {superuser: "try"})
        .then(output => {
            const clusterStatus = statusRegex(output);
            this.setState({ clusterStatus });
            const clusterLogs = logRegex(output);
            this.setState({ clusterLogs });
    });
  }

    render() {
        return (
            <div>
            <p id="cluster-status" className="text">{`Status: ${this.state.clusterStatus}`}</p>
            <p id="cluster-logs" className="text">{`logs: ${this.state.clusterLogs}`}</p>
            </div>
        );
    }
}

const statusRegex = (output) => {
    const regex = /(CLUSTER.*?)\s*(?=:)/;
    const regexMatch = regex.exec(output);
    return regexMatch[0];
};

const logRegex = (output) => {
    const regex = /CLUSTER WARN:(.*)/;
    const regexMatch = regex.exec(output);
    const logs = regexMatch && regexMatch[1] ? regexMatch[1] : "";
    return logs;
};
