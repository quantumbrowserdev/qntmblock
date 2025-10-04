# QntmBlock

QntmBlock is a free, open-source browser extension that transforms your YouTube ad experience. Instead of blocking ads, it blurs, mutes, and speeds them up—making interruptions less harsh while still supporting creators.

# QntmBlock

QntmBlock is a free, open-source browser extension that transforms your YouTube ad experience. Instead of blocking ads, it blurs, mutes, speeds them up, and offers advanced detection evasion—making interruptions less harsh while still supporting creators.

## Update v0.4

- Major performance and stability improvements have been implemented.
- Overall enhancements to standard functions for more reliable ad handling.
- New experimental ad detection methods have been added.
- Exciting new features like the Dev Console, Script Executor, and a Canvas/Side-by-Side Player are being developed for the upcoming BIG update v1.0

## Core Features

- **Smart Blur**: Ads are smoothly blurred for a seamless transition, not just hidden.
- **Auto Mute**: All ad audio is automatically muted so you can stay focused.
- **Speed Up**: Ads play at up to 16x speed to get you back to your video faster.
- **Full Control**: Easily toggle features and adjust blur intensity or playback speed from the popup menu.
- **Mask Effect**: Completely covers ads with YouTube's background color (adapts to dark/light mode).
- **Legit Mode & Randomization**: New modes to help avoid detection by YouTube, including randomized behaviors.
- **Dynamic Detection**: Advanced ad and DOM detection methods to stay ahead of YouTube's countermeasures.

## Why QntmBlock?

- **Lightweight & Fast**: Pure JavaScript, no heavy libraries, minimal impact on browser performance.
- **Creator Friendly**: Ads are modified, not blocked—creators still receive ad revenue.
- **Stealthy & Undetected**: Works client-side, does not block web requests, making it invisible to YouTube.
- **100% Open Source**: All code is available on [GitHub](https://github.com/quantumbrowserdev/qntmblock). Inspect, contribute, and trust what it does.

## Installation


- **Firefox:** [Install from Add-ons](https://addons.mozilla.org/en-US/firefox/addon/qntmblock-youtube-ad-blur/)
- **Chrome/Chromium:** Not available on the Chrome Web Store (more about that is below), but you can install manually:
	1. Download or clone this repository.
	2. Open Chrome and go to `chrome://extensions`.
	3. Enable "Developer mode" (top right).
	4. Click "Load unpacked" and select the extension folder.
	5. (Optional) For debugging, you can add the debug addon from the repo in the same way.

## Roadmap

1. **Firefox Support** – Done!
2. **Android Application** – In progress.
3. **More Sites** – Support for additional streaming platforms planned.

## About Chromium (Chrome Web Store)

I’ve decided not to publish the extension on the Chrome Web Store. The required developer registration fee just to list an extension feels absurd to me, and I’m not willing to pay it. In my view, this pay-to-publish approach reflects poorly on the Chromium ecosystem.

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