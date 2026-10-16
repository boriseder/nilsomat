import type { Item, Track } from '../types';
import { sleepTimer, type SleepTimerDuration } from './SleepTimer';

export interface PlayerState {
  currentItem: Item | null;
  currentTrack: Track | null;
  tracks: Track[];
  trackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  sleepTimerDuration: SleepTimerDuration;
}

type StateListener = (state: PlayerState) => void;

class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audio: HTMLAudioElement | null = null;

  private currentItem: Item | null = null;
  private currentTrack: Track | null = null;
  private playlist: Track[] = [];
  private trackIndex: number = 0;

  private isPlaying: boolean = false;
  private isLoading: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private sleepTimerDuration: SleepTimerDuration = null;

  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<StateListener> = new Set();
  private retryCount: number = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    sleepTimer.setCallback(() => {
      this.pause();
      this.sleepTimerDuration = null;
      this.notify();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.saveCurrentProgress());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.saveCurrentProgress();
        } else {
          this.syncAudioState();
        }
      });
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  public getState(): PlayerState {
    return {
      currentItem: this.currentItem,
      currentTrack: this.currentTrack,
      tracks: this.playlist,
      trackIndex: this.trackIndex,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      isLoading: this.isLoading,
      sleepTimerDuration: this.sleepTimerDuration
    };
  }

  public init(): void {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.isLoading = false;
      this.startProgressTimer();
      this.updateMediaSession();
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.stopProgressTimer();
      this.saveCurrentProgress();
      this.updateMediaSession();
      this.notify();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.currentTime = this.audio.currentTime;
        this.updateMediaSessionPosition();
        this.notify();
      }
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio && Number.isFinite(this.audio.duration)) {
        this.duration = this.audio.duration;
        this.notify();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.saveCurrentProgress(true);
      this.next();
    });

    this.audio.addEventListener('waiting', () => {
      this.isLoading = true;
      this.notify();
    });

    this.audio.addEventListener('playing', () => {
      this.isLoading = false;
      this.retryCount = 0;
      this.notify();
    });

    this.audio.addEventListener('error', () => {
      this.handlePlaybackError();
    });

    this.setupMediaSessionHandlers();
  }

  private handlePlaybackError(): void {
    // Kurzer Netzwerkabbruch (<30 s) automatisch überbrücken (Abschnitt 5.3)
    if (this.retryCount < 5 && this.currentTrack && this.audio) {
      this.retryCount++;
      const savedTime = this.currentTime;
      const delay = Math.min(1000 * Math.pow(1.5, this.retryCount), 5000);

      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => {
        if (!this.audio || !this.currentTrack) return;
        this.audio.src = this.currentTrack.streamUrl;
        this.audio.currentTime = savedTime;
        this.audio.play().catch(() => {});
      }, delay);
    } else {
      this.isLoading = false;
      this.isPlaying = false;
      this.notify();
    }
  }

  private syncAudioState(): void {
    if (!this.audio) return;
    if (this.isPlaying !== !this.audio.paused) {
      this.isPlaying = !this.audio.paused;
      this.notify();
    }
  }

  public async playItem(
    item: Item,
    tracks: Track[],
    startIndex: number = 0,
    startOffsetSec?: number
  ): Promise<void> {
    this.init();
    if (!this.audio) return;

    this.currentItem = item;
    this.playlist = tracks;
    this.trackIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    const track = this.playlist[this.trackIndex];
    if (!track) return;

    this.currentTrack = track;
    this.duration = track.durationSec || 0;
    this.currentTime = startOffsetSec || track.startOffsetSec || 0;
    this.isLoading = true;
    this.notify();

    // Stream-URL setzen und abspielen
    this.audio.src = track.streamUrl;
    if (this.currentTime > 0) {
      this.audio.currentTime = this.currentTime;
    }

    try {
      await this.audio.play();
    } catch {
      this.isPlaying = false;
      this.isLoading = false;
      this.notify();
    }
  }

  public async play(): Promise<void> {
    if (!this.audio || !this.currentTrack) return;
    try {
      await this.audio.play();
    } catch {
      // Ignorieren
    }
  }

  public pause(): void {
    if (!this.audio) return;
    this.audio.pause();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(targetSec: number): void {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(targetSec, this.duration || Infinity));
    this.audio.currentTime = clamped;
    this.currentTime = clamped;
    this.updateMediaSessionPosition();
    this.notify();
  }

  public rewind30(): void {
    this.seek(this.currentTime - 30);
  }

  public forward30(): void {
    this.seek(this.currentTime + 30);
  }

  public next(): void {
    if (this.trackIndex < this.playlist.length - 1) {
      const nextIndex = this.trackIndex + 1;
      this.playItem(this.currentItem!, this.playlist, nextIndex);
    } else {
      this.pause();
      this.seek(0);
    }
  }

  public previous(): void {
    if (this.currentTime > 5 || this.trackIndex === 0) {
      this.seek(0);
    } else {
      const prevIndex = this.trackIndex - 1;
      this.playItem(this.currentItem!, this.playlist, prevIndex);
    }
  }

  public setSleepTimer(minutes: SleepTimerDuration): void {
    this.sleepTimerDuration = minutes;
    sleepTimer.set(minutes);
    this.notify();
  }

  private startProgressTimer(): void {
    this.stopProgressTimer();
    // Alle 10 Sekunden Fortschritt an BFF senden (Abschnitt 7)
    this.progressInterval = setInterval(() => {
      this.saveCurrentProgress();
    }, 10000);
  }

  private stopProgressTimer(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private saveCurrentProgress(finished: boolean = false): void {
    if (!this.currentItem || this.currentItem.section === 'music') return;

    const itemId = this.currentItem.id;
    const positionSec = Math.round(this.currentTime);
    const durationSec = Math.round(this.duration);

    try {
      fetch(`/api/kid/progress/${encodeURIComponent(itemId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionSec,
          durationSec,
          finished
        }),
        keepalive: true
      }).catch(() => {});
    } catch {
      // Offline / Nicht blockierend
    }
  }

  private setupMediaSessionHandlers(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => this.play());
    ms.setActionHandler('pause', () => this.pause());
    ms.setActionHandler('seekbackward', () => this.rewind30());
    ms.setActionHandler('seekforward', () => this.forward30());
    ms.setActionHandler('previoustrack', () => this.previous());
    ms.setActionHandler('nexttrack', () => this.next());
    ms.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime);
      }
    });
  }

  private updateMediaSession(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!this.currentItem || !this.currentTrack) return;

    const baseCover = this.currentItem.coverUrl.replace(/([?&])w=\d+/, '');
    const sep = baseCover.includes('?') ? '&' : '?';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentTrack.title,
      artist: this.currentItem.title,
      album: this.currentItem.title,
      artwork: [
        {
          src: `${baseCover}${sep}w=320&f=jpg`,
          sizes: '320x320',
          type: 'image/jpeg'
        },
        {
          src: `${baseCover}${sep}w=640&f=jpg`,
          sizes: '640x640',
          type: 'image/jpeg'
        },
        {
          src: `${baseCover}${sep}w=1024&f=jpg`,
          sizes: '1024x1024',
          type: 'image/jpeg'
        }
      ]
    });

    navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    this.updateMediaSessionPosition();
  }

  private updateMediaSessionPosition(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!this.duration || !Number.isFinite(this.duration) || this.duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: this.duration,
        playbackRate: 1,
        position: Math.min(this.currentTime, this.duration)
      });
    } catch {
      // Ignorieren falls nicht unterstützt
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
