#!/usr/bin/env node

/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const NODE_MODULES_STAMP = 'package-lock.json';
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
  const nodeModulesStampPath = path.resolve(__dirname, NODE_MODULES_STAMP);

// Checks if package-lock.json is older than package.json
  if (!fs.existsSync(nodeModulesStampPath)) return true;
  const packageLockStats = fs.statSync(nodeModulesStampPath);
  const packageStats = fs.statSync('package.json');
  return packageStats.mtimeMs > packageLockStats.mtimeMs;
}

function buildDist() {
  const distPath = path.join(__dirname, 'dist');
  fs.ensureDirSync(distPath);

  execSync('node build.js', { stdio: 'inherit' });
}

function clean() {
  const directoriesToRemove = ['dist', 'node_modules', 'pkg'];
  const fileToRemove = 'package-lock.json';

  directoriesToRemove.forEach(dir => {
    const dirPath = path.resolve(__dirname, dir);
    try {
      fs.removeSync(dirPath);
      console.log(`folder ${dir} removed with succes`);
    } catch (err) {
      console.error(`Failed to remove ${dir}:`, err);
    }

    const filePath = path.resolve(__dirname, fileToRemove);
    try {
      fs.removeSync(filePath);
      console.log(`File ${fileToRemove} removed with succes`);
    } catch (err) {
      console.error(`Failed to remove ${fileToRemove}:`, err);
    }
  });
}

function main() {
  if (dependenciesChanged()) {
    runCommand('npm install');
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
