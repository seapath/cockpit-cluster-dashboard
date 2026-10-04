/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import CephMgrStatus from '../../src/components/cephMgrStatus.jsx';
import { respond } from '../helpers/spawn.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CephMgrStatus', () => {
    it('shows the number of managers and the active one', async () => {
        respond({ 'ceph mgr stat -f json': JSON.stringify({ available: 2, active_name: 'mgr1' }) });
        const ref = React.createRef();

        render(<CephMgrStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.activeName).toBe('mgr1'));
        expect(ref.current.state.available).toBe('2');
        expect(screen.getByText(/MGR available: 2/)).toBeInTheDocument();
        expect(screen.getByText(/MGR: mgr1/)).toBeInTheDocument();
    });

    it('refreshes when lastUpdate changes', async () => {
        respond({ 'ceph mgr stat -f json': JSON.stringify({ available: 1, active_name: 'mgr1' }) });
        const { rerender } = render(<CephMgrStatus lastUpdate={1} />);
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(1));

        rerender(<CephMgrStatus lastUpdate={2} />);

        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(2));
    });
});
