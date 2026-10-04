/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import ResourcesStatus from '../../src/components/ressourcesStatus.jsx';
import { respond } from '../helpers/spawn.js';

const STATUS_OUTPUT = [
    ' * guest1\t(ocf::seapath:VirtualDomain):\t Started nuc1',
    ' * ntp\t(systemd:ntpd):\t Started nuc2',
    'Failed Resource Actions:',
    'guest1 failed to start',
].join('\n');

const CONFIGURE_OUTPUT = 'location pin-guest1-onnuc3 guest1 resource-discovery=exclusive inf: nuc3\n';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ResourcesStatus', () => {
    it('lists the resources with their location and failed actions', async () => {
        respond({
            'crm status': STATUS_OUTPUT,
            'crm configure show': CONFIGURE_OUTPUT,
        });
        const ref = React.createRef();

        render(<ResourcesStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.resources).toHaveLength(2));
        await waitFor(() => expect(screen.getByText('guest1 failed to start')).toBeInTheDocument());
        expect(screen.getByText('guest1')).toBeInTheDocument();
        expect(screen.getByText('ntp')).toBeInTheDocument();
        expect(ref.current.state.resources.find((r) => r.name === 'guest1')).toMatchObject({
            locationType: 'pin',
            defaultHost: 'nuc3',
        });
    });

    it('jumps to the console when a virtual machine row is clicked', async () => {
        respond({
            'crm status': STATUS_OUTPUT,
            'crm configure show': CONFIGURE_OUTPUT,
        });
        const ref = React.createRef();
        render(<ResourcesStatus ref={ref} lastUpdate={1} />);
        await waitFor(() => expect(ref.current.state.resources).toHaveLength(2));

        fireEvent.click(screen.getByText('guest1'));

        expect(cockpit.jump).toHaveBeenCalledWith('cockpit-cluster-vm-management#/console/guest1');
    });

    it('does not make systemd resources clickable', async () => {
        respond({
            'crm status': STATUS_OUTPUT,
            'crm configure show': CONFIGURE_OUTPUT,
        });
        const ref = React.createRef();
        render(<ResourcesStatus ref={ref} lastUpdate={1} />);
        await waitFor(() => expect(ref.current.state.resources).toHaveLength(2));

        fireEvent.click(screen.getByText('ntp'));

        expect(cockpit.jump).not.toHaveBeenCalled();
    });
});
