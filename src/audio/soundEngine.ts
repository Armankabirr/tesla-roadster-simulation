/**
 * Procedural Web Audio Engine for Tesla Roadster 2026: Plaid Flight
 * 100% zero external audio file dependencies.
 * Produces electric motor inverter whine, cold-gas thruster roar, sonic booms,
 * collision scrapes, battery pickup chimes, and optional dynamic synthwave driving beat.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBeatPlaying: boolean = true;

  // Motor Inverter Audio Nodes
  private motorOsc1: OscillatorNode | null = null;
  private motorOsc2: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;

  // Thruster Rocket Nodes
  private thrusterNoiseNode: AudioBufferSourceNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;

  // Wind / Speed Rush Noise
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Master Output
  private masterGain: GainNode | null = null;

  // Police Siren Audio Nodes
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;

  // Helicopter Rotor Nodes
  private chopperOsc: OscillatorNode | null = null;
  private chopperGain: GainNode | null = null;
  private chopperFilter: BiquadFilterNode | null = null;

  // Background Synthwave Loop interval
  private beatTimer: number | null = null;
  private beatStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupMotorSynth();
      this.setupThrusterSynth();
      this.setupWindSynth();
      this.setupPursuitSynth();
      this.startSynthwaveBeat();
    } catch {
      // AudioContext not permitted or supported
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupMotorSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Dual oscillator for signature high-frequency electric hypercar inverter + gear whine
    this.motorOsc1 = this.ctx.createOscillator();
    this.motorOsc1.type = 'sawtooth';
    this.motorOsc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.motorOsc2 = this.ctx.createOscillator();
    this.motorOsc2.type = 'sine';
    this.motorOsc2.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.motorFilter = this.ctx.createBiquadFilter();
    this.motorFilter.type = 'bandpass';
    this.motorFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
    this.motorFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.motorOsc1.connect(this.motorFilter);
    this.motorOsc2.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);
    this.motorGain.connect(this.masterGain);

    this.motorOsc1.start();
    this.motorOsc2.start();
  }

  private setupThrusterSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Generate 2 seconds of pink/white noise buffer for rocket combustion
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.1) * 0.4;
    }

    this.thrusterNoiseNode = this.ctx.createBufferSource();
    this.thrusterNoiseNode.buffer = noiseBuffer;
    this.thrusterNoiseNode.loop = true;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'lowpass';
    this.thrusterFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.thrusterFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.thrusterNoiseNode.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.masterGain);

    this.thrusterNoiseNode.start();
  }

  private setupWindSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    windSource.start();
  }

  private setupPursuitSynth() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Police Dual-Tone Wail/Yelp Siren
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(750, this.ctx.currentTime);

    this.sirenLfo = this.ctx.createOscillator();
    this.sirenLfo.type = 'sine';
    this.sirenLfo.frequency.setValueAtTime(0.65, this.ctx.currentTime); // Wail cycle rate

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime); // Pitch swing ±220 Hz
    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    const sirenFilter = this.ctx.createBiquadFilter();
    sirenFilter.type = 'lowpass';
    sirenFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.sirenOsc.connect(sirenFilter);
    sirenFilter.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);

    this.sirenOsc.start();
    this.sirenLfo.start();

    // 2. Helicopter Rotor Chop (low-frequency throb)
    this.chopperOsc = this.ctx.createOscillator();
    this.chopperOsc.type = 'square';
    this.chopperOsc.frequency.setValueAtTime(19, this.ctx.currentTime); // 19 Hz blade chop

    this.chopperFilter = this.ctx.createBiquadFilter();
    this.chopperFilter.type = 'lowpass';
    this.chopperFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

    this.chopperGain = this.ctx.createGain();
    this.chopperGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.chopperOsc.connect(this.chopperFilter);
    this.chopperFilter.connect(this.chopperGain);
    this.chopperGain.connect(this.masterGain);

    this.chopperOsc.start();
  }

  public updatePursuitAudio(closestPoliceDistance: number, helicopterDistance: number) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Siren volume based on proximity (under 75 meters)
    if (this.sirenGain) {
      let sirenVol = 0;
      if (closestPoliceDistance < 80) {
        sirenVol = Math.max(0, 0.22 * (1 - closestPoliceDistance / 80));
      }
      this.sirenGain.gain.setTargetAtTime(sirenVol, t, 0.1);
    }

    // Chopper rotor thrum based on proximity (under 120 meters)
    if (this.chopperGain) {
      let chopVol = 0;
      if (helicopterDistance < 120) {
        chopVol = Math.max(0, 0.28 * (1 - helicopterDistance / 120));
      }
      this.chopperGain.gain.setTargetAtTime(chopVol, t, 0.1);
    }
  }

  public updateTelemetry(speedMph: number, isAccelerating: boolean, isThrusterActive: boolean, isDrifting: boolean) {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const speedRatio = Math.min(speedMph / 250, 1.5);

    // Motor Inverter Pitch & Volume
    if (this.motorOsc1 && this.motorOsc2 && this.motorGain && this.motorFilter) {
      const baseFreq = 70 + speedRatio * 850;
      this.motorOsc1.frequency.setTargetAtTime(baseFreq, t, 0.05);
      this.motorOsc2.frequency.setTargetAtTime(baseFreq * 2.5, t, 0.05);
      this.motorFilter.frequency.setTargetAtTime(300 + speedRatio * 2200, t, 0.08);

      const targetGain = isAccelerating ? 0.08 + speedRatio * 0.22 : speedRatio * 0.08;
      this.motorGain.gain.setTargetAtTime(targetGain, t, 0.05);
    }

    // Wind Rush
    if (this.windGain && this.windFilter) {
      const windTargetGain = Math.max(0, (speedRatio - 0.2) * 0.35);
      this.windGain.gain.setTargetAtTime(windTargetGain, t, 0.1);
      this.windFilter.frequency.setTargetAtTime(200 + speedRatio * 1800, t, 0.1);
    }

    // SpaceX Cold-Gas Thrusters
    if (this.thrusterGain && this.thrusterFilter) {
      if (isThrusterActive) {
        this.thrusterGain.gain.setTargetAtTime(0.45, t, 0.03);
        this.thrusterFilter.frequency.setTargetAtTime(2800, t, 0.05);
      } else {
        this.thrusterGain.gain.setTargetAtTime(0.0, t, 0.06);
      }
    }

    // Drift / Tire Squeal
    if (isDrifting && speedMph > 35) {
      this.playTireSqueal();
    }
  }

  private lastTireSquealTime = 0;
  private playTireSqueal() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = performance.now();
    if (now - this.lastTireSquealTime < 350) return;
    this.lastTireSquealTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.Q.setValueAtTime(6.0, t);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Collectible Battery Powerup Sound
  public playBatteryPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      gain.gain.setValueAtTime(0.18, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.21);
    });
  }

  // SpaceX Thruster Canister Pickup Sound
  public playRocketPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.2);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Sonic Boom / Plaid Warp Thump
  public playSonicBoom() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Crash / Impact Sound
  public playCrash() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Launch countdown beep
  public playCountdownBeep(high: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(high ? 880 : 440, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (high ? 0.4 : 0.15));
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + (high ? 0.42 : 0.16));
  }

  // Dynamic Synthwave Driving Beat
  private startSynthwaveBeat() {
    if (this.beatTimer) clearInterval(this.beatTimer);

    // 124 BPM 16th-note step sequencer
    const stepIntervalMs = (60 / 124 / 4) * 1000;
    const bassNotes = [55, 55, 55, 65.41, 55, 55, 73.42, 65.41]; // A1, C2, D2, etc.

    this.beatTimer = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.isMuted || !this.isBeatPlaying) return;
      const t = this.ctx.currentTime;
      const step = this.beatStep % 16;

      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(120, t);
        kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        kickGain.gain.setValueAtTime(0.28, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.13);
      }

      // Snare / Clap on 4, 12
      if (step === 4 || step === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, t);
        snareGain.gain.setValueAtTime(0.12, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        snareOsc.connect(snareGain);
        snareGain.connect(this.masterGain);
        snareOsc.start(t);
        snareOsc.stop(t + 0.11);
      }

      // Synth Bass rolling on 8th notes
      if (step % 2 === 0) {
        const noteIdx = Math.floor(this.beatStep / 2) % bassNotes.length;
        const freq = bassNotes[noteIdx];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilt = this.ctx.createBiquadFilter();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq, t);
        bassFilt.type = 'lowpass';
        bassFilt.frequency.setValueAtTime(380, t);
        bassGain.gain.setValueAtTime(0.07, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        bassOsc.connect(bassFilt);
        bassFilt.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.16);
      }

      this.beatStep++;
    }, stepIntervalMs);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isBeatPlaying = !this.isBeatPlaying;
    return this.isBeatPlaying;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getMusicPlaying(): boolean {
    return this.isBeatPlaying;
  }

  public dispose() {
    if (this.beatTimer) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const sound = new SoundEngine();
