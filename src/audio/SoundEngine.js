function makeExhaustDistortionCurve(amount = 24) {
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * (1 + amount * 0.12));
  }
  return curve;
}

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = true;
    this.initialized = false;
    this.lastSpeed = 0;
  }

  init() {
    if (this.initialized) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    // Exhaust waveshaper + resonant throat filter + dynamic lowpass filter
    this.shaper = this.ctx.createWaveShaper();
    this.shaper.curve = makeExhaustDistortionCurve(28);
    this.shaper.oversample = '2x';

    this.throatFilter = this.ctx.createBiquadFilter();
    this.throatFilter.type = 'peaking';
    this.throatFilter.frequency.value = 145;
    this.throatFilter.Q.value = 2.2;
    this.throatFilter.gain.value = 7.5;

    this.engFilter = this.ctx.createBiquadFilter();
    this.engFilter.type = 'lowpass';
    this.engFilter.frequency.value = 220;
    this.engFilter.Q.value = 3.2;

    this.engGain = this.ctx.createGain();
    this.engGain.gain.value = 0.11;

    // 1. Sub-bass cylinder pulse (0.5x fundamental)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'triangle';
    this.subOsc.frequency.value = 27;
    this.subGain = this.ctx.createGain();
    this.subGain.gain.value = 0.55;
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.shaper);

    // 2. Primary exhaust bank sawtooth (1.0x fundamental)
    this.engOsc1 = this.ctx.createOscillator();
    this.engOsc1.type = 'sawtooth';
    this.engOsc1.frequency.value = 54;
    this.osc1Gain = this.ctx.createGain();
    this.osc1Gain.gain.value = 0.45;
    this.engOsc1.connect(this.osc1Gain);
    this.osc1Gain.connect(this.shaper);

    // 3. Cross-plane V8/V10 growl harmonic (1.5x fifth interval + detune)
    this.engOsc2 = this.ctx.createOscillator();
    this.engOsc2.type = 'sawtooth';
    this.engOsc2.frequency.value = 81;
    this.engOsc2.detune.value = 9;
    this.osc2Gain = this.ctx.createGain();
    this.osc2Gain.gain.value = 0.34;
    this.engOsc2.connect(this.osc2Gain);
    this.osc2Gain.connect(this.shaper);

    // 4. High-RPM induction snarl (2.0x octave square)
    this.indOsc = this.ctx.createOscillator();
    this.indOsc.type = 'square';
    this.indOsc.frequency.value = 108;
    this.engOsc2.detune.value = -7;
    this.indGain = this.ctx.createGain();
    this.indGain.gain.value = 0.12;
    this.indOsc.connect(this.indGain);
    this.indGain.connect(this.shaper);

    // 5. Cylinder-firing rumble LFO modulating filter cutoff & amplitude lope
    this.rumbleOsc = this.ctx.createOscillator();
    this.rumbleOsc.type = 'sine';
    this.rumbleOsc.frequency.value = 15;
    this.rumbleFilterGain = this.ctx.createGain();
    this.rumbleFilterGain.gain.value = 42;
    this.rumbleOsc.connect(this.rumbleFilterGain);
    this.rumbleFilterGain.connect(this.engFilter.frequency);

    // 6. Subtle Turbocharger Spool Whistle
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.value = 950;
    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.value = 0.001;
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);

    this.shaper.connect(this.throatFilter);
    this.throatFilter.connect(this.engFilter);
    this.engFilter.connect(this.engGain);
    this.engGain.connect(this.masterGain);

    this.subOsc.start();
    this.engOsc1.start();
    this.engOsc2.start();
    this.indOsc.start();
    this.rumbleOsc.start();
    this.turboOsc.start();
    this.initialized = true;
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime, 0.08);
    }
    return !this.muted;
  }

  updateEngine(speed, boosting) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Simulate 6-speed gearbox RPM curve + overall velocity pitch
    const gearSpan = 14.5;
    const gearIdx = Math.min(5, Math.floor(speed / gearSpan));
    const gearInSpeed = speed - gearIdx * gearSpan;
    const gearRpmFrac = Math.min(1, gearInSpeed / gearSpan);
    const totalSpeedFrac = Math.min(1, speed / 76);

    // Base fundamental Hz: 44 Hz deep V8 idle -> 185 Hz redline scream
    const baseHz = 44 + gearRpmFrac * 62 + totalSpeedFrac * 72 + (boosting ? 26 : 0);

    this.subOsc.frequency.setTargetAtTime(baseHz * 0.5, now, 0.045);
    this.engOsc1.frequency.setTargetAtTime(baseHz, now, 0.045);
    this.engOsc2.frequency.setTargetAtTime(baseHz * 1.498, now, 0.045);
    this.indOsc.frequency.setTargetAtTime(baseHz * 2.0, now, 0.045);

    // Rumble LFO speeds up from 14 Hz cammed idle lope to 58 Hz high-RPM firing pulse
    this.rumbleOsc.frequency.setTargetAtTime(14 + totalSpeedFrac * 44, now, 0.06);
    this.rumbleFilterGain.gain.setTargetAtTime(36 + totalSpeedFrac * 95 + (boosting ? 45 : 0), now, 0.06);

    // Open up exhaust filter cutoff under throttle & high RPM
    const filterHz = 195 + gearRpmFrac * 340 + totalSpeedFrac * 460 + (boosting ? 280 : 0);
    this.engFilter.frequency.setTargetAtTime(filterHz, now, 0.05);
    this.throatFilter.frequency.setTargetAtTime(115 + baseHz * 1.35, now, 0.06);

    // Induction snarl swells at upper RPM
    this.indGain.gain.setTargetAtTime(0.08 + gearRpmFrac * 0.16 + (boosting ? 0.08 : 0), now, 0.06);
    this.engGain.gain.setTargetAtTime(0.085 + Math.min(0.16, speed * 0.0024) + (boosting ? 0.04 : 0), now, 0.06);

    // Subtle turbocharger spool whine
    const turboPitch = 980 + totalSpeedFrac * 1450 + (boosting ? 480 : 0);
    const turboVol = boosting ? 0.022 : Math.max(0.001, totalSpeedFrac * 0.01);
    this.turboOsc.frequency.setTargetAtTime(turboPitch, now, 0.08);
    this.turboGain.gain.setTargetAtTime(turboVol, now, 0.08);

    this.lastSpeed = speed;
  }

  playChime() {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, now + i * 0.055);
      g.gain.exponentialRampToValueAtTime(0.09, now + i * 0.055 + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.4);
      o.connect(g);
      g.connect(this.masterGain);
      o.start(now + i * 0.055);
      o.stop(now + i * 0.055 + 0.42);
    });
  }

  playImpact(strength = 1) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(125, now);
    o.frequency.exponentialRampToValueAtTime(34, now + 0.18);
    g.gain.setValueAtTime(Math.min(0.26, 0.09 * strength), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    o.connect(g);
    g.connect(this.masterGain);
    o.start(now);
    o.stop(now + 0.21);
  }
}
