/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import CephStatus from '../../src/components/cephStatus.jsx';
import { respond } from '../helpers/spawn.js';

const OSD_TREE = JSON.stringify({
    nodes: [
        { id: -1, name: 'default', type: 'root', children: [0] },
        { id: 0, name: 'osd.0', type: 'osd', status: 'up' },
    ],
});
const POOL = JSON.stringify({
    pools: [{ name: 'rbd', stats: { stored: 1, kb_used: 1, max_avail: 1 } }],
});

function respondAll() {
    respond({
        'ceph health': 'HEALTH_WARN;1 pool near full\n',
        'ceph osd tree -f json': OSD_TREE,
        'ceph df -f json': POOL,
        'ceph quorum_status': JSON.stringify({ monmap: { mons: [] }, quorum_names: [] }),
        'ceph mgr stat -f json': JSON.stringify({ available: 1, active_name: 'mgr1' }),
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CephStatus', () => {
    it('shows the health lines and the OSD view by default', async () => {
        respondAll();
        const ref = React.createRef();

        render(<CephStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.health).toBe('HEALTH_WARN;1 pool near full'));
        expect(screen.getByText('HEALTH_WARN')).toBeInTheDocument();
        expect(screen.getByText('1 pool near full')).toBeInTheDocument();
        expect(ref.current.state.displayOsd).toBe(true);
    });

    it('switches between the OSD, MON and MGR views', async () => {
        respondAll();
        const ref = React.createRef();
        render(<CephStatus ref={ref} lastUpdate={1} />);

        act(() => fireEvent.click(screen.getByRole('button', { name: 'MON' })));
        expect(ref.current.state).toMatchObject({ displayOsd: false, displayMon: true, displayMgr: false });
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledWith(['ceph', 'quorum_status'], { superuser: 'try' }));

        act(() => fireEvent.click(screen.getByRole('button', { name: 'MGR' })));
        expect(ref.current.state).toMatchObject({ displayOsd: false, displayMon: false, displayMgr: true });
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledWith(['ceph', 'mgr', 'stat', '-f', 'json'], { superuser: 'try' }));

        act(() => fireEvent.click(screen.getByRole('button', { name: 'OSD' })));
        expect(ref.current.state).toMatchObject({ displayOsd: true, displayMon: false, displayMgr: false });
    });

    it('refreshes the health when lastUpdate changes', async () => {
        respondAll();
        const { rerender } = render(<CephStatus lastUpdate={1} />);
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledWith(['ceph', 'health'], { superuser: 'try' }));

        rerender(<CephStatus lastUpdate={2} />);

        await waitFor(() => {
            const healthCalls = cockpit.spawn.mock.calls.filter(([command]) => command[0] === 'ceph' && command[1] === 'health');
            expect(healthCalls).toHaveLength(2);
        });
    });
});
