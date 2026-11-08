/**
 * Web Audio API procedural synthesizer for Night Market Sharpshooter
 * 100% self-contained with zero external asset dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(muted ? 0 : 0.2, this.ctx.currentTime);
    }
  }

  public getMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  /**
   * Gunshot sounds tailored to weapon type
   */
  public playShot(weapon: 'cork' | 'bb' | 'slingshot' | 'golden_rifle') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    if (weapon === 'cork') {
      // Cork gun: distinctive "THWUMP-POP!"
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

      // Noise burst for the cork pop
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
      noise.start(t);
    } else if (weapon === 'bb') {
      // BB gun: sharp metallic snappy click and pneumatic hiss
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.06);
    } else if (weapon === 'slingshot') {
      // Slingshot: rubber stretch twang + release thwack
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.linearRampToValueAtTime(550, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.18);

      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } else {
      // Golden rifle: powerful laser-like metallic blast
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    }
  }

  /**
   * Balloon explosion: snappy pop + resonant air release
   */
  public playBalloonPop(isSpecial = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = isSpecial ? 650 : 440;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    // Add brief pink noise for the latex burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
    noise.start(t);
  }

  /**
   * Metal can topple: high-pitched clang with metallic overtones
   */
  public playCanHit(pitchFactor = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const freqs = [587 * pitchFactor, 880 * pitchFactor, 1396 * pitchFactor];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      const duration = 0.15 + idx * 0.05;
      gain.gain.setValueAtTime(0.2 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + duration);
    });
  }

  /**
   * Duck squeak / quack
   */
  public playDuckHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1100, t + 0.04);
    osc.frequency.linearRampToValueAtTime(650, t + 0.12);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Reload mechanical action sound
   */
  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // First slide click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(900, t);
    osc1.frequency.exponentialRampToValueAtTime(300, t + 0.06);
    gain1.gain.setValueAtTime(0.4, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    // Second lock snap
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(600, t + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.18);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.5, t + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc1.start(t);
    osc1.stop(t + 0.08);
    osc2.start(t + 0.12);
    osc2.stop(t + 0.23);
  }

  /**
   * Empty chamber dry fire click
   */
  public playDryFire() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.03);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Combo fanfare: Ascending pentatonic notes
   */
  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
    const noteIndex = Math.min(comboCount - 1, pentatonic.length - 1);
    const freq = pentatonic[Math.max(0, noteIndex)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Prize unlocked or high score celebratory jingle
   */
  public playJackpot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const melody = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    melody.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /**
   * Background Music: Taiwanese Night Market Carnival Melody
   * Uses gentle 8-bit pentatonic marimba style chords and rhythm
   */
  public startBgm() {
    this.initCtx();
    if (this.bgmInterval) return;

    // Pentatonic scale in G major (cheerful Taiwanese carnival style)
    const notes = [
      392.0, 440.0, 493.88, 587.33, 659.25, 783.99, // G4, A4, B4, D5, E5, G5
    ];
    // 16-step melody loop
    const sequence = [
      0, 2, 3, 5, 3, 2, 1, 0,
      3, 5, 4, 3, 5, 3, 2, 0
    ];
    const bassSeq = [
      196.0, 196.0, 146.83, 146.83, 220.0, 220.0, 196.0, 196.0
    ];

    this.bgmStep = 0;
    this.bgmInterval = window.setInterval(() => {
      if (this.isMusicMuted || !this.ctx || !this.musicGain) return;

      const t = this.ctx.currentTime;
      const noteIdx = sequence[this.bgmStep % sequence.length];
      const freq = notes[noteIdx];

      // Lead note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.17);

      // Bass note on even steps
      if (this.bgmStep % 2 === 0) {
        const bassFreq = bassSeq[(this.bgmStep / 2) % bassSeq.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassGain.gain.setValueAtTime(0.15, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.29);
      }

      this.bgmStep++;
    }, 180);
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundEngine();
