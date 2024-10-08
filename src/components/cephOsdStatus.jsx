/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';
import PropTypes from 'prop-types';

export default class CephOsdStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            jsonData: null,
        };
    }

    componentDidMount() {
        this.fetchOsdStatus();
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastUpdate !== prevProps.lastUpdate) {
            this.fetchOsdStatus();
        }
    }

    fetchOsdStatus(){
        cockpit.spawn(["ceph", "osd", "tree", "-f", "json"], {superuser: "try"})
            .then(output => {
                const jsonData = JSON.parse(output);
                this.setState({ jsonData });
            });
    }

    renderOSD(node) {
        const { id, name, type, status, children } = node;

        let renderedChildren = null;
        if (children && children.length > 0) {
            renderedChildren = (
                <ul>
                    {children.map(childId => {
                        const childNode = this.state.jsonData.nodes.find(n => n.id === childId);
                        return <li key={childNode.id}>{this.renderOSD(childNode)}</li>;
                    })}
                </ul>
            );
        }

        let nodeContent;
        switch (type) {
            case 'root':
                break;
            case 'host':
                nodeContent = <em>{name}</em>;
                break;
            case 'osd':
                nodeContent = (
                    <div>
                        <span className="status-indicator" style={{ backgroundColor: getStatusColor(status) }}></span>
                        <span> {name} </span>
                    </div>
                );
                break;
            default:
                nodeContent = name;
        }

        return (
            <div id={`osd-${name}`} key={id}>
                {nodeContent}
                {renderedChildren}
            </div>
        );
    }

    render() {
        const { jsonData } = this.state;
        if (!jsonData) {
            return null;
        }

        const rootNode = jsonData.nodes.find(node => node.type === "root");

        return (
            <div>
                <label className="title3">Ceph object storage daemons</label>
                <ul className="tree">
                    <li>{this.renderOSD(rootNode)}</li>
                </ul>
            </div>
        );
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'up':
            return 'green';
        case 'down':
            return 'red';
        default:
            return 'gray';
    }
}

CephOsdStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
