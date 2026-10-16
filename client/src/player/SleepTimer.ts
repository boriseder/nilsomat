// Schlaf-Timer gemäß AGENTS.md Abschnitt 5.2 & 7
// Auswahl: 15 / 30 / 45 / 60 Min / Aus
// Timer-Ende = hartes Pausieren (iOS ignoriert volume fades)

export type SleepTimerDuration = 15 | 30 | 45 | 60 | null;

class SleepTimer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private targetTimestamp: number | null = null;
  private onExpireCallback: (() => void) | null = null;

  public setCallback(cb: () => void): void {
    this.onExpireCallback = cb;
  }

  public set(durationMinutes: SleepTimerDuration): void {
    this.cancel();
    if (!durationMinutes) {
      return;
    }

    const ms = durationMinutes * 60 * 1000;
    this.targetTimestamp = Date.now() + ms;

    this.timer = setTimeout(() => {
      this.cancel();
      if (this.onExpireCallback) {
        this.onExpireCallback();
      }
    }, ms);
  }

  public cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.targetTimestamp = null;
  }

  public get isActive(): boolean {
    return this.timer !== null;
  }

  public get remainingMinutes(): number {
    if (!this.targetTimestamp) return 0;
    const remainingMs = Math.max(0, this.targetTimestamp - Date.now());
    return Math.ceil(remainingMs / (60 * 1000));
  }
}

export const sleepTimer = new SleepTimer();
