export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = true;
    this.initialized = false;
    this.burnerGain = null;
    this.windGain = null;
    this.windFilter = null;
    this.lastChimeTime = 0;
  }

  init() {
    if (this.initialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.0;
    this.masterGain.connect(this.ctx.destination);

    // Create looping white noise buffer (2 seconds)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // 1. Burner Whoosh Channel
    const burnerNoise = this.ctx.createBufferSource();
    burnerNoise.buffer = noiseBuffer;
    burnerNoise.loop = true;

    const burnerFilter = this.ctx.createBiquadFilter();
    burnerFilter.type = 'bandpass';
    burnerFilter.frequency.value = 340;
    burnerFilter.Q.value = 0.9;

    const burnerOsc = this.ctx.createOscillator();
    burnerOsc.type = 'sawtooth';
    burnerOsc.frequency.value = 58;

    const burnerOscGain = this.ctx.createGain();
    burnerOscGain.gain.value = 0.18;

    this.burnerGain = this.ctx.createGain();
    this.burnerGain.gain.value = 0;

    burnerNoise.connect(burnerFilter);
    burnerFilter.connect(this.burnerGain);
    burnerOsc.connect(burnerOscGain);
    burnerOscGain.connect(this.burnerGain);
    this.burnerGain.connect(this.masterGain);

    burnerNoise.start();
    burnerOsc.start();

    // 2. Velocity-Mapped Wind Channel
    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = noiseBuffer;
    windNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 260;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;

    windNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windNoise.start();

    this.initialized = true;
  }

  unlockAndUnmute() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.muted = false;
    this.masterGain.gain.setTargetAtTime(0.65, this.ctx.currentTime, 0.08);
    return !this.muted;
  }

  toggleMute() {
    if (!this.initialized) {
      return this.unlockAndUnmute();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.muted = !this.muted;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.65, this.ctx.currentTime, 0.08);
    return !this.muted;
  }

  updateFlightAudio({ isBurning, speed, altitude }) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Burner whoosh
    const targetBurner = isBurning ? 0.34 : 0.0;
    this.burnerGain.gain.setTargetAtTime(targetBurner, now, 0.06);

    // Wind rush proportional to speed and altitude
    const speedNorm = Math.min(1, speed / 18);
    const altNorm = Math.min(1, Math.max(0, altitude / 30));
    const windVol = 0.02 + speedNorm * 0.16 + altNorm * 0.04;
    const windCutoff = 220 + speedNorm * 950 + altNorm * 250;

    this.windGain.gain.setTargetAtTime(windVol, now, 0.12);
    this.windFilter.frequency.setTargetAtTime(windCutoff, now, 0.12);
  }

  playZoneChime() {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastChimeTime < 1.2) return;
    this.lastChimeTime = now;

    const freqs = [523.25, 659.25, 783.99]; // C5 - E5 - G5
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + idx * 0.065;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  }

  playClick() {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.045);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }
}
