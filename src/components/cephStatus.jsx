/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import React from 'react';
import CephMonStatus from './cephMonStatus';
import CephOsdStatus from './cephOsdStatus';
import CephMgrStatus from './cephMgrStatus';
import CephPoolStatus from './cephPoolStatus';

export default class CephStatus extends React.Component {
    constructor() {
        super();
        this.state = {
            health: "",
            mons: [],
            quorumNames: [],
            displayOsd: false,
            displayMon: false,
            displayMgr: false,
        };

        cockpit.spawn(["ceph", "health"], {superuser: "try"})
            .then(output => {
                this.setState({ health: output.trim() });
            });
    }

    render() {
        return (
            <div>
                <div id="ceph-logs">
                    {this.state.health.split(';').map((log, index) => (
                        <p key={index} className="text">
                            {log}
                        </p>
                    ))}
                    <br />
                </div>
                <div className="container">
                    <div className="left">
                        <button id="osd-button" onClick={() => this.setState({ displayOsd: true, displayMon: false, displayMgr: false })}>
                            OSD
                        </button>

                        <span style={{ margin: '0 10px' }}></span>

                        <button id="mon-button" onClick={() => this.setState({ displayOsd: false, displayMon: true, displayMgr: false })}>
                            MON
                        </button>

                        <span style={{ margin: '0 10px' }}></span>

                        <button id="mgr-button" onClick={() => this.setState({ displayOsd: false, displayMon: false, displayMgr: true })}>
                            MGR
                        </button>
                        <br/> <br/>

                        {this.state.displayOsd && <CephOsdStatus />}

                        {this.state.displayMon && <CephMonStatus />}

                        {this.state.displayMgr && <CephMgrStatus />}
                    </div>
                    <div className="right">
                        <CephPoolStatus />
                    </div>
                </div>

            </div>
        );
    }
}
