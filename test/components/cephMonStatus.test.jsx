/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import CephMonStatus from '../../src/components/cephMonStatus.jsx';
import { respond } from '../helpers/spawn.js';

const QUORUM = JSON.stringify({
    monmap: {
        mons: [
            { name: 'mon1', addr: '10.0.0.1:6789/0' },
            { name: 'mon2', addr: '10.0.0.2:6789/0' },
        ],
    },
    quorum_names: ['mon1'],
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CephMonStatus', () => {
    it('lists the monitors and highlights quorum membership', async () => {
        respond({ 'ceph quorum_status': QUORUM });
        const ref = React.createRef();

        render(<CephMonStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.mons).toHaveLength(2));
        expect(screen.getByText('mon1')).toBeInTheDocument();
        expect(screen.getByText('10.0.0.2')).toBeInTheDocument();
        expect(screen.getByText('mon1').closest('tr')).toHaveStyle({ backgroundColor: '#4ed86033' });
        expect(screen.getByText('mon2').closest('tr')).toHaveStyle({ backgroundColor: '#d83d3d33' });
    });

    it('refreshes when lastUpdate changes', async () => {
        respond({ 'ceph quorum_status': QUORUM });
        const { rerender } = render(<CephMonStatus lastUpdate={1} />);
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(1));

        rerender(<CephMonStatus lastUpdate={2} />);

        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(2));
    });
});
