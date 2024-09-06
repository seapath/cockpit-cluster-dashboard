/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import NodeStatus from './components/nodeStatus';
import ClusterStatus from './components/clusterStatus';
import ResourcesStatus from './components/ressourcesStatus';
import CephStatus from './components/cephStatus';
import UpdateIntervalSelector from './components/updateIntervalSelector';

import { Grid, GridItem } from '@patternfly/react-core';

export class Application extends React.Component {
  constructor() {
    super();
    this.state = {
      lastUpdate: Date.now(),
    };
  }

  handleUpdate = (lastUpdate) => {
    this.setState({ lastUpdate });
  };

  render() {
    return (
      <div>
        <h1 className="title1">Cluster Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 'small' }}>
            {"last update: " + new Date().toLocaleString()}
          </div>
            <UpdateIntervalSelector
            onUpdate={this.handleUpdate}
          />
        </div>

        <Grid hasGutter>
        <GridItem span={4} className="grid-item">
            <h2 className="title2">Cluster Status</h2>
            <ClusterStatus lastUpdate={this.state.lastUpdate} />
          </GridItem>

          <GridItem span={4} className="grid-item">
            <h2 className="title2">Node Status</h2>
            <NodeStatus lastUpdate={this.state.lastUpdate} />
          </GridItem>

          <GridItem span={4} rowSpan={2} className="grid-item">
            <h2 className="title2">Ceph status</h2>
            <CephStatus lastUpdate={this.state.lastUpdate} />
          </GridItem>

          <GridItem span={8} className="grid-item">
            <h2 className="title2">Resources Status</h2>
            <ResourcesStatus lastUpdate={this.state.lastUpdate} />
          </GridItem>
        </Grid>
      </div>
    );
  }
}
