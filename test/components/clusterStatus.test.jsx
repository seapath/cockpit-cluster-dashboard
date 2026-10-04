/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import ClusterStatus from '../../src/components/clusterStatus.jsx';
import { respond } from '../helpers/spawn.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ClusterStatus', () => {
    it('shows the parsed status and logs', async () => {
        respond({ 'crm status --simple-status': 'CLUSTER WARN: split brain\n' });

        render(<ClusterStatus lastUpdate={1} />);

        await waitFor(() => expect(screen.getByText('Status: CLUSTER WARN')).toBeInTheDocument());
        expect(screen.getByText(/split brain/)).toBeInTheDocument();
        expect(cockpit.spawn).toHaveBeenCalledWith(['crm', 'status', '--simple-status'], { superuser: 'try' });
    });

    it('shows an empty log when there is no warning', async () => {
        respond({ 'crm status --simple-status': 'CLUSTER OK: all good\n' });

        render(<ClusterStatus lastUpdate={1} />);

        await waitFor(() => expect(screen.getByText('Status: CLUSTER OK')).toBeInTheDocument());
        expect(screen.getByText(/^logs:/)).toBeInTheDocument();
        expect(screen.queryByText(/split brain/)).not.toBeInTheDocument();
    });

    it('refreshes when lastUpdate changes', async () => {
        respond({ 'crm status --simple-status': 'CLUSTER OK: all good\n' });
        const { rerender } = render(<ClusterStatus lastUpdate={1} />);
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(1));

        rerender(<ClusterStatus lastUpdate={2} />);

        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(2));
    });
});
