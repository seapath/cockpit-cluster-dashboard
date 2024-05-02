/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import "cockpit-dark-theme";
import "patternfly/patternfly-5-cockpit.scss";

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Application } from './app.jsx';
import './app.scss';

document.addEventListener("DOMContentLoaded", () => {
    createRoot(document.getElementById("app")).render(<Application />);
});
