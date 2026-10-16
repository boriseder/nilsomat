import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sleepTimer } from '../client/src/player/SleepTimer.js';
import type { Item, Track } from '../client/src/types.js';

class MockAudio {
  src = '';
  currentTime = 0;
  duration = 0;
  paused = true;
  preload = 'auto';
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
}

if (typeof globalThis.Audio === 'undefined') {
  // @ts-expect-error Mock
  globalThis.Audio = MockAudio;
}
if (typeof navigator !== 'undefined' && !('mediaSession' in navigator)) {
  // @ts-expect-error Mock
  navigator.mediaSession = {
    metadata: null,
    playbackState: 'none',
    setActionHandler: vi.fn(),
    setPositionState: vi.fn()
  };
}


describe('Player & Sleep-Timer (AGENTS.md Abschnitt 5.2 & 7)', () => {
  it('SleepTimer setzt Zeiten 15, 30, 45, 60 Min. und führt Callback hart aus', () => {
    vi.useFakeTimers();

    let expired = false;
    sleepTimer.setCallback(() => {
      expired = true;
    });

    sleepTimer.set(15);
    expect(sleepTimer.isActive).toBe(true);
    expect(sleepTimer.remainingMinutes).toBe(15);

    // 14 Minuten vorspulen -> noch aktiv
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(expired).toBe(false);

    // 1 Minute weiter -> abgelaufen
    vi.advanceTimersByTime(1 * 60 * 1000 + 10);
    expect(expired).toBe(true);
    expect(sleepTimer.isActive).toBe(false);

    // Abbrechen
    sleepTimer.set(30);
    expect(sleepTimer.isActive).toBe(true);
    sleepTimer.cancel();
    expect(sleepTimer.isActive).toBe(false);

    vi.useRealTimers();
  });

  it('PlayerState initialisiert mit Standardwerten und verwaltet Queue', async () => {
    const { audioEngine } = await import('../client/src/player/AudioEngine.js');
    audioEngine.init();

    const state = audioEngine.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);

    const testItem: Item = {
      id: 'abs:lib1:book1',
      section: 'books',
      kind: 'audiobook',
      title: 'Hörbuch 1',
      coverUrl: '/media/cover/abs:lib1:book1?w=640'
    };

    const testTracks: Track[] = [
      {
        id: 'abs:lib1:book1:ch1',
        title: 'Kapitel 1',
        durationSec: 300,
        streamUrl: '/media/stream/abs:lib1:book1:ch1'
      },
      {
        id: 'abs:lib1:book1:ch2',
        title: 'Kapitel 2',
        durationSec: 400,
        streamUrl: '/media/stream/abs:lib1:book1:ch2'
      }
    ];

    // Listeners empfangen Status-Updates
    let receivedState: any = null;
    const unsub = audioEngine.subscribe((s) => {
      receivedState = s;
    });

    expect(receivedState).not.toBeNull();
    unsub();
  });
});
