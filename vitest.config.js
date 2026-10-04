/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

// The production build resolves the bare "cockpit" and "cockpit-components-*"
// specifiers through esbuild's `nodePaths: ['pkg/lib']`. Vite does not know
// about that, so resolve them here: a controllable mock for "cockpit" and the
// vendored cockpit components for everything else.
function cockpitResolver() {
    return {
        name: 'cockpit-resolver',
        enforce: 'pre',
        resolveId(source) {
            if (source === 'cockpit') {
                return path.resolve(root, 'test/mocks/cockpit.js');
            }
            if (source === 'cockpit-dark-theme') {
                return path.resolve(root, 'pkg/lib/cockpit-dark-theme.js');
            }
            const match = source.match(/^cockpit-components-(.+)\.jsx$/);
            if (match) {
                return path.resolve(root, `pkg/lib/cockpit-components-${match[1]}.jsx`);
            }
            return null;
        },
    };
}

export default defineConfig({
    plugins: [cockpitResolver()],
    test: {
        css: false,
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./test/setup.js'],
        include: ['test/**/*.test.{js,jsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{js,jsx}'],
            // index.js only mounts the React tree on DOMContentLoaded; it has no
            // logic worth covering and cannot be exercised without a real shell.
            exclude: ['src/index.js'],
            thresholds: {
                statements: 90,
                branches: 80,
            },
        },
    },
});
