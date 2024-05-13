/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import NodeStatus from './components/nodeStatus';
import ClusterStatus from './components/clusterStatus';
import ResourcesStatus from './components/ressourcesStatus';
import CephStatus from './components/cephStatus';

export class Application extends React.Component {
  render() {
    return (
      <div>
        <h1 className="title1">Cluster Dashboard</h1>
        <div style={{ fontSize: 'small' }}>
          {"last update: " + new Date().toLocaleString()}
        </div>
        <div className="grid-container">
          <div className="grid-item">
            <div>
              <h2 className="title2">Node Status</h2>
              <NodeStatus />
            </div>
          </div>
          <div className="grid-item">
            <div>
              <h2 className="title2">Cluster Status</h2>
              <ClusterStatus />
            </div>
          </div>
          <div className="grid-item">
            <div>
              <h2 className="title2">Resources Status</h2>
              <ResourcesStatus />
            </div>
          </div>
          <div className="grid-item">
            <div>
              <h2 className="title2">Ceph status</h2>
              <CephStatus />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
