// AudioEngine: Genau ein HTMLAudioElement für die gesamte App (Abschnitt 7)

class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    // Initialisiert erst beim ersten Nutzertipp (iOS Autoplay-Regel)
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init(): void {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
    }
  }

  public get audioElement(): HTMLAudioElement | null {
    return this.audio;
  }
}

export const audioEngine = AudioEngine.getInstance();
