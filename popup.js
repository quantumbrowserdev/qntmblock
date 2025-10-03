document.addEventListener('DOMContentLoaded', () => {
    const a = typeof browser === 'undefined' ? chrome : browser;

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

    function updateSpeedText(value) {
        speedValue.textContent = `${value}x`;
    }

    function toggleRandomizeVisibility() {
        randomizeContainer.style.display = legitModeEnabled.checked ? 'flex' : 'none';
    }

    function saveOptions() {
        let adDisplayMode = 'blur';
        if (adDisplayMask.checked) {
            adDisplayMode = 'mask';
        } else if (adDisplayOff.checked) {
            adDisplayMode = 'off';
        }

        const settings = {
            adDisplayMode: adDisplayMode,
            muteEnabled: muteEnabled.checked,
            speedEnabled: speedEnabled.checked,
            speedMultiplier: parseInt(speedMultiplier.value, 10),
            betaDetectionEnabled: betaDetectionEnabled.checked,
            legitModeEnabled: legitModeEnabled.checked,
            randomizeEnabled: randomizeEnabled.checked,
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
            betaDetectionEnabled.checked = items.betaDetectionEnabled;
            legitModeEnabled.checked = items.legitModeEnabled;
            randomizeEnabled.checked = items.randomizeEnabled;
            toggleRandomizeVisibility();
        });
    }

    restoreOptions();

    adDisplayBlur.addEventListener('change', saveOptions);
    adDisplayMask.addEventListener('change', saveOptions);
    adDisplayOff.addEventListener('change', saveOptions);
    muteEnabled.addEventListener('change', saveOptions);
    speedEnabled.addEventListener('change', saveOptions);
    speedMultiplier.addEventListener('change', saveOptions);
    betaDetectionEnabled.addEventListener('change', saveOptions);
    legitModeEnabled.addEventListener('change', saveOptions);
    randomizeEnabled.addEventListener('change', saveOptions);

    legitModeEnabled.addEventListener('change', toggleRandomizeVisibility);

    speedMultiplier.addEventListener('input', () => updateSpeedText(speedMultiplier.value));
});