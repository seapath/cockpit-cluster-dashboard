#!/usr/bin/env node

/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const NODE_MODULES_STAMP = 'node_modules/.package-lock.json';
const COCKPIT_REPO_FILE = 'pkg/lib';

// Function to execute shell command synchronously
function runCommand(command) {
  console.log(`Running command: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

// Function to copy cockpit/lib in the project
function copyCockpitLib() {
  const COCKPIT_REPO_PATH = path.join(__dirname, 'node_modules', 'cockpit-repo', COCKPIT_REPO_FILE);
  const DESTINATION_PATH = path.join(__dirname, COCKPIT_REPO_FILE);

  fs.copySync(COCKPIT_REPO_PATH, DESTINATION_PATH);
}

function dependenciesChanged() {
  const stampPath = path.resolve(__dirname, NODE_MODULES_STAMP);
  const lockfilePath = path.resolve(__dirname, 'package-lock.json');
  const packagePath = path.resolve(__dirname, 'package.json');

  // Reinstall when the installed tree is missing or predates the manifest or
  // the committed lockfile. Comparing against the lockfile makes the install
  // reproducible instead of depending on when node_modules was last touched.
  if (!fs.existsSync(stampPath) || !fs.existsSync(lockfilePath)) return true;

  const stampStats = fs.statSync(stampPath);
  return (
    fs.statSync(packagePath).mtimeMs > stampStats.mtimeMs ||
    fs.statSync(lockfilePath).mtimeMs > stampStats.mtimeMs
  );
}

function buildDist() {
  const distPath = path.join(__dirname, 'dist');
  fs.ensureDirSync(distPath);

  execSync('node build.js', { stdio: 'inherit' });
}

function clean() {
  const directoriesToRemove = ['dist', 'node_modules', 'pkg'];

  directoriesToRemove.forEach(dir => {
    const dirPath = path.resolve(__dirname, dir);
    try {
      fs.removeSync(dirPath);
      console.log(`folder ${dir} removed with succes`);
    } catch (err) {
      console.error(`Failed to remove ${dir}:`, err);
    }
  });
}

function main() {
  if (dependenciesChanged()) {
    runCommand('npm ci');
  }
  copyCockpitLib();

  buildDist();
}

const args = process.argv.slice(2);
if (args.includes('--clean')) {
  clean();
} else {
  main();
}
