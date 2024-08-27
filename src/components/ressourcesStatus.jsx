/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';

export default class ResourcesStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            resources: [],
            logs: ""
    };
  }

    componentDidMount(){
        this.fetchResources();
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastUpdate !== prevProps.lastUpdate) {
            this.fetchResources();
        }
    }

    // Force the two cockpit.spawn() calls to run one after the other.
    async fetchResources(){
        await cockpit.spawn(["crm", "status"], {superuser: "try"})
            .then(output => {
                const resources = this.getResourcesInfos(output);
                const resourcesInfo = this.getResourcesIssues(output);

                // prevent locationType and defaultHost from being reset to their initial state each time the component is updated.
                const prevResourcesFiltered = omitResourcesLocation(this.state.resources);
                const resourcesFiltered = omitResourcesLocation(resources);
                if(!areArraysEqual(resourcesFiltered, prevResourcesFiltered)){
                    this.setState({ resources });
                }
                this.setState({ logs: resourcesInfo });
            });

        await cockpit.spawn(["crm", "configure", "show"], {superuser: "try"}).then((output) => {
            const resources = this.getResourcesLocation(output);
            this.setState({ resources });
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
        resources.push({ name, type, state, host, locationType:"-", defaultHost:"-" });
    }

    // Match clone sets
    while ((match = regexCloneSet.exec(output)) !== null) {
        const cloneSetName = match[1];
        const type = match[2];

        const startedHosts = match[3] ? match[3].split(/\s+/) : [];
        const stoppedHosts = match[4] ? match[4].split(/\s+/) : [];

        startedHosts.forEach(host => {
            resources.push({ name: cloneSetName, type, state: "Started", host, locationType: "-", defaultHost: "-" });
        });

        stoppedHosts.forEach(host => {
            resources.push({ name: cloneSetName, type, state: "Stopped", host, locationType: "-", defaultHost: "-" });
        });
    }
    return resources;
}

    getResourcesLocation = (output) => {
        const regex = /(cli-prefer|pin)-(?:\S+)\s(\S+)\s(?:\S+)\sinf:\s(.+)/g;
        let match;
        const resources = [...this.state.resources];

        while ((match = regex.exec(output)) !== null) {
          const resourceName = match[2];
          const locationType = match[1];
          const node = match[3];
          const resourceIndex = resources.findIndex((resource) => resource.name === resourceName);
          if (resourceIndex !== -1) {
            resources[resourceIndex] = {
              ...resources[resourceIndex],
              locationType,
              defaultHost: node
            };
          }
        }
        return resources;
      };

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
                <th>Location type</th>
                <th>Default host</th>
                </tr>
            </thead>
            <tbody id="resources-table">
                {this.state.resources.map((resource, index) => (
                <tr id={`${resource.name}-${resource.host}`} key={index}>
                    <td>{resource.name}</td>
                    <td>{resource.state}</td>
                    <td>{resource.type}</td>
                    <td>{resource.host}</td>
                    <td>{resource.locationType}</td>
                    <td>{resource.defaultHost}</td>
                </tr>
                ))}
            </tbody>
            </table>
            <br/>
            <div className="text">
            <p id="resources-logs" className="text">Resources failed actions : </p>
            {logsWithJumpLines.map((line, index) => (
                <p key={index}>{line}</p>
            ))}
            </div>
        </div>
        );
    }
}

const omitResourcesLocation = (resources) => {
    return resources.map(({ locationType, defaultHost, ...rest }) => rest);
};

const areArraysEqual = (arr1, arr2) => {
    if (JSON.stringify(arr1) !== JSON.stringify(arr2))
      return false;
    return true;
};
