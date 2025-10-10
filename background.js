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

const a = typeof browser === 'undefined' ? chrome : browser;

let wasmReady = false;

async function tryInitWasm() {
    if (wasmReady) return true;
    try {
        const moduleUrl = a.runtime.getURL('pkg/qntm_wasm.js');
        const wasmModule = await import(moduleUrl);
        const init = wasmModule.default;
        await init({ module_or_path: a.runtime.getURL('pkg/qntm_wasm_bg.wasm') });
        wasmReady = true;
        console.log('[QntmBlock] Rust WASM initialized (background script).');
        return true;
    } catch (e) {
        console.info('[QntmBlock] Rust WASM not available yet or unsupported in this context.', e);
        return false;
    }
}

function reinitYouTubeTabs() {
    try {
        if (!a.tabs || !a.tabs.query) return;
        a.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
            if (!tabs || (a.runtime && a.runtime.lastError)) return;
            for (const t of tabs) {
                try { a.tabs.sendMessage(t.id, { type: 'qntm/reinit' }); } catch (e) {}
            }
        });
    } catch (e) {}
}

tryInitWasm();
reinitYouTubeTabs();

if (a.runtime && a.runtime.onInstalled) {
    a.runtime.onInstalled.addListener(() => { tryInitWasm(); reinitYouTubeTabs(); });
}

if (a.runtime && a.runtime.onStartup) {
    a.runtime.onStartup.addListener(() => { tryInitWasm(); reinitYouTubeTabs(); });
}

if (a.tabs && a.tabs.onUpdated) {
    a.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        try {
            if (changeInfo.status === 'complete' && tab && tab.url && tab.url.startsWith('https://www.youtube.com/')) {
                a.tabs.sendMessage(tabId, { type: 'qntm/reinit' });
            }
        } catch (e) {}
    });
}

if (a.storage && a.storage.onChanged) {
    a.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync') return;
        try {
            if (!a.tabs || !a.tabs.query) return;
            a.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
                if (!tabs || (a.runtime && a.runtime.lastError)) return;
                for (const t of tabs) {
                    try { a.tabs.sendMessage(t.id, { type: 'qntm/reinit' }); } catch (e) {}
                }
            });
        } catch (e) {}
    });
}

if (a.runtime && a.runtime.onMessage) {
    a.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg && msg.type === 'qntm/wasm-status') {
            sendResponse({ ready: wasmReady });
            return true;
        }
        return false;
    });
}
