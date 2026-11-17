export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    this.engOsc = this.ctx.createOscillator();
    this.engOsc.type = 'sawtooth';
    this.engOsc.frequency.value = 55;
    this.engFilter = this.ctx.createBiquadFilter();
    this.engFilter.type = 'lowpass';
    this.engFilter.frequency.value = 240;
    this.engGain = this.ctx.createGain();
    this.engGain.gain.value = 0.08;
    this.engOsc.connect(this.engFilter);
    this.engFilter.connect(this.engGain);
    this.engGain.connect(this.masterGain);
    this.engOsc.start();
    this.initialized = true;
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.4, this.ctx.currentTime, 0.08);
    }
    return !this.muted;
  }

  updateEngine(speed, boosting) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.engOsc.frequency.setTargetAtTime(50 + Math.min(145, speed * 3.2) + (boosting ? 35 : 0), now, 0.06);
    this.engGain.gain.setTargetAtTime(0.05 + Math.min(0.14, speed * 0.004), now, 0.08);
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
    o.frequency.setValueAtTime(110, now);
    o.frequency.exponentialRampToValueAtTime(38, now + 0.16);
    g.gain.setValueAtTime(Math.min(0.22, 0.08 * strength), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    o.connect(g);
    g.connect(this.masterGain);
    o.start(now);
    o.stop(now + 0.19);
  }
}
