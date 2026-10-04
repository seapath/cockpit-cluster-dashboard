/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UpdateIntervalSelector from '../../src/components/updateIntervalSelector.jsx';

afterEach(() => {
    vi.useRealTimers();
});

describe('UpdateIntervalSelector', () => {
    it('calls onUpdate on the default interval', () => {
        vi.useFakeTimers();
        const onUpdate = vi.fn();

        render(<UpdateIntervalSelector onUpdate={onUpdate} />);

        act(() => vi.advanceTimersByTime(10000));

        expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('changes the interval and stops when disabled', () => {
        vi.useFakeTimers();
        const onUpdate = vi.fn();
        const ref = React.createRef();
        render(<UpdateIntervalSelector ref={ref} onUpdate={onUpdate} />);

        act(() => ref.current.handleSelect(null, '30'));
        expect(ref.current.state.intervalTime).toBe(30);

        act(() => vi.advanceTimersByTime(30000));
        expect(onUpdate).toHaveBeenCalledTimes(1);

        act(() => ref.current.handleSelect(null, ''));
        expect(ref.current.state.intervalTime).toBeNull();

        act(() => vi.advanceTimersByTime(60000));
        expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('toggles the select', () => {
        vi.useFakeTimers();
        const ref = React.createRef();
        render(<UpdateIntervalSelector ref={ref} onUpdate={() => {}} />);

        act(() => ref.current.handleSelectToggle());

        expect(ref.current.state.isSelectOpen).toBe(true);
    });
});
