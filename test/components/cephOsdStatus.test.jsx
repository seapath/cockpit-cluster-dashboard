/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import CephOsdStatus from '../../src/components/cephOsdStatus.jsx';
import { respond } from '../helpers/spawn.js';

const OSD_TREE = JSON.stringify({
    nodes: [
        { id: -1, name: 'default', type: 'root', children: [-3, -2] },
        { id: -3, name: 'host1', type: 'host', children: [0, 1] },
        { id: -2, name: 'rack1', type: 'rack', children: [] },
        { id: 0, name: 'osd.0', type: 'osd', status: 'up' },
        { id: 1, name: 'osd.1', type: 'osd', status: 'down' },
    ],
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CephOsdStatus', () => {
    it('renders nothing until the tree is loaded', () => {
        respond({ 'ceph osd tree -f json': OSD_TREE });
        const { container } = render(<CephOsdStatus lastUpdate={1} />);

        expect(container.firstChild).toBeNull();
    });

    it('renders the OSD tree with a colour per status', async () => {
        respond({ 'ceph osd tree -f json': OSD_TREE });
        const ref = React.createRef();
        const { container } = render(<CephOsdStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.jsonData).not.toBeNull());
        expect(screen.getByText('host1')).toBeInTheDocument();
        expect(screen.getByText('rack1')).toBeInTheDocument();

        const indicators = [...container.querySelectorAll('.status-indicator')];
        expect(indicators.map((node) => node.style.backgroundColor)).toEqual(['green', 'red']);
    });

    it('refreshes when lastUpdate changes', async () => {
        respond({ 'ceph osd tree -f json': OSD_TREE });
        const { rerender } = render(<CephOsdStatus lastUpdate={1} />);
        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(1));

        rerender(<CephOsdStatus lastUpdate={2} />);

        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledTimes(2));
    });
});
