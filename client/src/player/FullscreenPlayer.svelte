<script lang="ts">
  import type { Item, Track } from '../types';
  import CoverImage from '../kid/CoverImage.svelte';
  import { strings } from '../strings';
  import { audioEngine } from './AudioEngine';
  import type { SleepTimerDuration } from './SleepTimer';

  interface Props {
    item: Item;
    track: Track;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    sleepTimerDuration: SleepTimerDuration;
    onClose: () => void;
  }

  const {
    item,
    track,
    isPlaying,
    currentTime,
    duration,
    sleepTimerDuration,
    onClose
  }: Props = $props();

  let showSleepModal = $state(false);

  const isBookOrPodcast = $derived(item.section === 'books' || item.section === 'podcasts');

  const progressPercent = $derived(
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  );

  function handleSeek(e: MouseEvent | TouchEvent): void {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    if (duration > 0) {
      audioEngine.seek(ratio * duration);
    }
  }

  const timerOptions: SleepTimerDuration[] = [15, 30, 45, 60, null];
</script>

<div class="player-view player-fullscreen kid-area">
  <header class="player-header">
    <button type="button" class="btn-back btn-close-player" onclick={onClose}>
      <span aria-hidden="true">⬅️</span>
      <span>{strings.kid.actions.back}</span>
    </button>

    <button
      type="button"
      class="btn-sleep"
      class:active={sleepTimerDuration !== null}
      onclick={() => (showSleepModal = true)}
    >
      <span aria-hidden="true">🌙</span>
      <span>
        {sleepTimerDuration ? `${sleepTimerDuration} Min.` : strings.kid.actions.sleepTimer}
      </span>
    </button>
  </header>

  <main class="player-body">
    <!-- Großes zentriertes Cover (Abschnitt 5b: min(86vw, 62vh), max 720px) -->
    <div class="player-cover-box">
      <CoverImage
        coverSrc={item.coverUrl}
        altText={item.title}
        dominantColor={item.dominantColor}
        size={1280}
        loading="eager"
        fetchPriority="high"
      />
    </div>

    <div class="player-meta">
      <h2 class="item-title">{item.title}</h2>
      {#if track.title !== item.title}
        <h3 class="track-title">{track.title}</h3>
      {/if}
    </div>

    <!-- Fortschrittsbalken mit mind. 44px Touch-Höhe (Abschnitt 5.2) -->
    <div
      class="progress-touch-area"
      role="slider"
      tabindex="0"
      aria-label="Fortschritt"
      aria-valuenow={Math.round(progressPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      onclick={handleSeek}
      onkeydown={(e) => {
        if (e.key === 'ArrowRight') audioEngine.forward30();
        if (e.key === 'ArrowLeft') audioEngine.rewind30();
      }}
    >
      <div class="progress-track">
        <div class="progress-fill" style="width: {progressPercent}%"></div>
        <div class="progress-thumb" style="left: {progressPercent}%"></div>
      </div>
    </div>

    <!-- Steuerungsleiste -->
    <div class="controls-bar">
      {#if isBookOrPodcast}
        <!-- 30 Sekunden zurück -->
        <button
          type="button"
          class="btn-control btn-rewind"
          onclick={() => audioEngine.rewind30()}
        >
          <span class="control-icon" aria-hidden="true">⏪</span>
          <span class="control-label">30s</span>
        </button>
      {:else}
        <!-- Vorheriger Track (Musik) -->
        <button
          type="button"
          class="btn-control"
          onclick={() => audioEngine.previous()}
        >
          <span class="control-icon" aria-hidden="true">⏮️</span>
          <span class="control-label">{strings.kid.actions.previous}</span>
        </button>
      {/if}

      <!-- Play/Pause Button: Mindestens 120px (Abschnitt 5.2) -->
      <button
        type="button"
        class="btn-play-pause"
        onclick={() => audioEngine.togglePlay()}
      >
        <span class="play-icon" aria-hidden="true">
          {isPlaying ? '⏸️' : '▶️'}
        </span>
        <span class="play-label">
          {isPlaying ? strings.kid.actions.pause : strings.kid.actions.play}
        </span>
      </button>

      {#if isBookOrPodcast}
        <!-- 30 Sekunden vor -->
        <button
          type="button"
          class="btn-control btn-forward"
          onclick={() => audioEngine.forward30()}
        >
          <span class="control-icon" aria-hidden="true">⏩</span>
          <span class="control-label">30s</span>
        </button>
      {:else}
        <!-- Nächster Track (Musik) -->
        <button
          type="button"
          class="btn-control"
          onclick={() => audioEngine.next()}
        >
          <span class="control-icon" aria-hidden="true">⏭️</span>
          <span class="control-label">{strings.kid.actions.next}</span>
        </button>
      {/if}
    </div>
  </main>

  <!-- Schlaf-Timer Modal -->
  {#if showSleepModal}
    <div
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={strings.kid.actions.sleepTimer}
      tabindex="-1"
      onclick={(e) => {
        if (e.target === e.currentTarget) showSleepModal = false;
      }}
      onkeydown={(e) => e.key === 'Escape' && (showSleepModal = false)}
    >
      <div class="modal-dialog">
        <div class="modal-heading">
          <span aria-hidden="true">🌙</span>
          <h3>{strings.kid.actions.sleepTimer}</h3>
        </div>

        <div class="timer-options">
          {#each timerOptions as opt}
            <button
              type="button"
              class="btn-timer"
              class:selected={sleepTimerDuration === opt}
              onclick={() => {
                audioEngine.setSleepTimer(opt);
                showSleepModal = false;
              }}
            >
              {#if opt === null}
                <span>Aus</span>
              {:else}
                <span>{opt} Min.</span>
              {/if}
            </button>
          {/each}
        </div>

        <button
          type="button"
          class="btn-close-modal"
          onclick={() => (showSleepModal = false)}
        >
          {strings.kid.actions.close}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .player-view {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px;
  }

  .btn-back,
  .btn-sleep {
    background-color: var(--bg-surface);
    color: var(--text-primary);
    padding: 0 28px;
    height: var(--touch-min-size);
    font-size: var(--font-size-base);
  }

  .btn-sleep.active {
    background-color: var(--accent-action);
  }

  .player-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 12px 32px 36px 32px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  /* Cover: min(86vw, 62vh), max 720px */
  .player-cover-box {
    width: min(86vw, 56vh);
    max-width: 720px;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .player-meta {
    text-align: center;
    margin: 16px 0 8px 0;
    width: 100%;
  }

  .item-title {
    font-size: var(--font-size-xl);
    font-weight: 800;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-secondary);
    margin-top: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Fortschrittsbalken mit mind. 44px Touch-Höhe */
  .progress-touch-area {
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
  }

  .progress-track {
    position: relative;
    width: 100%;
    height: 12px;
    background: var(--bg-surface);
    border-radius: 6px;
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent-action);
    border-radius: 6px;
  }

  .progress-thumb {
    position: absolute;
    top: 50%;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  /* Steuerungsleiste */
  .controls-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 36px;
    width: 100%;
    margin-top: 8px;
  }

  .btn-control {
    width: 88px;
    height: 88px;
    border-radius: 28px;
    background: var(--bg-surface);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
  }

  .control-icon {
    font-size: 32px;
  }

  .control-label {
    font-size: 14px;
    font-weight: 700;
  }

  /* Play/Pause Button mind. 120px */
  .btn-play-pause {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: var(--accent-play);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0 12px 30px rgba(16, 185, 129, 0.4);
    cursor: pointer;
  }

  .play-icon {
    font-size: 48px;
  }

  .play-label {
    font-size: 16px;
    font-weight: 700;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    padding: 24px;
  }

  .modal-dialog {
    background: var(--bg-surface);
    border-radius: 36px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  }

  .modal-heading {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: var(--font-size-xl);
    font-weight: 800;
  }

  .timer-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    width: 100%;
  }

  .btn-timer {
    width: 110px;
    height: var(--touch-min-size);
    border-radius: 20px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: var(--font-size-base);
    font-weight: 700;
    cursor: pointer;
  }

  .btn-timer.selected {
    background: var(--accent-action);
  }

  .btn-close-modal {
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 0 36px;
    height: var(--touch-min-size);
  }
</style>
