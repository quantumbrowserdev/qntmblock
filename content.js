const a = typeof browser === 'undefined' ? chrome : browser;

let settings = {
  adDisplayMode: 'blur',
  speedEnabled: true,
  speedMultiplier: 16,
  muteEnabled: true,
  betaDetectionEnabled: false,
  legitModeEnabled: false,
  randomizeEnabled: false,
};

const SELECTORS = {
  player: '#movie_player',
  adShowingClass: 'ad-showing',
  video: '.html5-main-video',
  videoContainer: '.html5-video-container',
  shortsAd: 'ytd-reel-video-renderer[is-ad]',
  adConfirmation: [
    '.ytp-ad-text',
    '.ytp-ad-preview-container',
    '.ytp-ad-persistent-progress-bar-container',
    '.ytp-ad-hover-text-button'
  ],
  cosmeticAd: [
    'ytd-ad-slot-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    'ytd-promoted-video-renderer',
    'div#player-ads',
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
    'ytd-merch-shelf-renderer',
    '#donation-shelf',
    '#ticket-shelf',
    'ytd-brand-video-singleton-renderer',
    'ytd-brand-video-shelf-renderer',
    'ytd-survey-renderer',
  ],
  skipButton: '.ytp-ad-skip-button-modern, .ytp-ad-skip-button'
};
SELECTORS.cosmeticAd.push(SELECTORS.shortsAd);

function ensureStyleTag() {
  let styleTag = document.getElementById('qntmblock-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'qntmblock-styles';
    (document.head || document.body).appendChild(styleTag);
  }
  return styleTag;
}

function updateStylesheet() {
  let rules = '';
  const allSelectors = [
    ...SELECTORS.cosmeticAd,
    `${SELECTORS.player}.${SELECTORS.adShowingClass} ${SELECTORS.videoContainer}`,
    ...SELECTORS.adConfirmation
  ].join(',\n');

  if (settings.adDisplayMode === 'blur') {
    rules = `
      ${allSelectors} {
        filter: blur(5px) !important;
        pointer-events: none !important;
      }
    `;
  } else if (settings.adDisplayMode === 'mask') {
    const isDarkTheme = document.documentElement.hasAttribute('dark');
    const maskColor = isDarkTheme ? '#0f0f0f' : '#ffffff';
    rules = `
      ${[...SELECTORS.cosmeticAd, ...SELECTORS.adConfirmation].join(',\n')} {
        background-color: ${maskColor} !important;
        border: none !important;
        box-shadow: none !important;
      }
      ${[...SELECTORS.cosmeticAd, ...SELECTORS.adConfirmation].join(',\n')} > * {
        visibility: hidden !important;
      }
      ${SELECTORS.player}.${SELECTORS.adShowingClass} ${SELECTORS.videoContainer} {
        background-color: ${maskColor} !important;
      }
      ${SELECTORS.player}.${SELECTORS.adShowingClass} ${SELECTORS.video} {
        opacity: 0 !important;
      }
    `;
  } else { 
    rules = `
      ${allSelectors} {
        filter: none !important;
        pointer-events: auto !important;
      }
    `;
  }
  ensureStyleTag().textContent = rules;
}

a.storage.sync.get(settings, (loadedSettings) => {
  Object.assign(settings, loadedSettings);
  updateStylesheet();
  initialize();
});

a.storage.onChanged.addListener((changes) => {
  let needsUiUpdate = false;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (settings.hasOwnProperty(key)) {
      settings[key] = newValue;
      needsUiUpdate = true;
    }
  }
  if (needsUiUpdate) {
    updateStylesheet();
    initialize();
  }
});

let isAdActive = false;
let originalPlaybackRate = 1;
let originalVolume = 1;
let originalMutedState = false;
let adEffectsInterval = null;
let volumeFadeInterval = null;

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function applyAdEffects(player) {
  const video = player.querySelector(SELECTORS.video);
  if (!video) return;

  if (settings.speedEnabled) {
      if (settings.legitModeEnabled) {
          const speed = settings.randomizeEnabled ? getRandom(6, 10) : 8;
          video.playbackRate = speed;
      } else {
          video.playbackRate = settings.speedMultiplier;
      }
  }

  if (settings.muteEnabled) {
      if (settings.legitModeEnabled) {
          if (video.volume > 0 && !volumeFadeInterval) {
              const fadeDuration = settings.randomizeEnabled ? getRandom(300, 700) : 500;
              const steps = 20;
              const volumeStep = video.volume / steps;
              volumeFadeInterval = setInterval(() => {
                  if (video.volume > volumeStep) {
                      video.volume -= volumeStep;
                  } else {
                      video.volume = 0;
                      clearInterval(volumeFadeInterval);
                      volumeFadeInterval = null;
                  }
              }, fadeDuration / steps);
          }
      } else {
          video.muted = true;
      }
  }
}

function startAdHandler(player) {
  if (isAdActive) return;
  isAdActive = true;

  const video = player.querySelector(SELECTORS.video);
  if (video) {
    originalPlaybackRate = video.playbackRate;
    originalVolume = video.volume;
    originalMutedState = video.muted;
  }
  
  if (adEffectsInterval) clearInterval(adEffectsInterval);
  adEffectsInterval = setInterval(() => applyAdEffects(player), 100);

  if (volumeFadeInterval) clearInterval(volumeFadeInterval);
  volumeFadeInterval = null;

  skipAdObserver.observe(player, { childList: true, subtree: true });
  skipAd();
}

function stopAdHandler() {
  if (!isAdActive) return;
  isAdActive = false;

  if (adEffectsInterval) clearInterval(adEffectsInterval);
  if (volumeFadeInterval) clearInterval(volumeFadeInterval);
  volumeFadeInterval = null;

  skipAdObserver.disconnect();

  const video = document.querySelector(SELECTORS.video);
  if (video) {
    video.playbackRate = originalPlaybackRate;
    video.volume = originalVolume;
    video.muted = originalMutedState;
  }
}

function skipAd() {
  const skipButton = document.querySelector(SELECTORS.skipButton);
  if (skipButton) skipButton.click();
}

let lastVideoTime = 0;
let timeUpdateInterval = null;

function betaAdDetection(player) {
    if (!settings.betaDetectionEnabled) return;

    const video = player.querySelector(SELECTORS.video);
    if (!video) return;

    const currentTime = video.currentTime;
    const adDurationThreshold = 45; 

    if (
        !isAdActive &&
        currentTime < lastVideoTime &&
        lastVideoTime > 1 &&
        video.duration > 0 &&
        video.duration < adDurationThreshold
    ) {
        startAdHandler(player);
    }

    lastVideoTime = currentTime;
}

const skipAdObserver = new MutationObserver(() => {
    skipAd();
});

function isAdShowing(player) {
  if (player.classList.contains(SELECTORS.adShowingClass)) {
    return true;
  }
  for (const selector of SELECTORS.adConfirmation) {
    if (player.querySelector(selector)) {
      return true;
    }
  }
  return false;
}

const modifiedShortsVideos = new Map();

const globalAdObserver = new MutationObserver(() => {
  updateStylesheet();
  const player = document.querySelector(SELECTORS.player);
  if (player) {
    if (isAdShowing(player)) {
      startAdHandler(player);
    } else {
      stopAdHandler();
    }
  }

  const shortsAds = document.querySelectorAll(SELECTORS.shortsAd);
  const currentShortsVideos = new Set();

  shortsAds.forEach(shortsAd => {
    const video = shortsAd.querySelector('video');
    if (video) {
        currentShortsVideos.add(video);
        if (!modifiedShortsVideos.has(video)) {
            const originalState = {
                playbackRate: video.playbackRate,
                volume: video.volume,
                muted: video.muted,
            };
            modifiedShortsVideos.set(video, originalState);
        }
        
        if (settings.speedEnabled) {
            if (settings.legitModeEnabled) {
                const speed = settings.randomizeEnabled ? getRandom(6, 10) : 8;
                video.playbackRate = speed;
            } else {
                video.playbackRate = 16;
            }
        }

        if (settings.muteEnabled) {
            if (settings.legitModeEnabled) {
                if (video.volume > 0 && !video.qntmFadeInterval) {
                    const fadeDuration = settings.randomizeEnabled ? getRandom(300, 700) : 500;
                    const steps = 20;
                    const volumeStep = video.volume / steps;
                    video.qntmFadeInterval = setInterval(() => {
                        if (video.volume > volumeStep) {
                            video.volume -= volumeStep;
                        } else {
                            video.volume = 0;
                            clearInterval(video.qntmFadeInterval);
                            video.qntmFadeInterval = null;
                        }
                    }, fadeDuration / steps);
                }
            } else {
                video.muted = true;
            }
        }
    }
  });

  for (const [video, originalState] of modifiedShortsVideos.entries()) {
    if (!currentShortsVideos.has(video)) {
        if (document.body.contains(video)) {
            if (video.qntmFadeInterval) {
                clearInterval(video.qntmFadeInterval);
                video.qntmFadeInterval = null;
            }
            video.playbackRate = originalState.playbackRate;
            video.volume = originalState.volume;
            video.muted = originalState.muted;
        }
        modifiedShortsVideos.delete(video);
    }
  }
});

function initialize() {
  const pageManager = document.querySelector('ytd-page-manager');
  if (timeUpdateInterval) clearInterval(timeUpdateInterval);

  if(pageManager){
    globalAdObserver.observe(pageManager, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['is-ad', 'class'] 
    });
  }

  const player = document.querySelector(SELECTORS.player);
  if (settings.betaDetectionEnabled && player) {
    timeUpdateInterval = setInterval(() => betaAdDetection(player), 250);
  }

  if (player && isAdShowing(player)) {
    startAdHandler(player);
  }
}