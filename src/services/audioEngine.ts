/**
 * High-fidelity Web Audio API engine
 * Generates synthesized harmonic chords and rhythmic textures for instant playback demo,
 * connects to an AnalyserNode for live visualizer waveforms, and handles volume/seek/pitch.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSourceNodes: (OscillatorNode | AudioNode)[] = [];
  private audioElement: HTMLAudioElement | null = null;
  private isRunning: boolean = false;
  private tempoTimer: number | null = null;
  private trackStartTime: number = 0;
  private pauseOffset: number = 0;
  private currentPreset: string = 'ambient';
  private playbackRate: number = 1.0;
  private isUsingRealAudio: boolean = false;
  private currentVolume: number = 0.8;
  private isMuted: boolean = false;
  private endedCallback: (() => void) | null = null;
  private simulatedPhase: number = 0;

  private initContext() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      } catch (e) {
        console.warn('AudioContext initialization deferred:', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEndedCallback(cb: () => void) {
    this.endedCallback = cb;
  }

  public setVolume(volume: number, isMuted: boolean = false) {
    this.currentVolume = volume;
    this.isMuted = isMuted;
    const target = isMuted ? 0 : Math.max(0, Math.min(1, volume));

    if (this.audioElement) {
      try {
        this.audioElement.volume = target;
      } catch {
        // ignore
      }
    }

    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(target * 0.4, this.ctx.currentTime, 0.05);
      } catch {
        // ignore
      }
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.audioElement) {
      try {
        this.audioElement.playbackRate = rate;
      } catch {
        // ignore
      }
    }
  }

  public getCurrentTime(): number {
    if (this.isUsingRealAudio && this.audioElement) {
      return this.audioElement.currentTime || this.pauseOffset;
    }
    return this.pauseOffset;
  }

  public play(preset: string = 'ambient', startOffset: number = 0, volume: number = 0.8, streamUrl?: string) {
    this.initContext();
    this.stopSynthesizer();

    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }
    }

    this.currentPreset = preset;
    this.pauseOffset = startOffset;
    if (this.ctx) {
      this.trackStartTime = this.ctx.currentTime - startOffset;
    }
    this.isRunning = true;
    this.setVolume(volume, this.isMuted);

    // If a valid real audio source is available (blob URL or valid remote audio stream)
    const isRealAudioUrl = Boolean(
      streamUrl &&
      streamUrl.trim().length > 0 &&
      (streamUrl.startsWith('blob:') || (streamUrl.startsWith('http') && !streamUrl.includes('/mock/')))
    );

    if (isRealAudioUrl && streamUrl) {
      this.isUsingRealAudio = true;
      this.stopSynthesizer();
      try {
        if (!this.audioElement) {
          this.audioElement = new Audio();
          this.audioElement.preload = 'auto';
          this.audioElement.crossOrigin = 'anonymous';
          this.audioElement.onended = () => {
            this.isRunning = false;
            if (this.endedCallback) {
              this.endedCallback();
            }
          };
        }

        this.audioElement.onerror = () => {
          console.warn('Playback of audio stream encountered an error, falling back to harmonic synthesizer:', streamUrl);
          this.isUsingRealAudio = false;
          if (this.isRunning) {
            this.startMusicalLoop(preset);
          }
        };

        if (this.audioElement.src !== streamUrl) {
          this.audioElement.src = streamUrl;
        }
        this.audioElement.playbackRate = this.playbackRate;
        this.audioElement.volume = this.isMuted ? 0 : Math.max(0, Math.min(1, this.currentVolume));

        try {
          this.audioElement.currentTime = startOffset;
        } catch {
          this.audioElement.oncanplay = () => {
            if (this.audioElement) {
              this.audioElement.currentTime = startOffset;
              this.audioElement.oncanplay = null;
            }
          };
        }

        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Playback of audio stream was blocked by browser policy or network, falling back to synthesizer:', err);
            this.isUsingRealAudio = false;
            if (this.isRunning) {
              this.startMusicalLoop(preset);
            }
          });
        }
      } catch (e) {
        console.warn('Error starting direct audio playback, falling back to synthesizer:', e);
        this.isUsingRealAudio = false;
        this.startMusicalLoop(preset);
      }
    } else {
      this.isUsingRealAudio = false;
      if (this.audioElement) {
        try {
          this.audioElement.pause();
        } catch {
          // ignore
        }
      }
      this.startMusicalLoop(preset);
    }
  }

  public pause(currentTime: number) {
    this.pauseOffset = currentTime;
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }
    }
    this.stopSynthesizer();
    this.isRunning = false;
  }

  public seek(newTime: number) {
    this.pauseOffset = newTime;
    if (this.isUsingRealAudio && this.audioElement) {
      try {
        this.audioElement.currentTime = newTime;
      } catch {
        // ignore
      }
    }
    if (this.isRunning && this.ctx) {
      this.trackStartTime = this.ctx.currentTime - newTime;
    }
  }

  private stopSynthesizer() {
    if (this.tempoTimer) {
      clearInterval(this.tempoTimer);
      this.tempoTimer = null;
    }
    this.currentSourceNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore already stopped nodes
      }
    });
    this.currentSourceNodes = [];
  }

  private startMusicalLoop(preset: string) {
    if (!this.ctx || !this.masterGain) return;

    // Presets with pleasant root chords (A minor, C major, F# minor, etc.)
    const chordFrequencies: Record<string, number[][]> = {
      ambient: [
        [220.0, 261.63, 329.63, 392.0], // Am7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [196.0, 246.94, 293.66, 392.0], // G
        [164.81, 196.0, 246.94, 329.63], // Em7
      ],
      synthwave: [
        [146.83, 220.0, 293.66, 369.99], // Dm9
        [110.0, 164.81, 220.0, 277.18],  // A
        [130.81, 196.0, 261.63, 329.63], // C
        [123.47, 185.0, 246.94, 311.13], // Bm
      ],
      chillhop: [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [196.0, 246.94, 349.23, 392.0],  // G7
      ],
      piano: [
        [261.63, 329.63, 392.0, 523.25],
        [220.0, 277.18, 329.63, 440.0],
        [174.61, 220.0, 261.63, 349.23],
        [196.0, 246.94, 293.66, 392.0],
      ],
      deepbass: [
        [55.0, 110.0, 164.81, 220.0],
        [65.41, 130.81, 196.0, 261.63],
        [43.65, 87.31, 130.81, 174.61],
        [49.0, 98.0, 146.83, 196.0],
      ],
    };

    const chords = chordFrequencies[preset] || chordFrequencies.ambient;
    let chordIndex = 0;

    const playChordStep = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      // Create warm drone oscillators
      currentChord.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : i === 1 ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq * this.playbackRate, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + i * 200, this.ctx.currentTime);

        const noteDuration = (3.5 / this.playbackRate);
        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05 / (i + 1), this.ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + noteDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + noteDuration);

        this.currentSourceNodes.push(osc, gain);
      });
    };

    playChordStep();
    const intervalMs = Math.round(3000 / this.playbackRate);
    this.tempoTimer = window.setInterval(playChordStep, intervalMs);
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser && !this.isUsingRealAudio) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray;
    }

    // Dynamic lively visualizer spectrum for streaming audio
    const bins = 32;
    const dataArray = new Uint8Array(bins);
    if (!this.isRunning) {
      return dataArray;
    }

    this.simulatedPhase += 0.18 * this.playbackRate;
    const volumeMultiplier = this.isMuted ? 0 : this.currentVolume;

    for (let i = 0; i < bins; i++) {
      const wave1 = Math.sin(this.simulatedPhase + i * 0.45);
      const wave2 = Math.cos(this.simulatedPhase * 1.6 + i * 0.75);
      const wave3 = Math.sin(this.simulatedPhase * 0.9 - i * 0.35);
      const combined = Math.abs(wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
      const frequencyWeight = 1 - (i / bins) * 0.35;
      dataArray[i] = Math.floor(combined * 220 * volumeMultiplier * frequencyWeight + 20);
    }

    return dataArray;
  }
}

export const audioEngine = new AudioEngine();
