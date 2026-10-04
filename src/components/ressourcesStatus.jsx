/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';
import PropTypes from 'prop-types';

import {Table, Thead, Tr, Th, Tbody, Td} from '@patternfly/react-table';
import {
    applyResourcesLocation,
    areArraysEqual,
    omitResourcesLocation,
    parseResourcesInfos,
    parseResourcesIssues,
} from '../lib/parsing';

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
                const resources = parseResourcesInfos(output);
                const resourcesInfo = parseResourcesIssues(output);

                // prevent locationType and defaultHost from being reset to their initial state each time the component is updated.
                const prevResourcesFiltered = omitResourcesLocation(this.state.resources);
                const resourcesFiltered = omitResourcesLocation(resources);
                if(!areArraysEqual(resourcesFiltered, prevResourcesFiltered)){
                    this.setState({ resources });
                }
                this.setState({ logs: resourcesInfo });
            });

        await cockpit.spawn(["crm", "configure", "show"], {superuser: "try"}).then((output) => {
            const resources = applyResourcesLocation(this.state.resources, output);
            this.setState({ resources });
            });
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

ResourcesStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
