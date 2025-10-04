const a = typeof browser === 'undefined' ? chrome : browser;

let settings = {
  adDisplayMode: 'blur',
  speedEnabled: true,
  speedMultiplier: 16,
  muteEnabled: true,
  betaDetectionEnabled: false,
  legitModeEnabled: false,
  randomizeEnabled: false,
  autoSkipEnabled: true,
  experimentalExtraDetections: false,
  experimentalCanvasEnabled: false,
  experimentalCanvasWebGL: false,
  experimentalCanvasSize: 240,
  developerConsoleEnabled: false,
  developerDebugEnabled: false,
  developerLogMode: 'qntm',
  devConsolePosition: { left: '12px', top: 'auto', bottom: '12px', right: 'auto' }
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

function ensureStyleTag(id = 'qntmblock-styles') {
  let styleTag = document.getElementById(id);
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = id;
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
  if (settings.developerConsoleEnabled && settings.developerLogMode === 'all') {
    postToRunner('console-hook', { enable: true });
  }
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
    if (changes.developerConsoleEnabled) {
      if (settings.developerConsoleEnabled) createDevConsole(); else removeDevConsole();
    }
    if (changes.experimentalCanvasEnabled) {
      if (!settings.experimentalCanvasEnabled) removeCanvasOverlay();
    }
    initialize();
  }
});

function injectRunner() {
  try {
    const script = document.createElement('script');
    script.src = a.runtime.getURL('inject/exec-runner.js');
    script.onload = () => { script.remove(); };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) { logToDevConsole('injectRunner error', e); }
}
injectRunner();

function postToRunner(type, payload) {
  window.postMessage(Object.assign({ source: 'qntm-run', type }, payload || {}), '*');
}

window.addEventListener('message', (ev) => {
  const m = ev.data;
  if (!m || m.source !== 'qntm-exec') return;
  if (m.type === 'status') {
    logToDevConsole('Executor status:', m.status, m.error || '');
    try { a.runtime.sendMessage({ from: 'content', action: 'executor-status', status: m.status, error: m.error }); } catch(e){}
  } else if (m.type === 'executor-log') {
    logToDevConsole('[executor]', m.msg);
  } else if (m.type === 'console') {
    if (settings.developerConsoleEnabled && settings.developerLogMode === 'all') {
      const line = `[page:${m.level}] ${m.msg}`;
      logToDevConsole(line);
    }
  }
});

a.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.action) return;
  if (msg.action === 'executor-run') {
    postToRunner('run', { code: msg.code });
    return;
  }
  if (msg.action === 'executor-stop') {
    postToRunner('stop');
    return;
  }
  if (msg.action === 'executor-console-hook') {
    postToRunner('console-hook', { enable: !!msg.enable });
    return;
  }
});

let isAdActive = false;
let originalPlaybackRate = 1;
let originalVolume = 1;
let originalMutedState = false;
let originalPaused = false;
let adEffectsInterval = null;
let volumeFadeInterval = null;
let autoSkipInterval = null;
let canvasOverlay = null;
let canvasRAF = null;
let devConsole = null;
let savedVideoStyles = new WeakMap();

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
    originalPaused = video.paused;
  }
  
  if (adEffectsInterval) clearInterval(adEffectsInterval);
  adEffectsInterval = setInterval(() => applyAdEffects(player), 100);

  if (volumeFadeInterval) clearInterval(volumeFadeInterval);
  volumeFadeInterval = null;

  skipAdObserver.observe(player, { childList: true, subtree: true });
  if (skipAd()) { setTimeout(() => { try { skipAd(); } catch(e){} }, 200); }

  if (settings.autoSkipEnabled) {
    if (autoSkipInterval) clearInterval(autoSkipInterval);
    autoSkipInterval = setInterval(() => {
      try {
        const clicked = skipAd();
        if (clicked) {
          setTimeout(() => { try { skipAd(); } catch(e){} }, 120);
        }
      } catch (e) { }
    }, 300);
  }

  if (settings.experimentalCanvasEnabled) {
    createCanvasOverlay(player);
  }
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
    try { if (!originalPaused && video.paused) video.play().catch(()=>{}); } catch(e) {}
  }
  if (autoSkipInterval) { clearInterval(autoSkipInterval); autoSkipInterval = null; }
  
  removeCanvasOverlay();
}

function skipAd() {
  const sel = SELECTORS.skipButton.split(',').map(s => s.trim());
  for (const s of sel) {
    const btn = document.querySelector(s);
    if (btn) {
      try { btn.click(); } catch (e) {}
      return true;
    }
  }
  return false;
}

function createCanvasOverlay(player) {
  return;
}

function removeCanvasOverlay() {
  if (canvasRAF) { cancelAnimationFrame(canvasRAF); canvasRAF = null; }
  if (canvasOverlay) { try { try { const v = canvasOverlay.video; const saved = savedVideoStyles.get(v); if (saved) { v.style.visibility = saved.visibility || ''; v.style.opacity = saved.opacity || ''; v.style.display = saved.display || ''; savedVideoStyles.delete(v); } } catch (e) {} canvasOverlay.container.remove(); } catch (e) {} canvasOverlay = null; }
}

function makeElementDraggable(dragHandle, moveTarget) {
    let isDown = false;
    let offset = [0,0];

    function onMouseDown(e) {
        isDown = true;
        offset = [
            moveTarget.offsetLeft - e.clientX,
            moveTarget.offsetTop - e.clientY
        ];
        moveTarget.style.right = 'auto';
        moveTarget.style.bottom = 'auto';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    }

    function onMouseMove(e) {
        if (!isDown) return;
        e.preventDefault();
        moveTarget.style.left = (e.clientX + offset[0]) + 'px';
        moveTarget.style.top = (e.clientY + offset[1]) + 'px';
    }

    function onMouseUp() {
        isDown = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        
        const rect = moveTarget.getBoundingClientRect();
        settings.devConsolePosition = {
            left: rect.left + 'px',
            top: rect.top + 'px',
            bottom: 'auto',
            right: 'auto'
        };
        a.storage.sync.set({ devConsolePosition: settings.devConsolePosition });
    }

    dragHandle.addEventListener('mousedown', onMouseDown);
}

function createDevConsole() {
  removeDevConsole();
  
  const consoleStyles = `
    .qntm-console {
      position: fixed;
      width: 520px;
      height: 380px;
      z-index: 2147483647;
      background-color: #1e1e1e;
      color: #d4d4d4;
      border: 1px solid #333;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .qntm-console .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px;
      background-color: #333;
      cursor: move;
    }
    .qntm-console .title {
      font-weight: bold;
    }
    .qntm-console .controls button, .qntm-console .controls select {
      background-color: #555;
      color: #fff;
      border: 1px solid #666;
      border-radius: 3px;
      padding: 2px 6px;
      margin-left: 4px;
      cursor: pointer;
    }
    .qntm-console .controls button:hover { background-color: #666; }
    .qntm-console .body {
      flex-grow: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .qntm-console .line {
      white-space: pre-wrap;
      word-break: break-all;
      padding-bottom: 4px;
    }
  `;
  ensureStyleTag('qntm-console-styles').textContent = consoleStyles;

  const container = document.createElement('div');
  container.id = 'qntmblock-dev-console';
  container.className = 'qntm-console';
  
  const pos = settings.devConsolePosition || { left: '12px', top: 'auto', bottom: '12px', right: 'auto' };
  Object.assign(container.style, pos);

  const header = document.createElement('div');
  header.className = 'header';

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'QntmBlock Dev Console';

  const controls = document.createElement('div');
  controls.className = 'controls';

  const btnClear = document.createElement('button'); btnClear.textContent = 'Clear';
  const btnCopy = document.createElement('button'); btnCopy.textContent = 'Copy All';
  const btnDownload = document.createElement('button'); btnDownload.textContent = 'Download';
  
  const filterSelect = document.createElement('select');
  const optQ = document.createElement('option'); optQ.value = 'qntm'; optQ.textContent = 'Only Qntm';
  const optAll = document.createElement('option'); optAll.value = 'all'; optAll.textContent = 'Log All';
  filterSelect.appendChild(optQ); filterSelect.appendChild(optAll);
  filterSelect.value = settings.developerLogMode || 'qntm';

  controls.appendChild(btnClear); controls.appendChild(btnCopy); controls.appendChild(btnDownload); controls.appendChild(filterSelect);
  header.appendChild(title); header.appendChild(controls);

  const body = document.createElement('div');
  body.className = 'body';

  container.appendChild(header); container.appendChild(body);
  document.body.appendChild(container);
  devConsole = { container, body };

  btnClear.addEventListener('click', () => { devConsole.body.innerHTML = ''; });
  btnCopy.addEventListener('click', () => { copyText(devConsole.body.innerText); });
  btnDownload.addEventListener('click', () => { downloadText('qntmblock-log.txt', devConsole.body.innerText); });

  filterSelect.addEventListener('change', () => {
    settings.developerLogMode = filterSelect.value;
    try { a.storage.sync.set({ developerLogMode: filterSelect.value }); } catch(e){}
    postToRunner('console-hook', { enable: settings.developerLogMode === 'all' });
  });

  makeElementDraggable(header, container);
}

function removeDevConsole() { 
    if (devConsole) { 
        try { devConsole.container.remove(); } catch (e) {} 
        devConsole = null; 
    }
    const styleTag = document.getElementById('qntm-console-styles');
    if (styleTag) styleTag.remove();
}

function logToDevConsole(...args) {
  const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  const ts = `[${new Date().toISOString()}] `;
  const isQntm = String(args[0] || '').startsWith('QntmBlock') || (args[0] && typeof args[0] === 'string' && args[0].includes('Qntm')) || false;
  const mode = settings.developerLogMode || 'qntm';
  const show = (mode === 'all') || (mode === 'qntm' && isQntm) || (String(text).startsWith('[executor]'));

  if (settings.developerConsoleEnabled && devConsole && show) {
    const line = document.createElement('div');
    line.className = 'line';
    line.textContent = ts + text;
    devConsole.body.appendChild(line);
    devConsole.body.scrollTop = devConsole.body.scrollHeight;
  }
  if (settings.developerDebugEnabled) console.log('QntmBlock:', ...args);
}

function copyText(text) { navigator.clipboard?.writeText(text).catch(()=>{}); }
function downloadText(filename, text) { const blob = new Blob([text], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

let lastVideoTime = 0;
let timeUpdateInterval = null;
let audioContextMap = new WeakMap();
let lastPlayerRect = null;

function betaAdDetection(player) {
  if (!settings.betaDetectionEnabled && !settings.experimentalExtraDetections) return;

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

  if (settings.experimentalExtraDetections) {
    try {
      const rect = player.getBoundingClientRect();
      if (lastPlayerRect) {
        const dx = Math.abs(rect.width - lastPlayerRect.width);
        const dy = Math.abs(rect.height - lastPlayerRect.height);
        if (!isAdActive && (dx > rect.width * 0.15 || dy > rect.height * 0.15)) {
          logToDevConsole('ExtraDetection: player size change detected');
          startAdHandler(player);
        }
      }
      lastPlayerRect = rect;
    } catch (e) {}

    try {
      const videoEl = player.querySelector(SELECTORS.video);
      if (videoEl && typeof AudioContext !== 'undefined') {
        if (!audioContextMap.has(videoEl)) {
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          try {
            const src = ac.createMediaElementSource(videoEl);
            const analyser = ac.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyser.connect(ac.destination);
            audioContextMap.set(videoEl, { ac, analyser });
          } catch (e) {
            audioContextMap.set(videoEl, null);
          }
        }
        const info = audioContextMap.get(videoEl);
        if (info && info.analyser) {
          const data = new Uint8Array(info.analyser.frequencyBinCount);
          info.analyser.getByteFrequencyData(data);
          let sum = 0; for (let i=0;i<data.length;i++) sum += data[i];
          const avg = sum / data.length;
          if (!isAdActive && avg < 6 && videoEl.duration && videoEl.duration < 45) {
            logToDevConsole('ExtraDetection: low audio amplitude detected', avg);
            startAdHandler(player);
          }
        }
      }
    } catch (e) {}
  }
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

  if (settings.developerConsoleEnabled) createDevConsole(); else removeDevConsole();
}

const executorState = { running: false, stopRequested: false, handles: new Set() };

function makeExecutorAPI() {
  return {
    shouldStop: () => executorState.stopRequested,
    qntmSetInterval: (fn, ms) => {
      const id = setInterval(() => { try { if (!executorState.stopRequested) fn(); } catch(e) { logToDevConsole('executor error', e); } }, ms);
      executorState.handles.add(id); return id;
    },
    qntmClearInterval: (id) => { clearInterval(id); executorState.handles.delete(id); },
    qntmLog: (...args) => { logToDevConsole('[executor]', ...args); }
  };
}

function stopExecutor() {
  if (!executorState.running) return;
  executorState.stopRequested = true;
  for (const h of executorState.handles) { try { clearInterval(h); } catch(e){} }
  executorState.handles.clear();
  executorState.running = false;
  executorState.stopRequested = false;
  logToDevConsole('Executor stopped');
}

a.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.action) return;
  if (msg.action === 'executor-run') {
    postToRunner('run', { code: msg.code });
    return;
  }
  if (msg.action === 'executor-stop') {
    postToRunner('stop');
    return;
  }
});