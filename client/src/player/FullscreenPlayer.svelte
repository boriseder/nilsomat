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
    tracks?: Track[];
    trackIndex?: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    sleepTimerDuration: SleepTimerDuration;
    onClose: () => void;
  }

  const {
    item,
    track,
    tracks = [],
    trackIndex = 0,
    isPlaying,
    currentTime,
    duration,
    sleepTimerDuration,
    onClose
  }: Props = $props();

  let showSleepModal = $state(false);
  let showTracklist = $state(false);

  const effectiveTracks = $derived(
    tracks && tracks.length > 0 ? tracks : audioEngine.getState().tracks
  );
  const currentTrackIndex = $derived(
    trackIndex ?? audioEngine.getState().trackIndex
  );

  const isBookOrPodcast = $derived(item.section === 'books' || item.section === 'podcasts');
  const tracklistButtonLabel = $derived(
    isBookOrPodcast ? strings.kid.actions.tracklistChapters : strings.kid.actions.tracklistSongs
  );

  const activeCoverUrl = $derived(track.coverUrl || item.coverUrl);

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

  function handleSelectTrack(index: number): void {
    audioEngine.playTrackIndex(index);
  }

  function formatTrackDuration(sec?: number): string {
    if (!sec || sec <= 0) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function cleanKidTitle(rawTitle: string): string {
    if (!rawTitle) return '';
    // Entferne überflüssige Klammerzusätze am Ende, z. B. (Bundesliga Anthem 2026/2027) oder [Remastered]
    const cleaned = rawTitle.replace(/\s*(\([^)]*\)|\[[^\]]*\])\s*$/g, '').trim();
    return cleaned.length > 0 ? cleaned : rawTitle;
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

    <div class="player-header-actions">
      {#if effectiveTracks.length > 1 && !showTracklist}
        <button
          type="button"
          class="btn-tracklist"
          onclick={() => (showTracklist = true)}
          aria-label={tracklistButtonLabel}
        >
          <Icon name="list" size={26} />
          <span>{tracklistButtonLabel}</span>
        </button>
      {/if}

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
    </div>
  </header>

  <main class="player-body" class:has-tracklist={showTracklist}>
    {#if showTracklist}
      <!-- Trackliste Ansicht (große, kinderfreundliche Zeilen) -->
      <div class="tracklist-container" role="region" aria-label="Titelauswahl">
        <div class="tracklist-top-bar">
          <div class="tracklist-heading">
            <span class="tracklist-count-badge">
              {effectiveTracks.length} {isBookOrPodcast ? strings.kid.actions.tracklistChapters : strings.kid.actions.tracklistSongs}
            </span>
          </div>

          <button
            type="button"
            class="btn-back-to-cover"
            onclick={() => (showTracklist = false)}
            aria-label={strings.kid.actions.backToCover}
          >
            <Icon name="cover" size={26} />
            <span>{strings.kid.actions.backToCover}</span>
          </button>
        </div>

        <div class="tracklist-scroll-view">
          {#each effectiveTracks as t, idx (t.id || idx)}
            {@const isCurrent = idx === currentTrackIndex}
            <button
              type="button"
              class="tracklist-item-row"
              class:is-active={isCurrent}
              onclick={() => handleSelectTrack(idx)}
            >
              <div class="track-row-left">
                {#if isCurrent}
                  <div class="active-equalizer-pill" style="background: {glowColor};">
                    <Icon name={isPlaying ? 'pause' : 'play'} size={28} color="#ffffff" />
                  </div>
                {:else if t.coverUrl}
                  <div class="track-cover-thumb">
                    <CoverImage
                      coverSrc={t.coverUrl}
                      altText={t.title}
                      size={320}
                      loading="lazy"
                    />
                  </div>
                {:else}
                  <div class="track-index-num">
                    <span>{idx + 1}</span>
                  </div>
                {/if}
              </div>

              <div class="track-row-info">
                <span class="track-row-title">{cleanKidTitle(t.title)}</span>
                {#if t.durationSec}
                  <span class="track-row-duration">{formatTrackDuration(t.durationSec)}</span>
                {/if}
              </div>

              <div class="track-row-indicator">
                {#if isCurrent}
                  <div
                    class="now-playing-pill"
                    style="background: {glowColor}33; color: {glowColor}; border: 1.5px solid {glowColor}88;"
                  >
                    <Icon name={isPlaying ? 'play' : 'pause'} size={20} color={glowColor} />
                    <span>{isPlaying ? strings.kid.actions.play : strings.kid.actions.pause}</span>
                  </div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Großes zentriertes Cover mit magischem Ambient Glow -->
      <div class="player-cover-container">
        <div class="cover-ambient-glow" style="background: {glowColor};"></div>
        <div class="player-cover-box">
          <CoverImage
            coverSrc={activeCoverUrl}
            altText={track.title || item.title}
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
    {/if}

    {#if !showTracklist}
      <!-- Kaugummi-Fortschrittsbalken mit mind. 48px Touch-Höhe (nur auf Cover-Ansicht) -->
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
    {/if}

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

  .player-header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .btn-tracklist {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(26, 33, 56, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    color: var(--text-primary);
    padding: 0 24px;
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

  .btn-tracklist:hover {
    background: rgba(38, 48, 80, 0.95);
    border-color: rgba(255, 255, 255, 0.28);
    transform: translateY(-2px);
    box-shadow:
      0 12px 24px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  .btn-tracklist:active {
    transform: scale(0.95);
  }

  /* Trackliste Container & Rows */
  .tracklist-container {
    width: 100%;
    flex: 1;
    min-height: 0;
    max-height: none;
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    background: rgba(15, 23, 42, 0.78);
    border: 1.5px solid rgba(255, 255, 255, 0.14);
    border-radius: 28px;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    overflow: hidden;
  }

  .tracklist-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
  }

  .tracklist-count-badge {
    font-size: 22px;
    font-weight: 800;
    color: #cbd5e1;
    background: rgba(255, 255, 255, 0.08);
    padding: 8px 22px;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
  }

  .btn-back-to-cover {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(30, 41, 59, 0.85);
    border: 1.5px solid rgba(255, 255, 255, 0.22);
    color: var(--text-primary);
    padding: 0 24px;
    min-height: var(--touch-min-size);
    border-radius: 9999px;
    font-size: var(--font-size-base);
    font-weight: 800;
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    cursor: pointer;
    touch-action: manipulation;
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease;
  }

  .btn-back-to-cover:hover {
    background: rgba(45, 60, 88, 0.95);
    border-color: rgba(255, 255, 255, 0.35);
    transform: translateY(-2px) scale(1.02);
  }

  .btn-back-to-cover:active {
    transform: scale(0.96);
  }

  .tracklist-scroll-view {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tracklist-item-row {
    display: flex;
    align-items: center;
    gap: 18px;
    width: 100%;
    min-height: 80px;
    padding: 14px 20px;
    background: rgba(30, 41, 59, 0.7);
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 22px;
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
    touch-action: manipulation;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .tracklist-item-row:hover {
    background: rgba(45, 60, 88, 0.9);
    border-color: rgba(255, 255, 255, 0.22);
    transform: translateY(-2px);
  }

  .tracklist-item-row:active {
    transform: scale(0.98);
  }

  .tracklist-item-row.is-active {
    background: rgba(59, 130, 246, 0.25);
    border-color: rgba(96, 165, 250, 0.9);
    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.35);
  }

  .track-row-left {
    flex-shrink: 0;
  }

  .track-index-num {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: #cbd5e1;
    flex-shrink: 0;
  }

  .active-equalizer-pill {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    flex-shrink: 0;
    animation: pulse-glow 2s infinite ease-in-out;
  }

  .track-cover-thumb {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    border: 1.5px solid rgba(255, 255, 255, 0.18);
    flex-shrink: 0;
  }

  .track-row-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .track-row-title {
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .track-row-duration {
    font-size: 16px;
    font-weight: 700;
    color: #94a3b8;
  }

  .track-row-indicator {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .now-playing-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: 9999px;
    font-size: 18px;
    font-weight: 800;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  @keyframes pulse-glow {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    50% {
      transform: scale(1.04);
      box-shadow: 0 6px 22px rgba(255, 255, 255, 0.25);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .active-equalizer-pill {
      animation: none;
    }
  }

  .player-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 8px 32px 28px 32px;
    max-width: 760px;
    margin: 0 auto;
    width: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    min-height: 0;
  }

  .player-body.has-tracklist {
    max-width: 880px;
    justify-content: flex-start;
    overflow: hidden;
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
