# Vader Vocoder PWA

A mobile-first, installable **Progressive Web App** that transforms your voice with a refined **Darth Vader** preset and a realistic, looping **mechanical breathing** bed. This update focuses on **stable live audio on mobile**, **authentic timbre**, and a clean, offline-ready PWA experience.

---

## ✨ What’s New

- **Stable live mic on mobile**  
  Requests audio with `echoCancellation`, `noiseSuppression`, and `autoGainControl` **disabled** for a clean, uninterrupted raw stream. Output is routed through a `MediaStreamDestination` into an `<audio>` element to help keep iOS audio contexts alive.
- **Improved Vader preset**  
  Deep EQ (low emphasis + strong low-pass), **heavy compression**, **gentle distortion**, **short-delay comb resonance** for helmet timbre, and a touch of convolver “room” for presence.
- **Realistic breathing**  
  Ships with a smooth, looping `assets/breathing.wav` generated to mimic Vader’s mechanical inhale/exhale (no more “static” bursts).
- **PWA polish**  
  Updated `manifest.json`, proper icons (**192/512**), and a service worker (`sw.js`) that caches the app shell and the breathing asset for offline use.

---

## 🚀 Quick Start

> Serve over **HTTPS** (or `http://localhost`) so the mic and service worker work properly.

1. **Deploy** the static files to any web host (or run a simple local server).
2. Open the app and tap **Enable Microphone & Start**, then grant mic permission.
3. Speak slowly (headphones recommended). Adjust sliders to taste.
4. **Install as a PWA**:  
   - **Android/Chrome**: “Install app” prompt or menu → *Add to Home screen*.  
   - **iOS/Safari**: Share menu → *Add to Home Screen*.

---

## 🧩 Features

- Real-time voice processing tuned for **Darth Vader**.
- Mechanical breathing bed with independent volume control.
- Latency-conscious audio graph designed for **mobile browsers**.
- Fully installable **PWA** with offline caching.

---

## 🎛️ Controls & Preset

**Preset**: `Darth Vader (enhanced)` – deep, compressed, metallic.

| Control | Default | Range | What it does |
|---|---:|:---:|---|
| Voice Volume | 1.00 | 0.00 – 1.50 | Final gain for the processed voice. |
| Breathing Volume | 0.35 | 0.00 – 1.00 | Level of the looping breathing bed. |
| Distortion Amount | 0.35 | 0.00 – 1.00 | Waveshaper drive; adds electronic grit. |
| Metallic (Comb Mix) | 0.25 | 0.00 – 1.00 | Mix of short-delay comb resonance (helmet timbre). |
| Low Cut (Hz) | 50 | 20 – 200 | High-pass to reduce low rumble/mud. |
| Low Pass (Hz) | 1700 | 500 – 4000 | Strong low-pass for Vader’s dark, chesty tone. |

**Tips for best results**
- Speak **slowly and calmly** from your chest.
- Use **headphones** to avoid feedback (echo cancellation is disabled for quality).

---

## 🔊 Audio Graph (High-Level)

```mermaid
flowchart LR
  Mic[Mic getUserMedia];
  MSrc[MediaStreamSource];
  HP[Highpass - Low Cut];
  LowKick[Peaking 120 Hz +6 dB];
  LowChest[Peaking 300 Hz +4 dB];
  Comp[Compressor - heavy];
  Shaper[Waveshaper - dist];
  LP[Lowpass ~1.7 kHz];
  Dry[Dry shaped];
  Delay[Short delay ~6 ms];
  FB[Feedback 0.18];
  CombMix[Comb mix];
  Conv[Convolver IR];
  ConvMix[Convolver mix];
  Breath[breathing.wav loop];
  BreathGain[Breath gain];
  Sum[Mix bus];
  OutGain[Voice volume];
  MSDest[MediaStreamDestination];
  HTMLAudio[Audio element (autoplay, playsinline)];

  Mic --> MSrc;
  MSrc --> HP;
  HP --> LowKick;
  LowKick --> LowChest;
  LowChest --> Comp;
  Comp --> Shaper;
  Shaper --> LP;

  LP --> Dry;
  LP --> Delay;
  Delay --> FB;
  FB --> Delay;
  Delay --> CombMix;

  LP --> Conv;
  Conv --> ConvMix;

  Dry --> Sum;
  CombMix --> Sum;
  ConvMix --> Sum;

  Breath --> BreathGain;
  BreathGain --> Sum;

  Sum --> OutGain;
  OutGain --> MSDest;
  MSDest --> HTMLAudio;
```

**Why this structure?**  
- The **comb** path adds metallic “helmet” resonance.  
- **Compressor + waveshaper** create that amplified, menacing presence.  
- A **strong low-pass** removes upper hiss to emulate the dark, chesty timbre.  
- A **subtle convolver** adds early reflections so it doesn’t sound flat.  
- The **breathing bed** is independent, so your voice never ducks or clips it.

---

## 📱 PWA & Cross-Platform Notes

- **Installability**: `manifest.json` includes the required fields and 192/512 icons.  
- **Offline**: `sw.js` caches `index.html`, `app.js`, `manifest.json`, icons, and `assets/breathing.wav`.  
- **iOS**: Must start audio in response to a **user gesture**. Background playback is limited by iOS; audio resumes when foregrounded.  
- **Bluetooth output**: On mobile, output routing to a BT speaker is controlled by the OS. Start the app **after** connecting BT.

---

## 🗂️ File Structure

```
/
├─ index.html              # UI + controls
├─ app.js                  # Web Audio graph & PWA glue
├─ sw.js                   # Service worker (offline caching)
├─ manifest.json           # PWA metadata
├─ icon-192.png            # PWA icon (192x192)
├─ icon-512.png            # PWA icon (512x512)
└─ assets/
   └─ breathing.wav        # Looping mechanical breathing bed
```

---

## 🔧 Development & Deployment

**Local dev (no build step required):**
```bash
# from project root
python3 -m http.server 5173
# then open http://localhost:5173
```

**Static hosting:**
- Upload all files as-is to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3+CF, etc.).  
- Ensure **HTTPS** so `getUserMedia` + service worker work.

---

## 🧪 Troubleshooting

- **No mic prompt / silent output**  
  Reload on **HTTPS** (or `localhost`). Tap the **Enable** button again and allow mic access. On iOS, make sure Silent Mode is **off**.
- **Feedback / howling**  
  Use **headphones**. We intentionally disable echo cancellation for quality.
- **Audio stops after backgrounding (iOS)**  
  Re-open the app; the audio context resumes. iOS limits background audio in PWAs.
- **High latency**  
  Close other audio apps/tabs. Consider reducing system audio effects. Future option: migrate heavy DSP to an **AudioWorklet**.

---

## 🛠️ Replace or Tweak the Breathing

- Replace `assets/breathing.wav` with any loop you prefer (keep a similar loudness to avoid clipping).  
- Adjust default **Breathing Volume** in the UI or set a different start value in `index.html`.

---

## 🔬 Technical Details

**Microphone constraints (for clean raw audio):**
```js
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1
  }
});
```

**Keeping audio alive on mobile:**  
- Start the **AudioContext** on a **user gesture**.  
- Route final mix to a `MediaStreamDestination` and assign it to an `<audio>` element (`autoplay` + `playsinline`) to reduce iOS suspensions.  
- Listen for `visibilitychange` and `ctx.resume()` when tab is foregrounded.

---

## 🗺️ Roadmap (Nice-to-haves)

- **AudioWorklet** port for even lower latency and heavier DSP.
- **Multi-preset system** (save/load user presets).
- **Input/output device pickers** where supported.
- **Optional band-vocoder** mode in addition to current chain.

---

## 🔒 Privacy

- Audio stays **local in the browser**. No network transmission is required for voice processing.  
- The service worker caches static assets only.

---

## 📜 Changelog (this update)

- Robust mobile chain with raw mic constraints and `<audio>` keep-alive routing.
- Vader preset rebuilt (EQ, compressor, waveshaper, comb, subtle convolver).
- Procedural mechanical breathing loop added (`assets/breathing.wav`).
- PWA manifest, icons, and service worker updated.

---

## 🙏 Acknowledgements & Notes

- Inspired by classic production tips (EQ for chest, heavy compression, subtle distortion, short comb/early reflections).  
- Not affiliated with Lucasfilm/Disney. “Darth Vader” is a character of Lucasfilm Ltd.

---

## 🧾 License

- Source code: same license as the repository’s existing `LICENSE` (unchanged).  
- `assets/breathing.wav`: generated for this project; may be used within this app. Replace with your own loop if you prefer a different sound.
