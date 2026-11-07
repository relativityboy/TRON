import { stereoEmitter, doppler } from './spatial.js';
import { recognizerStarts } from '../game/recognizer-roster.js';
/** Spatial voices own their nodes; decoded samples and source tracking are borrowed. */
export class RecognizerVoices {
  constructor({ context, master, world, samples, noiseBuffer, source }) {
    Object.assign(this, { context, master, world, samples, noiseBuffer, source });
    this.voices = recognizerStarts(world).map((_, i) => this.createRecognizerVoice(i));
  }
  loadSamples() {
    this.voices.forEach((v, i) => this.loadRecognizerVoice(v, i));
  }
  createRecognizerVoice(i) {
    const c = this.context,
      emitter = stereoEmitter(c, this.master),
      filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 5800;
    filter.connect(emitter.input);
    emitter.gain.gain.value = 0;
    const flightGain = c.createGain(),
      attackGain = c.createGain();
    flightGain.connect(filter);
    attackGain.connect(filter);
    attackGain.gain.value = 0;
    const v = { ...emitter, filter, flightGain, attackGain };
    this.loadRecognizerVoice(v, i);
    return v;
  }
  loadRecognizerVoice(v, i) {
    if (this.samples['recognizer-flight'] && !v.flight) {
      v.flight = this.source(this.samples['recognizer-flight'], v.flightGain, true, i * 0.29);
    }
    if (this.samples['recognizer-approach'] && !v.attack)
      v.attack = this.source(this.samples['recognizer-approach'], v.attackGain, true, i * 0.37);
  }

  update(run, ear) {
    const now = this.context.currentTime;
    while (this.voices.length < run.recognizers.length)
      this.voices.push(this.createRecognizerVoice(this.voices.length));
    this.voices.forEach((v, i) => {
      if (!run.recognizers[i]) v.gain.gain.setTargetAtTime(0, now, 0.1);
    });
    run.recognizers.forEach((e, i) => {
      const v = this.voices[i],
        distance = Math.hypot(e.x - ear.x, e.s - ear.s, e.y - ear.y),
        present = !e.teleport && e.state !== 'destroyed' && e.state !== 'materializing';
      const clear =
        present && distance < 900 && this.world.lineOfSight({ x: e.x, s: e.s, y: e.y }, ear);
      const attacking = ['fold', 'drop', 'recover'].includes(e.state),
        mix = attacking ? 0.85 : e.state === 'pursue' ? 0.35 : 0;
      v.gain.gain.setTargetAtTime(
        present && distance < 900 ? (v.flight ? 0.65 : 0) * (clear ? 1 : 0.4) : 0,
        now,
        0.12,
      );
      v.filter.frequency.setTargetAtTime(clear ? 6500 : 550, now, 0.2);
      v.flightGain.gain.setTargetAtTime(v.attack ? 1 - mix * 0.6 : 1, now, 0.2);
      v.attackGain.gain.setTargetAtTime(mix, now, 0.2);
      const rate = doppler(e, ear) * (1 + (i % 12) * 0.009);
      v.flight?.playbackRate.setTargetAtTime(rate, now, 0.12);
      v.attack?.playbackRate.setTargetAtTime(rate * (e.state === 'drop' ? 1.08 : 1), now, 0.12);
      v.position(e.x, e.y, -e.s, e.yaw);
    });
  }
  dispose() {
    for (const v of this.voices) {
      for (const node of [v.flight, v.attack]) {
        try {
          node?.stop();
        } catch {}
        node?.disconnect();
      }
      for (const node of [
        v.filter,
        v.flightGain,
        v.attackGain,
        v.input,
        v.gain,
        ...v.panners,
      ])
        node.disconnect();
    }
    this.voices = [];
  }
}
