/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SyncAltIcon } from "@patternfly/react-icons";
import { Select, SelectList, SelectOption, MenuToggle } from '@patternfly/react-core';

export default class UpdateIntervalSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          isSelectOpen: false,
          intervalTime: 10,
          lastUpdate: Date.now(),
        };
      }

    componentDidMount() {
        this.startInterval();
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    startInterval = () => {
        if (this.state.intervalTime !== null) {
            this.interval = setInterval(() => {
                this.setState({ lastUpdate: Date.now() });
                // Send the new "lastUpdate" value
                // used to trigger the re-rendering of child components declared within app.jsx.
                this.props.onUpdate(this.state.lastUpdate);
            }, this.state.intervalTime * 1000);
        }
    };

    changeInterval = () => {
        clearInterval(this.interval);
        this.startInterval();
    };

    handleSelectToggle = () => {
        this.setState({ isSelectOpen: !this.state.isSelectOpen });
    };

    handleSelect = (event, value) => {
        const intervalTime = value === "" ? null : parseInt(value, 10);
        this.setState({ intervalTime, isSelectOpen: false }, () => {
            this.changeInterval();
        });
    };

    render() {
        const { isSelectOpen, intervalTime } = this.state;

        return (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
            <SyncAltIcon style={{ marginRight: '8px' }} />
            <Select
              isOpen={isSelectOpen}
              selected={intervalTime}
              toggle={toggleRef => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={this.handleSelectToggle}
                  isExpanded={isSelectOpen}
                >
                  {intervalTime === null ? '--' : intervalTime + ' s'}
                </MenuToggle>
              )}
              onSelect={this.handleSelect}
            >
              <SelectList>
                <SelectOption value="1">1 s</SelectOption>
                <SelectOption value="10">10 s</SelectOption>
                <SelectOption value="30">30 s</SelectOption>
                <SelectOption value="60">60 s</SelectOption>
                <SelectOption value="">disabled</SelectOption>
              </SelectList>
            </Select>
          </div>
        );
    }
}

UpdateIntervalSelector.propTypes = {
  onUpdate: PropTypes.func.isRequired,
};
