/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import cockpit from 'cockpit';
import { Button } from '@patternfly/react-core';
import React from 'react';
import PropTypes from 'prop-types';
import CephMonStatus from './cephMonStatus';
import CephOsdStatus from './cephOsdStatus';
import CephMgrStatus from './cephMgrStatus';
import CephPoolStatus from './cephPoolStatus';

export default class CephStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            health: "",
            mons: [],
            quorumNames: [],
            displayOsd: true,
            displayMon: false,
            displayMgr: false,
        };
    }

    componentDidMount() {
        this.fetchCephStatus();
    }

    componentDidUpdate(prevProps) {
        if (this.props.lastUpdate !== prevProps.lastUpdate) {
            this.fetchCephStatus();
        }
    }

    fetchCephStatus(){
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
                <div>
                    <Button
                        id="osd-button"
                        variant="secondary"
                        onClick={() => this.setState({ displayOsd: true, displayMon: false, displayMgr: false })}
                    >
                        OSD
                    </Button>

                    <span style={{ margin: '0 10px' }}></span>

                    <Button
                        id="mon-button"
                        variant="secondary"
                        onClick={() => this.setState({ displayOsd: false, displayMon: true, displayMgr: false })}
                    >
                        MON
                    </Button>

                    <span style={{ margin: '0 10px' }}></span>

                    <Button
                        id="mgr-button"
                        variant="secondary"
                        onClick={() => this.setState({ displayOsd: false, displayMon: false, displayMgr: true })}
                    >
                        MGR
                    </Button>
                    <br/> <br/>

                    {this.state.displayOsd && <CephOsdStatus lastUpdate={this.props.lastUpdate}/>}

                    {this.state.displayMon && <CephMonStatus lastUpdate={this.props.lastUpdate}/>}

                    {this.state.displayMgr && <CephMgrStatus lastUpdate={this.props.lastUpdate}/>}

                    <div style={{ marginTop: '50px'}}>
                        <CephPoolStatus lastUpdate={this.props.lastUpdate}/>
                    </div>
                </div>

            </div>
        );
    }
}

CephStatus.propTypes = {
    lastUpdate: PropTypes.number,
};
