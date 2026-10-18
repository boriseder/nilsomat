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
  sleepTimerExpired: boolean;
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
  private sleepTimerExpired: boolean = false;

  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<StateListener> = new Set();
  private retryCount: number = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    sleepTimer.setCallback(() => {
      this.pause();
      this.sleepTimerDuration = null;
      this.sleepTimerExpired = true;
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
      sleepTimerDuration: this.sleepTimerDuration,
      sleepTimerExpired: this.sleepTimerExpired
    };
  }

  public dismissSleepTimer(): void {
    if (this.sleepTimerExpired) {
      this.sleepTimerExpired = false;
      this.notify();
    }
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
      if (this.audio && this.currentTrack) {
        const trackStart = this.currentTrack.startOffsetSec || 0;
        const trackDuration = this.currentTrack.durationSec || 0;

        if (trackStart > 0) {
          const rel = Math.max(0, this.audio.currentTime - trackStart);
          this.currentTime = rel;

          // Falls Kapitel in Einzeldatei sein Ende erreicht hat
          if (trackDuration > 0 && rel >= trackDuration) {
            this.next();
            return;
          }
        } else {
          this.currentTime = this.audio.currentTime;
        }

        this.updateMediaSessionPosition();
        this.notify();
      }
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio && Number.isFinite(this.audio.duration)) {
        if (!this.currentTrack?.durationSec) {
          this.duration = this.audio.duration;
          this.notify();
        }
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

    this.sleepTimerExpired = false;
    this.currentItem = item;
    this.playlist = tracks;
    this.trackIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    const track = this.playlist[this.trackIndex];
    if (!track) return;

    this.currentTrack = track;
    this.duration = track.durationSec || 0;
    const initialOffset = startOffsetSec !== undefined ? startOffsetSec : (track.startOffsetSec || 0);
    this.currentTime = initialOffset;
    this.isLoading = true;
    this.notify();

    const targetSrc = track.streamUrl;
    const isSameSrc = Boolean(this.audio.src && this.audio.src.endsWith(targetSrc));

    if (isSameSrc) {
      try {
        const audioPos = (track.startOffsetSec || 0) + initialOffset;
        this.audio.currentTime = audioPos;
      } catch {}
      this.audio.play().catch(() => {
        this.isPlaying = false;
        this.isLoading = false;
        this.notify();
      });
    } else {
      this.audio.src = targetSrc;
      const audioPos = (track.startOffsetSec || 0) + initialOffset;
      if (audioPos > 0) {
        const onLoaded = () => {
          if (this.audio) {
            try {
              this.audio.currentTime = audioPos;
            } catch {}
          }
        };
        this.audio.addEventListener('loadedmetadata', onLoaded, { once: true });
      }
      this.audio.play().catch(() => {
        this.isPlaying = false;
        this.isLoading = false;
        this.notify();
      });
    }
  }

  public playTrackIndex(index: number): void {
    if (!this.currentItem || !this.playlist.length) return;
    if (index < 0 || index >= this.playlist.length) return;
    this.playItem(this.currentItem, this.playlist, index, 0);
  }

  public async play(): Promise<void> {
    if (!this.audio || !this.currentTrack) return;
    this.sleepTimerExpired = false;
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
    const audioPos = (this.currentTrack?.startOffsetSec || 0) + clamped;
    this.audio.currentTime = audioPos;
    this.currentTime = clamped;
    this.updateMediaSessionPosition();
    this.notify();
  }

  public rewind30(): void {
    if (this.currentTime >= 30) {
      this.seek(this.currentTime - 30);
    } else if (this.trackIndex > 0) {
      const prevTrack = this.playlist[this.trackIndex - 1];
      const prevDuration = prevTrack?.durationSec || 0;
      const targetOffset = Math.max(0, prevDuration - (30 - this.currentTime));
      this.playItem(this.currentItem!, this.playlist, this.trackIndex - 1, targetOffset);
    } else {
      this.seek(0);
    }
  }

  public forward30(): void {
    if (this.currentTime + 30 < this.duration) {
      this.seek(this.currentTime + 30);
    } else if (this.trackIndex < this.playlist.length - 1) {
      const overflow = this.currentTime + 30 - this.duration;
      this.playItem(this.currentItem!, this.playlist, this.trackIndex + 1, overflow);
    } else {
      this.seek(this.duration);
    }
  }

  public next(): void {
    if (this.trackIndex < this.playlist.length - 1) {
      const nextIndex = this.trackIndex + 1;
      this.playItem(this.currentItem!, this.playlist, nextIndex, 0);
    } else {
      this.pause();
      this.seek(0);
      this.saveCurrentProgress(true);
    }
  }

  public previous(): void {
    if (this.currentTime > 5 || this.trackIndex === 0) {
      this.seek(0);
    } else {
      const prevIndex = this.trackIndex - 1;
      this.playItem(this.currentItem!, this.playlist, prevIndex, 0);
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
    let totalPosition = Math.round(this.currentTime);
    let totalDuration = 0;

    for (let i = 0; i < this.playlist.length; i++) {
      const d = this.playlist[i].durationSec || 0;
      totalDuration += d;
      if (i < this.trackIndex) {
        totalPosition += d;
      }
    }

    try {
      fetch(`/api/kid/progress/${encodeURIComponent(itemId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionSec: totalPosition,
          durationSec: totalDuration,
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

    const coverToUse = this.currentTrack.coverUrl || this.currentItem.coverUrl;
    const baseCover = coverToUse.replace(/([?&])w=\d+/, '');
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
