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

  const glowColor = $derived(item.dominantColor || '#6366f1');

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

<div
  class="player-view player-fullscreen kid-area"
  class:sleep-mode-active={sleepTimerDuration !== null}
>
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
      <Icon
        name="moon"
        size={26}
        color={sleepTimerDuration !== null ? '#fbbf24' : 'currentColor'}
      />
      <span>
        {sleepTimerDuration ? `${sleepTimerDuration} Min.` : strings.kid.actions.sleepTimer}
      </span>
    </button>
  </header>

  <main class="player-body">
    <!-- Großes zentriertes Cover mit magischem Ambient Glow -->
    <div class="player-cover-container">
      <div class="cover-ambient-glow" style="background: {glowColor};"></div>
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
    </div>

    <div class="player-meta">
      <h2 class="item-title">{item.title}</h2>
      {#if track.title !== item.title}
        <h3 class="track-title">{track.title}</h3>
      {/if}
    </div>

    <!-- Kaugummi-Fortschrittsbalken mit mind. 48px Touch-Höhe -->
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

      <!-- Play/Pause Button: 126px mit taktilem Lichteffekt -->
      <button
        type="button"
        class="btn-play-pause"
        class:is-playing={isPlaying}
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
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="modal-heading">
        <Icon name="moon" size={38} color="#fbbf24" />
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
    background: radial-gradient(circle at 50% 25%, #1f254d 0%, #10142b 55%, #080a14 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: background 0.8s ease;
  }

  .player-fullscreen.sleep-mode-active {
    background: radial-gradient(circle at 50% 25%, #251e3e 0%, #120e24 55%, #080612 100%);
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
    background: rgba(26, 33, 56, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    color: var(--text-primary);
    padding: 0 28px;
    height: var(--touch-min-size);
    border-radius: 9999px;
    font-size: var(--font-size-base);
    font-weight: 800;
    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }

  .btn-back:hover,
  .btn-sleep:hover {
    background: rgba(38, 48, 80, 0.95);
    border-color: rgba(255, 255, 255, 0.28);
    transform: translateY(-2px);
    box-shadow:
      0 12px 24px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  .btn-back:active,
  .btn-sleep:active {
    transform: scale(0.95);
  }

  .btn-sleep.active {
    background: rgba(245, 158, 11, 0.22);
    border-color: rgba(245, 158, 11, 0.6);
    color: #fbbf24;
    box-shadow:
      0 8px 24px rgba(245, 158, 11, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
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

  /* Cover mit Ambient Glow */
  .player-cover-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 1;
    margin-top: 4px;
  }

  .cover-ambient-glow {
    position: absolute;
    inset: 0;
    border-radius: 44px;
    filter: blur(52px);
    opacity: 0.5;
    pointer-events: none;
    transform: scale(0.94) translateY(14px);
    transition: opacity 0.6s ease, background 0.6s ease;
  }

  .player-fullscreen.sleep-mode-active .cover-ambient-glow {
    opacity: 0.25;
    filter: blur(40px);
  }

  .player-cover-box {
    position: relative;
    width: min(72vw, 38vh, 440px);
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 1;
    min-height: 160px;
    border-radius: 36px;
    overflow: hidden;
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.65),
      0 4px 16px rgba(0, 0, 0, 0.4);
    border: 1.5px solid rgba(255, 255, 255, 0.18);
  }

  .player-meta {
    text-align: center;
    margin: 14px 0 8px 0;
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

  /* Kaugummi-Fortschrittsbalken mit mind. 48px Touch-Höhe */
  .progress-touch-area {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
    flex-shrink: 0;
    user-select: none;
  }

  .progress-track {
    position: relative;
    width: 100%;
    height: 16px;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 9999px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.35);
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
    border-radius: 9999px;
    box-shadow: 0 0 14px rgba(52, 211, 153, 0.6);
    transition: width 0.1s linear;
  }

  .player-fullscreen.sleep-mode-active .progress-fill {
    background: linear-gradient(90deg, #d97706, #f59e0b, #fbbf24);
    box-shadow: 0 0 14px rgba(245, 158, 11, 0.5);
  }

  .progress-thumb {
    position: absolute;
    top: 50%;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e8f0 65%, #cbd5e1 100%);
    border: 2.5px solid rgba(255, 255, 255, 0.85);
    box-shadow:
      0 4px 14px rgba(0, 0, 0, 0.45),
      inset 0 2px 2px #ffffff;
    transform: translate(-50%, -50%);
    pointer-events: none;
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .progress-touch-area:hover .progress-thumb {
    transform: translate(-50%, -50%) scale(1.18);
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
    border-radius: 30px;
    background: rgba(26, 33, 56, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.35),
      inset 0 1.5px 0 rgba(255, 255, 255, 0.2),
      inset 0 -2px 0 rgba(0, 0, 0, 0.3);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease;
  }

  .btn-control:hover {
    background: rgba(38, 48, 80, 0.95);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-3px) scale(1.04);
    box-shadow:
      0 14px 28px rgba(0, 0, 0, 0.4),
      inset 0 1.5px 0 rgba(255, 255, 255, 0.25);
  }

  .btn-control:active {
    transform: scale(0.93);
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
    border: 3px solid rgba(255, 255, 255, 0.35);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    box-shadow:
      0 16px 40px rgba(16, 185, 129, 0.45),
      inset 0 3px 0 rgba(255, 255, 255, 0.45),
      inset 0 -3px 0 rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, filter 0.15s ease, background 0.4s ease;
  }

  .btn-play-pause.is-playing {
    animation: playPulse 3.5s ease-in-out infinite;
  }

  @keyframes playPulse {
    0%, 100% {
      box-shadow:
        0 16px 40px rgba(16, 185, 129, 0.45),
        inset 0 3px 0 rgba(255, 255, 255, 0.45),
        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
    }
    50% {
      box-shadow:
        0 20px 52px rgba(16, 185, 129, 0.65),
        inset 0 3px 0 rgba(255, 255, 255, 0.55),
        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
    }
  }

  .player-fullscreen.sleep-mode-active .btn-play-pause {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    box-shadow:
      0 16px 40px rgba(245, 158, 11, 0.45),
      inset 0 3px 0 rgba(255, 255, 255, 0.45),
      inset 0 -3px 0 rgba(0, 0, 0, 0.2);
  }

  .player-fullscreen.sleep-mode-active .btn-play-pause.is-playing {
    animation: sleepPulse 3.5s ease-in-out infinite;
  }

  @keyframes sleepPulse {
    0%, 100% {
      box-shadow:
        0 16px 40px rgba(245, 158, 11, 0.45),
        inset 0 3px 0 rgba(255, 255, 255, 0.45),
        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
    }
    50% {
      box-shadow:
        0 20px 52px rgba(245, 158, 11, 0.65),
        inset 0 3px 0 rgba(255, 255, 255, 0.55),
        inset 0 -3px 0 rgba(0, 0, 0, 0.2);
    }
  }

  .btn-play-pause:hover {
    transform: scale(1.06);
    filter: brightness(1.08);
  }

  .btn-play-pause:active {
    transform: scale(0.93);
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
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    padding: 24px;
  }

  .modal-dialog {
    background: #182035;
    border: 1.5px solid rgba(255, 255, 255, 0.18);
    border-radius: 40px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    width: 100%;
    max-width: 500px;
    box-shadow:
      0 28px 60px rgba(0, 0, 0, 0.75),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
    border-radius: 24px;
    background: rgba(10, 14, 26, 0.6);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    color: var(--text-primary);
    font-size: var(--font-size-base);
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease;
  }

  .btn-timer:hover {
    background: rgba(38, 48, 80, 0.85);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }

  .btn-timer:active {
    transform: scale(0.94);
  }

  .btn-timer.selected {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-color: rgba(255, 255, 255, 0.35);
    box-shadow:
      0 8px 24px rgba(245, 158, 11, 0.4),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
    color: #ffffff;
  }

  .btn-close-modal {
    background: rgba(10, 14, 26, 0.8);
    border: 1.5px solid rgba(255, 255, 255, 0.18);
    color: var(--text-primary);
    padding: 0 40px;
    height: var(--touch-min-size);
    border-radius: 9999px;
    font-weight: 800;
    font-size: var(--font-size-base);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .btn-close-modal:hover {
    background: rgba(30, 41, 59, 0.95);
    transform: translateY(-2px);
  }

  .btn-close-modal:active {
    transform: scale(0.95);
  }
</style>
