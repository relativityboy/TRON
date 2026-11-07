// Procedural approximation informed by windowed FFT of Recognizer_sfx.mp4.
// No soundtrack samples are embedded. Generate once per context, not per aircraft.
export const RECOGNIZER_SYNTH = Object.freeze({
  sampleRateHz: 24000, loopSeconds: 12,
  flightLevel: 0.65, ambienceLevel: 0.18, ambienceLowpassHz: 650,
  loopCrossfadeSeconds: 0.08, flangeBaseSeconds: 0.0015,
  flangeDepthSeconds: 0.001, flangeMix: 0.2,
  // FFT: broad moving fundamentals, strong second register, weak upper partials.
  carriersHz: Object.freeze([43, 38, 50]),
  carrierLevels: Object.freeze([1, 0.8, 0.55]),
  sweepDepthHz: Object.freeze([12, 8, 10]),
  sweepRatesHz: Object.freeze([1 / 12, 1 / 6, 1 / 12]),
  approachUpperPartialGain: 1.25,
  harmonicLevels: Object.freeze([1, 0.94, 0.5, 0.25, 0.15, 0.1, 0.08, 0.06, 0.04, 0.03]),
  ambienceTonesHz: Object.freeze([35, 44, 59, 67, 73, 83, 99]),
  ambienceToneLevels: Object.freeze([1, 0.95, 0.65, 0.8, 0.6, 0.55, 0.25]),
});

export function recognizerSynthChannels(kind = 'flight', sampleRate = RECOGNIZER_SYNTH.sampleRateHz) {
  if (!['flight', 'approach', 'ambience'].includes(kind)) throw new Error('Unknown synth layer');
  const cfg = RECOGNIZER_SYNTH, n = Math.round(sampleRate * cfg.loopSeconds);
  const ambient = kind === 'ambience', attack = kind === 'approach';
  // A small periodic wavetable keeps extra measured partials cheap at startup.
  const tableSize = 4096;
  const wave = Float64Array.from({length: tableSize}, (_, i) =>
    cfg.harmonicLevels.reduce((sum, level, h) =>
      sum + level * (attack && h > 1 ? cfg.approachUpperPartialGain : 1) *
      Math.sin(2 * Math.PI * i / tableSize * (h + 1)), 0));
  const channels = [];
  for (let channel = 0; channel < 2; channel++) {
    const output = new Float32Array(n), dry = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate, phase = 2 * Math.PI * t;
      const stereoPhase = channel * 0.12;
      if (ambient) {
        // Quiet-window peak locations, not a claim of an isolated ambience stem.
        let bed = 0;
        cfg.ambienceTonesHz.forEach((frequency, voice) => {
          const rate = (1 + voice % 3) / cfg.loopSeconds;
          const drift = 0.9 / rate * Math.sin(phase * rate + voice);
          const swell = 0.8 + 0.2 * Math.sin(phase / 6 + voice);
          bed += cfg.ambienceToneLevels[voice] * swell *
            Math.sin(phase * frequency + drift + voice + stereoPhase * (voice + 1));
        });
        dry[i] = bed * 0.045;
      } else {
        let tone = 0;
        cfg.carriersHz.forEach((frequency, voice) => {
          const rate = cfg.sweepRatesHz[voice], depth = cfg.sweepDepthHz[voice];
          // Integrate the frequency sweep into phase; do not multiply time by a changing pitch.
          const sweep = depth / rate * Math.sin(phase * rate + voice * 2);
          const flutter = 1.2 / 0.5 * Math.sin(phase * 0.5 + voice);
          const carrier = phase * frequency + sweep + flutter + stereoPhase * (voice + 1);
          const swell = 0.8 + 0.2 * Math.sin(phase / 6 + voice * 2);
          const at = ((carrier / (2 * Math.PI) % 1 + 1) % 1) * tableSize;
          const index = Math.floor(at), mix = at - index;
          const partials = wave[index] * (1 - mix) + wave[(index + 1) % tableSize] * mix;
          tone += cfg.carrierLevels[voice] * swell * partials;
        });
        // Approach grows brighter, rather than the former unrelated 25% pitch jump.
        dry[i] = tone * (attack ? 0.078 : 0.07);
      }
    }
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const delay = sampleRate * (cfg.flangeBaseSeconds + cfg.flangeDepthSeconds *
        Math.sin(2 * Math.PI * t / cfg.loopSeconds + channel * 0.6));
      const at = (i - delay + n) % n, index = Math.floor(at), fraction = at - index;
      const delayed = dry[index] * (1 - fraction) + dry[(index + 1) % n] * fraction;
      output[i] = Math.tanh(dry[i] + (ambient ? 0 : cfg.flangeMix) * delayed) * 0.65;
    }
    // Fade the last short region into the signal immediately preceding loop start.
    const fade = Math.round(sampleRate * cfg.loopCrossfadeSeconds);
    for (let i = 0; i < fade; i++) {
      const mix = 0.5 - 0.5 * Math.cos(Math.PI * i / (fade - 1));
      output[n - fade + i] = output[n - fade + i] * (1 - mix) + output[i] * mix;
    }
    // End at the first sample to avoid a step on wrap.
    const end = output[n - 1], correction = output[0] - end;
    for (let i = 0; i < fade; i++) output[n - fade + i] += correction * i / (fade - 1);
    channels.push(output);
  }
  return channels;
}

const cache = new WeakMap();
export function recognizerSynthBuffer(context, kind = 'flight') {
  let buffers = cache.get(context);
  if (!buffers) cache.set(context, buffers = new Map());
  if (!buffers.has(kind)) {
    const channels = recognizerSynthChannels(kind);
    const buffer = context.createBuffer(2, channels[0].length, RECOGNIZER_SYNTH.sampleRateHz);
    channels.forEach((data, i) => buffer.copyToChannel(data, i));
    buffers.set(kind, buffer);
  }
  return buffers.get(kind);
}

export function createGridAmbience(context, destination, source) {
  const gain = context.createGain(), filter = context.createBiquadFilter();
  gain.gain.value = RECOGNIZER_SYNTH.ambienceLevel;
  filter.type = 'lowpass'; filter.frequency.value = RECOGNIZER_SYNTH.ambienceLowpassHz;
  filter.connect(gain); gain.connect(destination);
  const voice = source(recognizerSynthBuffer(context, 'ambience'), filter, true);
  return { dispose() { voice.stop(); voice.disconnect(); filter.disconnect(); gain.disconnect(); } };
}
