/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Parsing helpers, kept free of React and cockpit so they can be unit tested in
// isolation. They reproduce the output handling the components used to perform
// inline.

// First word of the `crm status --simple-status` summary line, e.g.
// "CLUSTER OK: ..." -> "CLUSTER OK".
export function parseClusterStatus(output) {
    const regex = /(CLUSTER.*?)\s*(?=:)/;
    const regexMatch = regex.exec(output);
    return regexMatch[0];
}

// Warning text of the `crm status --simple-status` output, or "" when there is
// none.
export function parseClusterLogs(output) {
    const regex = /CLUSTER WARN:(.*)/;
    const regexMatch = regex.exec(output);
    return regexMatch && regexMatch[1] ? regexMatch[1] : '';
}

// List of nodes for a given status, e.g. with status "Online":
// "Online: [ adv-1 nuc1 observer ]" -> ["adv-1", "nuc1", "observer"].
export function extractNodesStatus(output, status) {
    const statusNodesRegex = new RegExp(`${status}:\\s+\\[\\s*([^\\]]+)\\s*\\]`);
    const nodesMatch = statusNodesRegex.exec(output);
    if (!nodesMatch || !nodesMatch[1]) {
        return [];
    }
    return nodesMatch[1].split(' ').filter((node) => node !== '');
}

// Nodes that are neither online nor offline (maintenance or standby), as the
// raw "* Node ..." lines.
export function extractOtherStatus(output) {
    const regex = /^\s*\* Node.*$/gm;
    const matchArray = [];
    let match;
    while ((match = regex.exec(output)) !== null) {
        matchArray.push(match[0]);
    }
    return matchArray;
}

// Parse `crm status` into the resource list. Four capturing groups: name, type,
// state and optional host.
export function parseResourcesInfos(output) {
    const resources = [];
    const regexResource = /^\s*\*\s*(\S+)\s*\((\S+)\):\s*(\S+)(?:\s(\S+))?/gm;
    const regexCloneSet = /Clone Set:\s(\S+)\s\[(\S+)\]:\s*\* Started: \[\s*([\w\s]+?)\s*\](?:\s*\* Stopped: \[\s*([\w\s]+?)\s*\])?/g;
    let match;

    while ((match = regexResource.exec(output)) !== null) {
        const name = match[1];
        const type = match[2];
        const state = match[3];
        const host = match[4] || null;
        resources.push({ name, type, state, host, locationType: '-', defaultHost: '-' });
    }

    while ((match = regexCloneSet.exec(output)) !== null) {
        const cloneSetName = match[1];
        const type = match[2];
        const startedHosts = match[3] ? match[3].split(/\s+/) : [];
        const stoppedHosts = match[4] ? match[4].split(/\s+/) : [];

        startedHosts.forEach(host => {
            resources.push({ name: cloneSetName, type, state: 'Started', host, locationType: '-', defaultHost: '-' });
        });
        stoppedHosts.forEach(host => {
            resources.push({ name: cloneSetName, type, state: 'Stopped', host, locationType: '-', defaultHost: '-' });
        });
    }
    return resources;
}

// Read the `crm configure show` location constraints and fill locationType and
// defaultHost for the matching resources. Return a new list.
export function applyResourcesLocation(resources, output) {
    const regex = /(cli-prefer|pin)-(?:\S+)\s(\S+)\s(?:\S+)\sinf:\s(.+)/g;
    const result = [...resources];
    let match;
    while ((match = regex.exec(output)) !== null) {
        const locationType = match[1];
        const resourceName = match[2];
        const node = match[3];
        const index = result.findIndex((resource) => resource.name === resourceName);
        if (index !== -1) {
            result[index] = { ...result[index], locationType, defaultHost: node };
        }
    }
    return result;
}

// Text after "Failed Resource Actions:", or "" when there is none.
export function parseResourcesIssues(output) {
    const regex = /Failed Resource Actions:(.*)/s;
    const match = regex.exec(output);
    return match ? match[1].trim() : '';
}

// Drop the location fields so two resource lists can be compared ignoring
// where they are currently placed.
export function omitResourcesLocation(resources) {
    return resources.map(({ locationType, defaultHost, ...rest }) => rest);
}

export function areArraysEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
}

// Colour of the OSD status indicator.
export function getStatusColor(status) {
    switch (status) {
        case 'up':
            return 'green';
        case 'down':
            return 'red';
        default:
            return 'gray';
    }
}
