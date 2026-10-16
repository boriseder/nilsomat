<script lang="ts">
  import type { Item, Track } from '../types';
  import { strings } from '../strings';
  import CoverImage from './CoverImage.svelte';
  import Icon from '../icons/Icon.svelte';

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
      <Icon name="back" size={26} />
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
          <div class="row-play-badge">
            <Icon name="play" size={24} color="#ffffff" />
          </div>

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
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 10;
  }

  .btn-back {
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

  .btn-back:hover {
    background: rgba(51, 65, 85, 0.95);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }

  .btn-back:active {
    transform: scale(0.96);
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
    border-radius: 16px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
    padding: 28px 32px;
  }

  .episodes-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1000px;
    margin: 0 auto;
  }

  .episode-row {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 16px 24px;
    min-height: var(--touch-min-size);
    display: flex;
    align-items: center;
    gap: 20px;
    color: var(--text-primary);
    text-align: left;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    width: 100%;
    transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }

  .episode-row:hover {
    background: rgba(51, 65, 85, 0.9);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .episode-row:active {
    transform: scale(0.98);
  }

  .row-play-badge {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
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
    font-size: 16px;
    font-weight: 600;
    color: var(--text-secondary);
  }
</style>
