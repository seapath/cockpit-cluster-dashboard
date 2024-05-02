/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';

export default class ResourcesStatus extends React.Component {
    constructor() {
        super();
        this.state = {
            resources: [],
            logs: ""
    };

    cockpit.spawn(["crm", "status"], {superuser: "try"})
        .stream(output => {
            const resources = this.getResourcesInfos(output);
            const resourcesInfo = this.getResourcesIssues(output);
            this.setState({ resources });
            this.setState({ logs: resourcesInfo });
        });
  }

  getResourcesInfos(output) {
    const resources = [];
    // 4 capturing groups: name, type, state and host (optionnal).
    // Input exemple:
    //   * guest3	(ocf:seapath:VirtualDomain):	 Started nuc3
    const regexResource = /^\s*\*\s*(\S+)\s*\((\S+)\):\s*(\S+)(?:\s(\S+))?/gm;
    // Input exemple:
    // * Clone Set: cl_ntpstatus_test [ntpstatus_test]:
    //   * Started: [ nuc1 nuc3 ]
    //   * Stopped: [ nuc2 ]
    const regexCloneSet = /Clone Set:\s(\S+)\s\[(\S+)\]:\s*\* Started: \[\s*([\w\s]+?)\s*\](?:\s*\* Stopped: \[\s*([\w\s]+?)\s*\])?/g;
    let match;

    // Match regular resources
    while ((match = regexResource.exec(output)) !== null) {
        const name = match[1];
        const type = match[2];
        const state = match[3];
        const host = match[4] || null;
        resources.push({ name, type, state, host });
    }

    // Match clone sets
    while ((match = regexCloneSet.exec(output)) !== null) {
        const cloneSetName = match[1];
        const type = match[2];

        const startedHosts = match[3] ? match[3].split(/\s+/) : [];
        const stoppedHosts = match[4] ? match[4].split(/\s+/) : [];

        startedHosts.forEach(host => {
            resources.push({ name: cloneSetName, type, state: "Started", host });
        });

        stoppedHosts.forEach(host => {
            resources.push({ name: cloneSetName, type, state: "Stopped", host });
        });
    }
    return resources;
}

    getResourcesIssues = (output) => {
        const regex = /Failed Resource Actions:(.*)/s;
        const match = regex.exec(output);
        const failedActions = match ? match[1].trim() : "";

        return failedActions;
    }

    render() {
        const logsWithJumpLines = this.state.logs.split('\n');
        return (
        <div>
            <h3 className="title3">Resources on the cluster</h3>
            <table>
            <thead>
                <tr>
                <th>Name</th>
                <th>State</th>
                <th>Type</th>
                <th>Host</th>
                </tr>
            </thead>
            <tbody>
                {this.state.resources.map((resource, index) => (
                <tr key={index}>
                    <td>{resource.name}</td>
                    <td>{resource.state}</td>
                    <td>{resource.type}</td>
                    <td>{resource.host}</td>
                </tr>
                ))}
            </tbody>
            </table>
            <br/>
            <div className="text">
            <p className="text">Resources failed actions : </p>
            {logsWithJumpLines.map((line, index) => (
                <p key={index}>{line}</p>
            ))}
            </div>
        </div>
        );
    }
}
