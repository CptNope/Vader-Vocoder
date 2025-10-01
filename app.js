// Vader Vocoder PWA – robust mobile chain
let ctx, micStream, mediaSource, destination, outEl;
let nodes = {};
let breathing = { buffer: null, src: null, gain: null };
let running = false;

const statusEl = document.getElementById('status');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const out = document.getElementById('out');

const sliders = {
  voiceGain: document.getElementById('voiceGain'),
  breathGain: document.getElementById('breathGain'),
  dist: document.getElementById('dist'),
  comb: document.getElementById('comb'),
  lowCut: document.getElementById('lowCut'),
  lowPass: document.getElementById('lowPass')
};

function setStatus(s) { statusEl.textContent = s; }

function makeDistortionCurve(amount = 0.3) {
  const n = 44100;
  const curve = new Float32Array(n);
  const k = amount * 50 + 1; // stronger > more clip
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); // arctan-like
  }
  return curve;
}

async function loadBreathing() {
  if (!ctx) return;
  const resp = await fetch('./assets/breathing.wav');
  const arr = await resp.arrayBuffer();
  breathing.buffer = await ctx.decodeAudioData(arr);
}

function createIR(duration = 0.08, decay = 2.0) {
  // Small room-ish IR to add presence; generated procedurally
  const rate = ctx.sampleRate;
  const length = rate * duration | 0;
  const ir = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return ir;
}

function connectGraph() {
  const voiceIn = nodes.voiceIn = ctx.createGain();
  const voiceOut = nodes.voiceOut = ctx.createGain();

  // Filters to shape "Vader" timbre
  nodes.hp = ctx.createBiquadFilter();
  nodes.hp.type = 'highpass';
  nodes.hp.frequency.value = parseFloat(sliders.lowCut.value);

  nodes.lp = ctx.createBiquadFilter();
  nodes.lp.type = 'lowpass';
  nodes.lp.frequency.value = parseFloat(sliders.lowPass.value);

  nodes.lowKick = ctx.createBiquadFilter();
  nodes.lowKick.type = 'peaking';
  nodes.lowKick.frequency.value = 120;
  nodes.lowKick.Q.value = 0.8;
  nodes.lowKick.gain.value = 6;

  nodes.lowChest = ctx.createBiquadFilter();
  nodes.lowChest.type = 'peaking';
  nodes.lowChest.frequency.value = 300;
  nodes.lowChest.Q.value = 0.9;
  nodes.lowChest.gain.value = 4;

  // Dynamics and saturation
  nodes.comp = ctx.createDynamicsCompressor();
  nodes.comp.threshold.setValueAtTime(-28, ctx.currentTime);
  nodes.comp.knee.setValueAtTime(20, ctx.currentTime);
  nodes.comp.ratio.setValueAtTime(18, ctx.currentTime);
  nodes.comp.attack.setValueAtTime(0.003, ctx.currentTime);
  nodes.comp.release.setValueAtTime(0.28, ctx.currentTime);

  nodes.shaper = ctx.createWaveShaper();
  nodes.shaper.curve = makeDistortionCurve(parseFloat(sliders.dist.value));

  // Metallic comb via short delay + feedback
  nodes.delay = ctx.createDelay(0.05);
  nodes.delay.delayTime.value = 0.006; // 6ms comb
  nodes.fb = ctx.createGain();
  nodes.fb.gain.value = 0.18; // feedback amount

  nodes.delay.connect(nodes.fb);
  nodes.fb.connect(nodes.delay);

  nodes.combMix = ctx.createGain();
  nodes.combMix.gain.value = parseFloat(sliders.comb.value);

  // Optional small reverb to add presence
  nodes.conv = ctx.createConvolver();
  nodes.conv.buffer = createIR(0.09, 2.2);
  nodes.convMix = ctx.createGain();
  nodes.convMix.gain.value = 0.12;

  // Final voice gain
  voiceOut.gain.value = parseFloat(sliders.voiceGain.value);

  // Breathing
  breathing.gain = ctx.createGain();
  breathing.gain.gain.value = parseFloat(sliders.breathGain.value);

  // Routing: mic -> hp -> lowKick -> lowChest -> comp -> shaper -> lp -> [split]
  voiceIn.connect(nodes.hp).connect(nodes.lowKick).connect(nodes.lowChest)
        .connect(nodes.comp).connect(nodes.shaper).connect(nodes.lp);

  // Split to comb path and dry path
  nodes.lp.connect(nodes.delay);
  nodes.delay.connect(nodes.combMix);
  nodes.lp.connect(nodes.conv);
  nodes.conv.connect(nodes.convMix);

  // Sum paths
  const sum = ctx.createGain();
  nodes.lp.connect(sum);         // dry shaped
  nodes.combMix.connect(sum);    // metallic
  nodes.convMix.connect(sum);    // slight reverb
  sum.connect(voiceOut);

  // Mix breathing + voice -> destination
  const finalMix = ctx.createGain();
  voiceOut.connect(finalMix);
  breathing.gain.connect(finalMix);

  // Route to a MediaStream and to actual audio output element
  destination = ctx.createMediaStreamDestination();
  finalMix.connect(destination);
  outEl.srcObject = destination.stream;
  outEl.play().catch(()=>{});
}

async function start() {
  if (running) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    outEl = document.getElementById('out');

    // MUST be user gesture; request the mic with processing OFF
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      }
    });

    mediaSource = ctx.createMediaStreamSource(micStream);
    connectGraph();
    mediaSource.connect(nodes.voiceIn);

    // Load and start breathing loop
    await loadBreathing();
    if (breathing.buffer) {
      breathing.src = ctx.createBufferSource();
      breathing.src.buffer = breathing.buffer;
      breathing.src.loop = true;
      breathing.src.connect(breathing.gain);
      breathing.src.start();
    }

    // Tie slider controls
    sliders.voiceGain.oninput = ()=> nodes.voiceOut.gain.value = parseFloat(sliders.voiceGain.value);
    sliders.breathGain.oninput = ()=> breathing.gain && (breathing.gain.gain.value = parseFloat(sliders.breathGain.value));
    sliders.dist.oninput = ()=> nodes.shaper.curve = makeDistortionCurve(parseFloat(sliders.dist.value));
    sliders.comb.oninput = ()=> nodes.combMix.gain.value = parseFloat(sliders.comb.value);
    sliders.lowCut.oninput = ()=> nodes.hp.frequency.value = parseFloat(sliders.lowCut.value);
    sliders.lowPass.oninput = ()=> nodes.lp.frequency.value = parseFloat(sliders.lowPass.value);

    // Keep context alive on iOS when tab becomes active again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && ctx.state !== 'running') ctx.resume();
    });

    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus('running');
  } catch (err) {
    console.error(err);
    setStatus('error: ' + err.message);
  }
}

function stop() {
  if (!running) return;
  try {
    if (breathing.src) { try { breathing.src.stop(0); } catch(e){} }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
    }
    if (ctx && ctx.state !== 'closed') ctx.close();
  } catch (e) {
    console.warn(e);
  }
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus('stopped');
}

startBtn.addEventListener('click', () => {
  start();
});
stopBtn.addEventListener('click', () => {
  stop();
});

// iOS unlock: ensure audio element is allowed to play on tap
document.addEventListener('click', async () => {
  if (outEl && outEl.paused) {
    try { await outEl.play(); } catch(e){}
  }
}, { once: true });
