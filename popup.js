//-----------------------------------------------------------------------------------------------------
// Copyright (c) 2025 Quantum Browser
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and limitations under the License.
// ----------------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const a = typeof browser === 'undefined' ? chrome : browser;

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabSections = document.querySelectorAll('.settings');

    tabButtons.forEach(btn => btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        tabSections.forEach(s => s.classList.remove('active'));
        const activeSection = document.getElementById(`tab-${target}`);
        if (activeSection) activeSection.classList.add('active');
    }));

    const adDisplayBlur = document.getElementById('ad-display-blur');
    const adDisplayMask = document.getElementById('ad-display-mask');
    const adDisplayOff = document.getElementById('ad-display-off');
    const muteEnabled = document.getElementById('mute-enabled');
    const speedEnabled = document.getElementById('speed-enabled');
    const speedMultiplier = document.getElementById('speed-multiplier');
    const speedValue = document.getElementById('speed-value');
    const betaDetectionEnabled = document.getElementById('beta-detection-enabled');
    const legitModeEnabled = document.getElementById('legit-mode-enabled');
    const randomizeEnabled = document.getElementById('randomize-enabled');
    const randomizeContainer = document.getElementById('randomize-container');
    const autoSkipEnabled = document.getElementById('auto-skip-enabled');
    const experimentalExtraDetections = document.getElementById('experimental-extra-detections');

    function updateSpeedText(value) {
        speedValue.textContent = `×${value}`;
    }

    function toggleRandomizeVisibility() {
        if (!randomizeContainer || !legitModeEnabled) return;
        randomizeContainer.style.display = legitModeEnabled.checked ? 'flex' : 'none';
    }

    function saveOptions() {
        let adDisplayMode = 'blur';
        if (adDisplayMask && adDisplayMask.checked) {
            adDisplayMode = 'mask';
        } else if (adDisplayOff && adDisplayOff.checked) {
            adDisplayMode = 'off';
        }

        const settings = {
            adDisplayMode: adDisplayMode,
            muteEnabled: muteEnabled.checked,
            speedEnabled: speedEnabled.checked,
            speedMultiplier: parseInt(speedMultiplier.value, 10),
            betaDetectionEnabled: betaDetectionEnabled ? betaDetectionEnabled.checked : false,
            legitModeEnabled: legitModeEnabled.checked,
            randomizeEnabled: randomizeEnabled.checked,
            autoSkipEnabled: autoSkipEnabled.checked,
            experimentalExtraDetections: experimentalExtraDetections ? experimentalExtraDetections.checked : false,
        };
        a.storage.sync.set(settings);
    }

    function restoreOptions() {
        const defaults = { 
            adDisplayMode: 'blur',
            muteEnabled: true, 
            speedEnabled: true,
            speedMultiplier: 16,
            betaDetectionEnabled: false,
            legitModeEnabled: false,
            randomizeEnabled: false,
            autoSkipEnabled: true,
            experimentalExtraDetections: false,
        };
        a.storage.sync.get(defaults, (items) => {
            if (items.adDisplayMode === 'mask') {
                adDisplayMask.checked = true;
            } else if (items.adDisplayMode === 'off') {
                adDisplayOff.checked = true;
            } else {
                adDisplayBlur.checked = true;
            }
            muteEnabled.checked = items.muteEnabled;
            speedEnabled.checked = items.speedEnabled;
            speedMultiplier.value = items.speedMultiplier;
            updateSpeedText(items.speedMultiplier);
            if (betaDetectionEnabled) betaDetectionEnabled.checked = items.betaDetectionEnabled;
            legitModeEnabled.checked = items.legitModeEnabled;
            randomizeEnabled.checked = items.randomizeEnabled;
            toggleRandomizeVisibility();
            autoSkipEnabled.checked = items.autoSkipEnabled;
            if (experimentalExtraDetections) experimentalExtraDetections.checked = items.experimentalExtraDetections;
        });
    }

    restoreOptions();

    if (adDisplayBlur) adDisplayBlur.addEventListener('change', saveOptions);
    if (adDisplayMask) adDisplayMask.addEventListener('change', saveOptions);
    if (adDisplayOff) adDisplayOff.addEventListener('change', saveOptions);
    if (muteEnabled) muteEnabled.addEventListener('change', saveOptions);
    if (speedEnabled) speedEnabled.addEventListener('change', saveOptions);
    if (speedMultiplier) speedMultiplier.addEventListener('change', saveOptions);
    if (legitModeEnabled) legitModeEnabled.addEventListener('change', saveOptions);
    if (randomizeEnabled) randomizeEnabled.addEventListener('change', saveOptions);
    if (autoSkipEnabled) autoSkipEnabled.addEventListener('change', saveOptions);
    if (experimentalExtraDetections) experimentalExtraDetections.addEventListener('change', saveOptions);

    if (legitModeEnabled) legitModeEnabled.addEventListener('change', toggleRandomizeVisibility);

    if (speedMultiplier) speedMultiplier.addEventListener('input', () => updateSpeedText(speedMultiplier.value));
});