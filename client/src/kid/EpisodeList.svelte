<script lang="ts">
  import type { Item, Track } from '../types';
  import { strings } from '../strings';
  import CoverImage from './CoverImage.svelte';

  interface Props {
    podcast: Item;
    tracks: Track[];
    onBack: () => void;
    onPlayTrack: (track: Track, allTracks: Track[]) => void;
  }

  const { podcast, tracks, onBack, onPlayTrack }: Props = $props();

  function formatDuration(sec: number): string {
    if (!sec) return '';
    const mins = Math.max(1, Math.round(sec / 60));
    return `${mins} Min.`;
  }
</script>

<div class="episodes-view kid-area">
  <header class="episodes-header">
    <button type="button" class="btn-back" onclick={onBack}>
      <span aria-hidden="true">⬅️</span>
      <span>{strings.kid.actions.back}</span>
    </button>

    <div class="podcast-meta">
      <div class="small-cover">
        <CoverImage
          coverSrc={podcast.coverUrl}
          altText={podcast.title}
          dominantColor={podcast.dominantColor}
          size={320}
        />
      </div>
      <h2 class="podcast-title">{podcast.title}</h2>
    </div>
  </header>

  <main class="episodes-content">
    <div class="episodes-list">
      {#each tracks as track, index (track.id)}
        <button
          type="button"
          class="episode-row"
          onclick={() => onPlayTrack(track, tracks)}
        >
          <span class="row-play-icon" aria-hidden="true">▶️</span>

          <div class="row-info">
            <span class="row-title">{track.title}</span>
            {#if track.durationSec}
              <span class="row-duration">{formatDuration(track.durationSec)}</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </main>
</div>

<style>
  .episodes-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .episodes-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 24px 32px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    z-index: 10;
  }

  .btn-back {
    background-color: var(--bg-surface);
    color: var(--text-primary);
    padding: 0 28px;
    height: var(--touch-min-size);
    font-size: var(--font-size-base);
  }

  .podcast-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    overflow: hidden;
  }

  .small-cover {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
  }

  .podcast-title {
    font-size: var(--font-size-lg);
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .episodes-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 24px 32px;
  }

  .episodes-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Große Touch-Zeilen (mind. 72px hoch) */
  .episode-row {
    background: var(--bg-surface);
    border-radius: 24px;
    padding: 16px 28px;
    min-height: var(--touch-min-size);
    display: flex;
    align-items: center;
    gap: 24px;
    color: var(--text-primary);
    text-align: left;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    width: 100%;
  }

  .row-play-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .row-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }

  .row-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    line-height: 1.3;
  }

  .row-duration {
    font-size: 18px;
    color: var(--text-secondary);
  }
</style>
