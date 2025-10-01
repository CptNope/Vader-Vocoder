# Vader Vocoder PWA (Updated)

This build focuses on **robust live audio on mobile**, a much more authentic **Darth Vader voice preset**, and a realistic, looping **mechanical breathing** bed. It remains a fully installable **PWA**.

## What’s new
- **Stable live mic** on mobile: disables echo cancellation / AGC / noise suppression, routes through a `MediaStreamDestination` and HTMLAudio element to keep iOS Safari alive.
- **Vader preset**: deep EQ (low emphasis + low-pass), heavy compression, gentle distortion, metallic comb resonance, light early reflection (convolver).
- **Breathing**: included `assets/breathing.wav` (procedural) loops smoothly under the voice.
- **PWA**: updated `manifest.json`, icons (192/512), `sw.js` caches assets for offline and installability.

## Use
Serve over **HTTPS** (or `localhost`) for mic & service worker. Then:
1. Open the page, click **Enable Microphone & Start**, allow mic.
2. Speak slowly with headphones. Adjust sliders for taste.
3. Install to home screen if desired (Chrome/Android prompt; iOS use “Add to Home Screen”).

## Files
- `index.html`, `app.js`: UI and audio graph.
- `assets/breathing.wav`: Vader‑style breathing loop (generated programmatically).
- `manifest.json`, `icon-192.png`, `icon-512.png`: PWA metadata.
- `sw.js`: offline cache.

## Notes
- Headphones strongly recommended. With echo cancellation disabled, speaker+mic can feedback.
- If audio stops after backgrounding on iOS, bring app to foreground; it will resume.
- For even lower latency/heavier DSP, consider migrating parts to an **AudioWorklet** later.

May the Force be with you.
