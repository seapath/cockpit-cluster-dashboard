/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
    applyResourcesLocation,
    areArraysEqual,
    extractNodesStatus,
    extractOtherStatus,
    getStatusColor,
    omitResourcesLocation,
    parseClusterLogs,
    parseClusterStatus,
    parseResourcesInfos,
    parseResourcesIssues,
} from '../../src/lib/parsing.js';

describe('parseClusterStatus', () => {
    it('extracts the cluster status', () => {
        expect(parseClusterStatus('CLUSTER OK: 2 nodes online\n')).toBe('CLUSTER OK');
    });
});

describe('parseClusterLogs', () => {
    it('extracts the warning text', () => {
        expect(parseClusterLogs('CLUSTER WARN: something is wrong\n')).toBe(' something is wrong');
    });

    it('returns an empty string without a warning', () => {
        expect(parseClusterLogs('CLUSTER OK: fine\n')).toBe('');
    });
});

describe('extractNodesStatus', () => {
    const output = 'Online: [ adv-1 nuc1 observer ]\nOFFLINE: [ nuc2 ]\n';

    it('returns the nodes for the requested status', () => {
        expect(extractNodesStatus(output, 'Online')).toEqual(['adv-1', 'nuc1', 'observer']);
        expect(extractNodesStatus(output, 'OFFLINE')).toEqual(['nuc2']);
    });

    it('returns an empty list when the status is absent', () => {
        expect(extractNodesStatus(output, 'RemoteOnline')).toEqual([]);
    });
});

describe('extractOtherStatus', () => {
    it('returns the maintenance or standby node lines', () => {
        const output = 'Online: [ nuc1 ]\n * Node nuc2: standby\n * Node nuc3: maintenance\n';
        expect(extractOtherStatus(output)).toEqual([' * Node nuc2: standby', ' * Node nuc3: maintenance']);
    });

    it('returns an empty list when there is none', () => {
        expect(extractOtherStatus('Online: [ nuc1 ]\n')).toEqual([]);
    });
});

describe('parseResourcesInfos', () => {
    const output = [
        ' * guest1\t(ocf::seapath:VirtualDomain):\t Started nuc1',
        ' * guest2\t(ocf::seapath:VirtualDomain):\t Stopped',
        ' * Clone Set: cl_ntp [ntp]:',
        '   * Started: [ nuc1 nuc3 ]',
        '   * Stopped: [ nuc2 ]',
    ].join('\n');

    it('parses regular resources with an optional host', () => {
        const resources = parseResourcesInfos(output);
        expect(resources).toContainEqual({
            name: 'guest1', type: 'ocf::seapath:VirtualDomain', state: 'Started', host: 'nuc1',
            locationType: '-', defaultHost: '-',
        });
        expect(resources).toContainEqual({
            name: 'guest2', type: 'ocf::seapath:VirtualDomain', state: 'Stopped', host: null,
            locationType: '-', defaultHost: '-',
        });
    });

    it('expands clone sets into one entry per host', () => {
        const resources = parseResourcesInfos(output);
        expect(resources.filter((r) => r.name === 'cl_ntp')).toEqual([
            { name: 'cl_ntp', type: 'ntp', state: 'Started', host: 'nuc1', locationType: '-', defaultHost: '-' },
            { name: 'cl_ntp', type: 'ntp', state: 'Started', host: 'nuc3', locationType: '-', defaultHost: '-' },
            { name: 'cl_ntp', type: 'ntp', state: 'Stopped', host: 'nuc2', locationType: '-', defaultHost: '-' },
        ]);
    });

    it('returns an empty list on unrelated output', () => {
        expect(parseResourcesInfos('nothing here')).toEqual([]);
    });

    it('handles a clone set whose instances are all started', () => {
        const output = ' * Clone Set: cl_only [cl]:\n   * Started: [ nuc1 nuc2 ]\n';
        expect(parseResourcesInfos(output).map((r) => [r.name, r.state, r.host])).toEqual([
            ['cl_only', 'Started', 'nuc1'],
            ['cl_only', 'Started', 'nuc2'],
        ]);
    });
});

describe('applyResourcesLocation', () => {
    const resources = [
        { name: 'guest1', type: 'x', state: 'Started', host: 'nuc1', locationType: '-', defaultHost: '-' },
        { name: 'guest2', type: 'x', state: 'Started', host: 'nuc2', locationType: '-', defaultHost: '-' },
    ];

    it('fills the location of a pinned resource', () => {
        const output = 'location pin-guest1-onnuc3 guest1 resource-discovery=exclusive inf: nuc3\n';
        const result = applyResourcesLocation(resources, output);
        expect(result[0]).toMatchObject({ locationType: 'pin', defaultHost: 'nuc3' });
        expect(result[1]).toMatchObject({ locationType: '-', defaultHost: '-' });
    });

    it('does not mutate the input list', () => {
        applyResourcesLocation(resources, 'location pin-guest1-onnuc3 guest1 resource-discovery=exclusive inf: nuc3\n');
        expect(resources[0].locationType).toBe('-');
    });

    it('ignores constraints for unknown resources', () => {
        const output = 'location pin-ghost-onnuc3 ghost resource-discovery=exclusive inf: nuc3\n';
        expect(applyResourcesLocation(resources, output)).toEqual(resources);
    });
});

describe('parseResourcesIssues', () => {
    it('returns the failed actions text', () => {
        expect(parseResourcesIssues('Failed Resource Actions:\nguest1 failed\n')).toBe('guest1 failed');
    });

    it('returns an empty string when there is none', () => {
        expect(parseResourcesIssues('all good')).toBe('');
    });
});

describe('omitResourcesLocation', () => {
    it('drops the location fields', () => {
        expect(omitResourcesLocation([
            { name: 'guest1', locationType: 'pin', defaultHost: 'nuc1' },
        ])).toEqual([{ name: 'guest1' }]);
    });
});

describe('areArraysEqual', () => {
    it('compares by value', () => {
        expect(areArraysEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
        expect(areArraysEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    });
});

describe('getStatusColor', () => {
    it('maps the OSD status to a colour', () => {
        expect(getStatusColor('up')).toBe('green');
        expect(getStatusColor('down')).toBe('red');
        expect(getStatusColor('unknown')).toBe('gray');
    });
});
