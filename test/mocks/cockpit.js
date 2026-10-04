/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Controllable stand-in for the "cockpit" module, which only exists at runtime
// inside the Cockpit shell. Tests import it (through the "cockpit" alias) to
// program `spawn`/`channel`/`file` responses and to inspect what the components
// asked for.
import { vi } from 'vitest';

function createChannel() {
    const listeners = {};
    return {
        send: vi.fn(),
        control: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn((type, callback) => {
            (listeners[type] = listeners[type] || []).push(callback);
        }),
        removeEventListener: vi.fn((type, callback) => {
            listeners[type] = (listeners[type] || []).filter((cb) => cb !== callback);
        }),
        // Test-only helper: emit an event the way the real channel would.
        emit: (type, ...args) => {
            (listeners[type] || []).forEach((callback) => callback(...args));
        },
    };
}

const cockpit = {
    spawn: vi.fn(() => Promise.resolve('')),
    channel: vi.fn(() => createChannel()),
    location: {
        path: [],
        go: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    file: vi.fn(() => ({ read: vi.fn(() => Promise.resolve('')) })),
    user: vi.fn(() => Promise.resolve({ name: 'root', home: '/root' })),
    format: vi.fn((template, ...args) =>
        String(template).replace(/\$(\d+)/g, (_, index) => args[Number(index)] ?? '')),
    format_bytes: vi.fn((value) => `${value} B`),
    jump: vi.fn(),
    // Last channel created by `channel()`, handy for emitting "ready".
    lastChannel() {
        const results = this.channel.mock.results;
        return results.length ? results[results.length - 1].value : null;
    },
};

export function resetCockpit() {
    cockpit.spawn.mockReset().mockImplementation(() => Promise.resolve(''));
    cockpit.channel.mockReset().mockImplementation(() => createChannel());
    cockpit.location.path = [];
    cockpit.location.go.mockReset();
    cockpit.addEventListener.mockReset();
    cockpit.removeEventListener.mockReset();
    cockpit.file.mockReset().mockImplementation(() => ({
        read: vi.fn(() => Promise.resolve('')),
    }));
    cockpit.user.mockReset().mockImplementation(() => Promise.resolve({ name: 'root', home: '/root' }));
    cockpit.format.mockReset().mockImplementation((template, ...args) =>
        String(template).replace(/\$(\d+)/g, (_, index) => args[Number(index)] ?? ''));
    cockpit.format_bytes.mockReset().mockImplementation((value) => `${value} B`);
    cockpit.jump.mockReset();
}

export default cockpit;
