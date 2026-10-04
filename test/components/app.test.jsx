/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import { Application } from '../../src/app.jsx';
import { respond } from '../helpers/spawn.js';

function respondAll() {
    respond({
        'crm status --simple-status': 'CLUSTER OK: fine\n',
        'crm status --exclude=all --include=nodes': 'Online: [ nuc1 ]\n',
        'crm status': '',
        'crm configure show': '',
        'ceph health': 'HEALTH_OK\n',
        'ceph osd tree -f json': JSON.stringify({ nodes: [{ id: -1, name: 'default', type: 'root', children: [] }] }),
        'ceph df -f json': JSON.stringify({ pools: [{ name: 'rbd', stats: { stored: 0, kb_used: 0, max_avail: 0 } }] }),
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Application', () => {
    it('renders the dashboard panels', async () => {
        respondAll();
        render(<Application />);

        expect(screen.getByText('Cluster Dashboard')).toBeInTheDocument();
        expect(screen.getByText(/last update:/)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('Status: CLUSTER OK')).toBeInTheDocument());
    });

    it('propagates a new lastUpdate to the panels', async () => {
        respondAll();
        const ref = React.createRef();
        render(<Application ref={ref} />);
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledWith(['crm', 'status', '--simple-status'], { superuser: 'try' }));

        act(() => ref.current.handleUpdate(42));

        expect(ref.current.state.lastUpdate).toBe(42);
        await waitFor(() => {
            const calls = cockpit.spawn.mock.calls.filter(([command]) => command[1] === 'status' && command[2] === '--simple-status');
            expect(calls.length).toBeGreaterThanOrEqual(2);
        });
    });
});
