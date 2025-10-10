# QntmBlock

QntmBlock is a free, open-source browser extension that transforms your YouTube ad experience. Instead of blocking ads, it blurs, mutes, speeds them up, and offers advanced detection evasion—making interruptions less harsh while still supporting creators.

## Update v0.5 (actually half the way there)

- Major performance and stability improvements due to the new Rust WebAssembly backend.
- Complete redesign of the popup UI.
- Auto-skip is fixed now.

## Upcoming Features
- Script Executor with its own API that allows a developer to run custom scripts on every website and experiment with our tool on them.
- Dev Console with advanced logging and debugging tools.
- WebGL support for better performance.
- Side-by-side Ad Player that allows you to watch processed ads and video at the same time.
- Migrating most of the backend to Rust WebAssembly for better performance and more possibilities.

### Polished UI & seamless activation
- Fully redesigned popup UI across all sections.
- Accessibility and UX: better keyboard focus, larger hit areas, and improved contrast.

## Core Features

- **Visual Treatment**: Ads are smoothly blurred/masked for a seamless transition.
- **Auto Mute**: All ad audio is automatically muted so you can stay focused.
- **Speed Up**: Ads play at up to 32x speed to get you back to your video faster.
- **Full Control**: Easily toggle features and adjust features speed from the popup menu.
- **Mask Effect (part of visual treatment)**: Completely covers ads with YouTube's background color (adapts to dark/light mode| supports the ytb gradient also).
- **Legit Mode & Randomization**: New modes to help avoid detection by YouTube, including randomized behaviors.
- **Dynamic Detection**: Advanced ad and DOM detection methods to stay ahead of YouTube's countermeasures.

## Why QntmBlock?

- **Lightweight & Fast**: Pure JavaScript and Rusts WebAssembly, no heavy libraries, but there is still some impact on browser performance.
- **Creator Friendly**: Ads are modified, not blocked — creators still receive ad revenue.
- **Stealthy & Undetected**: Works client-side, does not block web requests, making it invisible to YouTube.
- **100% Open Source**: All code is available on [GitHub](https://github.com/quantumbrowserdev/qntmblock). Inspect, contribute, and trust what it does.

## Installation


- **Firefox:** [Install from Add-ons](https://addons.mozilla.org/en-US/firefox/addon/qntmblock-youtube-ad-blur/)
- **Chrome/Chromium/Blink:** Not available on the Chrome Web Store (more about that is below), but you can install manually:
	1. Download or clone this repository.
	2. Delete all background functionality (delete `background.js` and `content_security_policy` from `manifest.json`).
	3. Open Chrome and go to `chrome://extensions`.
	4. Enable "Developer mode" (top right).
	5. Click "Load unpacked" and select the extension folder.

## Roadmap

1. **Firefox Support** – Done!
2. **Android Application** – Development is not going on for now.
3. **More Sites** – Support for additional streaming platforms planned, also when API and Exec is added, you are free to do it yourself and add suggestions.

## About Chromium (Chrome Web Store)

From now... We are Chrome unsuported, unless you delete all background functionality. Thanks to the shitty Chromium ecosystem.

That is all from me. Enjoy the extension!

## License

Apache License 2.0

# Copyright 2025 Quantum Browser

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Rust WASM backend (only opti for now)

This extension now includes a Rust WebAssembly backend that runs from the background script. It’s integrated but does nothing but optimatizations yet — ready for future features.

If you are going to make changes to it, just run `cd wasm` and then `wasm-pack build --release --target web --out-dir ../pkg` to build it.