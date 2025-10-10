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

use wasm_bindgen::prelude::*;
use js_sys::{Uint8Array, Math};

#[wasm_bindgen(start)]
pub fn start() {}

#[wasm_bindgen]
pub fn compute_speed(legit: bool, _randomize: bool, multiplier: f32) -> f32 {
    if legit {
        8.0
    } else {
        multiplier
    }
}

#[wasm_bindgen]
pub fn is_ad_time_wrap(last_time: f64, current_time: f64, duration: f64, threshold: f64) -> bool {
    current_time < last_time && last_time > 1.0 && duration > 0.0 && duration < threshold
}

#[wasm_bindgen]
pub fn avg_u8(data: &Uint8Array) -> f64 {
    let len = data.length() as usize;
    if len == 0 { return 0.0; }
    let mut sum: u64 = 0;
    for i in 0..len {
        sum += data.get_index(i as u32) as u64;
    }
    (sum as f64) / (len as f64)
}

#[wasm_bindgen]
pub fn compute_legit_speed(
    legit: bool,
    randomize: bool,
    multiplier: f32,
    legit_min: f32,
    legit_max: f32,
    legit_base: f32,
) -> f32 {
    if legit {
        if randomize {
            let lo = legit_min.min(legit_max);
            let hi = legit_max.max(legit_min);
            let r = Math::random() as f32;
            lo + r * (hi - lo)
        } else {
            legit_base
        }
    } else {
        multiplier
    }
}

#[wasm_bindgen]
pub fn volume_fade_step(current_volume: f32, steps: u32) -> f32 {
    if steps == 0 { return current_volume.max(0.0); }
    let step = (current_volume / (steps as f32)).max(0.001);
    if step.is_finite() { step } else { 0.001 }
}

#[wasm_bindgen]
pub fn evaluate_low_audio_ad(avg_amp: f64, duration: f64, max_ad_duration: f64, amp_threshold: f64) -> bool {
    duration > 0.0 && duration < max_ad_duration && avg_amp < amp_threshold
}
