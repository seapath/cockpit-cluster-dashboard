/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';
import PropTypes from 'prop-types';

import {Table, Thead, Tr, Th, Tbody, Td} from '@patternfly/react-table';

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

    jumpToConsole = (resourceName) => {
        cockpit.jump(`cockpit-cluster-vm-management#/console/${resourceName}`);
    }

    render() {
        const logsWithJumpLines = this.state.logs.split('\n');
        return (
        <div>
            <label className="title3">Resources on the cluster</label>
            <Table variant='compact'>
                <Thead>
                <Tr>
                    <Th textCenter>Name</Th>
                    <Th textCenter>State</Th>
                    <Th textCenter>Type</Th>
                    <Th textCenter>Host</Th>
                    <Th textCenter modifier="wrap">Location type</Th>
                    <Th textCenter modifier="wrap">Default host</Th>
                </Tr>
                </Thead>
                    <Tbody>
                        {this.state.resources.map((resource, index) => {
                            // The console is only accessible to virtual machines
                            const isClickable = resource.type === "ocf::seapath:VirtualDomain";
                            return (
                                <Tr
                                    id={`${resource.name}-${resource.host}`}
                                    key={index}
                                    className={isClickable ? "clickable-row" : ""}
                                    isSelectable={isClickable}
                                    isClickable={isClickable}
                                    onRowClick={() => {
                                        if (isClickable) {
                                            this.jumpToConsole(resource.name);
                                        }
                                    }}
                                >
                                    <Td dataLabel="Name" textCenter>{resource.name}</Td>
                                    <Td dataLabel="State" textCenter>{resource.state}</Td>
                                    <Td dataLabel="Type" textCenter>{resource.type}</Td>
                                    <Td dataLabel="Host" textCenter>{resource.host}</Td>
                                    <Td dataLabel="Location type" textCenter>{resource.locationType}</Td>
                                    <Td dataLabel="Default host" textCenter>{resource.defaultHost}</Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
            </Table>
            <br/>
            <div className="text">
            <label id="resources-logs" className='title3'>Resources failed actions:</label>
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

ResourcesStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
