/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CephPoolStatus from '../../src/components/cephPoolStatus.jsx';
import { respond } from '../helpers/spawn.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CephPoolStatus', () => {
    it('shows the RBD pool usage in bytes', async () => {
        respond({
            'ceph df -f json': JSON.stringify({
                pools: [{ name: 'rbd', stats: { stored: 1024, kb_used: 2, max_avail: 4096 } }],
            }),
        });
        const ref = React.createRef();

        render(<CephPoolStatus ref={ref} lastUpdate={1} />);

        await waitFor(() => expect(ref.current.state.stored).toBe(1024));
        expect(ref.current.state.used).toBe(2048);
        expect(ref.current.state.available).toBe(4096);
        expect(screen.getByText('1024 B')).toBeInTheDocument();
        expect(screen.getByText('2048 B')).toBeInTheDocument();
        expect(screen.getByText('4096 B')).toBeInTheDocument();
    });
});
