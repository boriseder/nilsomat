<script lang="ts">
  import type { Item, Track } from '../types';
  import CoverImage from '../kid/CoverImage.svelte';
  import { strings } from '../strings';
  import Icon from '../icons/Icon.svelte';
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
      <Icon name="back" size={26} />
      <span>{strings.kid.actions.back}</span>
    </button>

    <button
      type="button"
      class="btn-sleep"
      class:active={sleepTimerDuration !== null}
      onclick={() => (showSleepModal = true)}
    >
      <Icon name="moon" size={24} color={sleepTimerDuration !== null ? '#3b82f6' : 'currentColor'} />
      <span>
        {sleepTimerDuration ? `${sleepTimerDuration} Min.` : strings.kid.actions.sleepTimer}
      </span>
    </button>
  </header>

  <main class="player-body">
    <!-- Großes zentriertes Cover (responsiv skaliert für Desktop und iPad) -->
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
          aria-label="30 Sekunden zurück"
          onclick={() => audioEngine.rewind30()}
        >
          <Icon name="replay30" size={38} />
          <span class="control-label">30s</span>
        </button>
      {:else}
        <!-- Vorheriger Track (Musik) -->
        <button
          type="button"
          class="btn-control"
          aria-label={strings.kid.actions.previous}
          onclick={() => audioEngine.previous()}
        >
          <Icon name="skip-prev" size={36} />
          <span class="control-label">{strings.kid.actions.previous}</span>
        </button>
      {/if}

      <!-- Play/Pause Button: Mindestens 120px (Abschnitt 5.2) -->
      <button
        type="button"
        class="btn-play-pause"
        aria-label={isPlaying ? strings.kid.actions.pause : strings.kid.actions.play}
        onclick={() => audioEngine.togglePlay()}
      >
        <div class="play-icon-wrap">
          <Icon name={isPlaying ? 'pause' : 'play'} size={54} color="#ffffff" />
        </div>
        <span class="play-label">
          {isPlaying ? strings.kid.actions.pause : strings.kid.actions.play}
        </span>
      </button>

      {#if isBookOrPodcast}
        <!-- 30 Sekunden vor -->
        <button
          type="button"
          class="btn-control btn-forward"
          aria-label="30 Sekunden vor"
          onclick={() => audioEngine.forward30()}
        >
          <div style="transform: scaleX(-1);">
            <Icon name="replay30" size={38} />
          </div>
          <span class="control-label">30s</span>
        </button>
      {:else}
        <!-- Nächster Track (Musik) -->
        <button
          type="button"
          class="btn-control"
          aria-label={strings.kid.actions.next}
          onclick={() => audioEngine.next()}
        >
          <Icon name="skip-next" size={36} />
          <span class="control-label">{strings.kid.actions.next}</span>
        </button>
      {/if}
    </div>
  </main>
</div>

{#if showSleepModal}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={() => (showSleepModal = false)}
  >
    <div
      class="modal-dialog"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="modal-heading">
        <Icon name="moon" size={36} color="#fbbf24" />
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
            {opt ? `${opt} Min.` : 'Aus'}
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

<style>
  .player-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 70%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
    flex-shrink: 0;
  }

  .btn-back,
  .btn-sleep {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
    padding: 0 28px;
    height: var(--touch-min-size);
    border-radius: 9999px;
    font-size: var(--font-size-base);
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
    cursor: pointer;
  }

  .btn-back:hover,
  .btn-sleep:hover {
    background: rgba(51, 65, 85, 0.95);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }

  .btn-back:active,
  .btn-sleep:active {
    transform: scale(0.96);
  }

  .btn-sleep.active {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: #60a5fa;
  }

  .player-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 8px 32px 32px 32px;
    max-width: 760px;
    margin: 0 auto;
    width: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    min-height: 0;
  }

  /* Cover: Skaliert responsiv so dass Controls NIE abgeschnitten werden */
  .player-cover-box {
    width: min(72vw, 38vh, 440px);
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 1;
    min-height: 160px;
    margin-top: 4px;
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .player-meta {
    text-align: center;
    margin: 12px 0 6px 0;
    width: 100%;
    flex-shrink: 0;
  }

  .item-title {
    font-size: var(--font-size-xl);
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-secondary);
    margin-top: 4px;
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
    flex-shrink: 0;
  }

  .progress-track {
    position: relative;
    width: 100%;
    height: 12px;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 9999px;
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-radius: 9999px;
  }

  .progress-thumb {
    position: absolute;
    top: 50%;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transform: translate(-50%, -50%);
    pointer-events: none;
    transition: transform 0.1s ease;
  }

  .progress-touch-area:hover .progress-thumb {
    transform: translate(-50%, -50%) scale(1.15);
  }

  /* Steuerungsleiste */
  .controls-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 36px;
    width: 100%;
    margin-top: 4px;
    flex-shrink: 0;
  }

  .btn-control {
    width: 88px;
    height: 88px;
    border-radius: 28px;
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .btn-control:hover {
    background: rgba(51, 65, 85, 0.95);
    transform: translateY(-2px);
  }

  .btn-control:active {
    transform: scale(0.95);
  }

  .control-label {
    font-size: 14px;
    font-weight: 800;
  }

  /* Play/Pause Button mind. 120px */
  .btn-play-pause {
    width: 126px;
    height: 126px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    box-shadow: 0 16px 36px rgba(16, 185, 129, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.35);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, filter 0.15s ease;
  }

  .btn-play-pause:hover {
    transform: scale(1.05);
    filter: brightness(1.08);
    box-shadow: 0 20px 42px rgba(16, 185, 129, 0.55);
  }

  .btn-play-pause:active {
    transform: scale(0.95);
  }

  .play-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .play-label {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    padding: 24px;
  }

  .modal-dialog {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 36px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7);
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
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--text-primary);
    font-size: var(--font-size-base);
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .btn-timer:hover {
    background: rgba(51, 65, 85, 0.8);
    transform: translateY(-2px);
  }

  .btn-timer.selected {
    background: #3b82f6;
    border-color: #60a5fa;
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }

  .btn-close-modal {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
    padding: 0 36px;
    height: var(--touch-min-size);
    border-radius: 9999px;
  }
</style>
