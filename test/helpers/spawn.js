/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Test helper to program the mocked cockpit.spawn.

import cockpit from 'cockpit';

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// Resolve each command from a { "command string": output } map. Commands are
// resolved on a later macrotask so the delay matches a real cockpit.spawn
// round-trip and React can commit intermediate state updates.
export function respond(responses) {
    cockpit.spawn.mockImplementation((command) => new Promise((resolve, reject) => {
        const key = command.join(' ');
        setTimeout(() => {
            if (hasOwn(responses, key)) {
                resolve(responses[key]);
            } else {
                reject(new Error(`unexpected command: ${key}`));
            }
        }, 0);
    }));
}
