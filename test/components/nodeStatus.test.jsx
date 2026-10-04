/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import NodeStatus from '../../src/components/nodeStatus.jsx';
import { respond } from '../helpers/spawn.js';

const NODE_OUTPUT = [
    'Online: [ nuc1 nuc2 ]',
    'OFFLINE: [ nuc3 ]',
    'GuestOnline: [ guest1 ]',
    'GuestOFFLINE: [ guest2 ]',
    'RemoteOnline: [ adv1 ]',
    'RemoteOFFLINE: [ adv2 ]',
    ' * Node nuc4: standby',
].join('\n');

afterEach(() => {
    vi.restoreAllMocks();
});

describe('NodeStatus', () => {
    it('shows every node category, including the optional ones', async () => {
        respond({ 'crm status --exclude=all --include=nodes': NODE_OUTPUT });
        const ref = React.createRef();

        render(<NodeStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.onlineNodes).toEqual(['nuc1', 'nuc2']));
        expect(screen.getByText('online nodes : nuc1 nuc2')).toBeInTheDocument();
        expect(screen.getByText('offline nodes : nuc3')).toBeInTheDocument();
        expect(screen.getByText('guest online nodes : guest1')).toBeInTheDocument();
        expect(screen.getByText('guest offline nodes : guest2')).toBeInTheDocument();
        expect(screen.getByText('remote online nodes : adv1')).toBeInTheDocument();
        expect(screen.getByText('remote offline nodes : adv2')).toBeInTheDocument();
        expect(screen.getByText(/Node nuc4: standby/)).toBeInTheDocument();
    });

    it('hides the optional categories when they are empty', async () => {
        respond({ 'crm status --exclude=all --include=nodes': 'Online: [ nuc1 ]\n' });
        const ref = React.createRef();

        render(<NodeStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.onlineNodes).toEqual(['nuc1']));
        expect(screen.queryByText(/guest online nodes/)).not.toBeInTheDocument();
        expect(screen.queryByText(/remote online nodes/)).not.toBeInTheDocument();
    });

    it('refreshes when lastUpdate changes', async () => {
        respond({ 'crm status --exclude=all --include=nodes': 'Online: [ nuc1 ]\n' });
        const { rerender } = render(<NodeStatus lastUpdate={1} />);
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(1));

        rerender(<NodeStatus lastUpdate={2} />);

        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(2));
    });
});
