/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export class Application extends React.Component {
  render() {
    return (
      <div>
        <h1 className="title1">Cluster Dashboard</h1>
        <div className="grid-container">
          <div className="grid-item">
            <div>
              <h2 className="title2">Node Status</h2>
            </div>
          </div>
          <div className="grid-item">
            <div>
              <h2 className="title2">Cluster Status</h2>
            </div>
          </div>
          <div className="grid-item">
            <div>
              <h2 className="title2">Resources Status</h2>
            </div>
          </div>
          <div className="grid-item">
            <div>
              <h2 className="title2">Ceph status</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
