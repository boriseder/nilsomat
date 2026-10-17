<script lang="ts">
  import type { Item, Track } from '../types';
  import { strings } from '../strings';
  import CoverImage from './CoverImage.svelte';
  import Icon from '../icons/Icon.svelte';

  interface Props {
    podcast: Item;
    tracks: Track[];
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
    onBack: () => void;
    onPlayTrack: (track: Track, allTracks: Track[]) => void;
  }

  const {
    podcast,
    tracks,
    hasMore = false,
    loadingMore = false,
    onLoadMore,
    onBack,
    onPlayTrack
  }: Props = $props();

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
          <div class="episode-index-badge">
            <span>{index + 1}</span>
          </div>

          <div class="row-info">
            <span class="row-title">{track.title}</span>
            {#if track.durationSec}
              <span class="row-duration">{formatDuration(track.durationSec)}</span>
            {/if}
          </div>

          <div class="row-play-badge">
            <Icon name="play" size={26} color="#ffffff" />
          </div>
        </button>
      {/each}

      {#if hasMore}
        <div class="load-more-row">
          <button
            type="button"
            class="btn-load-more"
            disabled={loadingMore}
            onclick={onLoadMore}
          >
            {#if loadingMore}
              <Icon name="reload" size={30} />
              <span>{strings.kid.status.loading}</span>
            {:else}
              <Icon name="plus" size={30} />
              <span>{strings.kid.actions.loadMoreEpisodes}</span>
            {/if}
          </button>
        </div>
      {/if}
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
    background: rgba(14, 19, 38, 0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 10;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(30, 38, 69, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: var(--text-primary);
    padding: 0 28px;
    height: var(--touch-min-size);
    border-radius: 9999px;
    font-size: var(--font-size-base);
    font-weight: 800;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease;
    cursor: pointer;
  }

  .btn-back:hover {
    background: rgba(45, 56, 96, 0.95);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-3px) scale(1.02);
  }

  .btn-back:active {
    transform: scale(0.95);
  }

  .podcast-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    overflow: hidden;
  }

  .small-cover {
    width: 68px;
    height: 68px;
    border-radius: 18px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.1);
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
    padding: 32px 32px 48px 32px;
  }

  .episodes-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1000px;
    margin: 0 auto;
  }

  .episode-row {
    background: rgba(30, 38, 69, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 28px;
    padding: 16px 24px;
    min-height: var(--touch-min-size);
    display: flex;
    align-items: center;
    gap: 20px;
    color: var(--text-primary);
    text-align: left;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    width: 100%;
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease;
  }

  .episode-row:hover {
    background: rgba(45, 56, 96, 0.88);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-3px) scale(1.01);
  }

  .episode-row:active {
    transform: scale(0.97);
  }

  .episode-index-badge {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .row-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;
  }

  .row-title {
    font-size: var(--font-size-base);
    font-weight: 800;
    line-height: 1.3;
  }

  .row-duration {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-muted);
  }

  .row-play-badge {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.45);
    transition: transform 0.15s ease;
  }

  .episode-row:hover .row-play-badge {
    transform: scale(1.08);
  }

  .load-more-row {
    display: flex;
    justify-content: center;
    padding-top: 14px;
    padding-bottom: 24px;
  }

  .btn-load-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
    min-height: 80px;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.88) 0%, rgba(30, 58, 138, 0.95) 100%);
    border: 2px solid rgba(255, 255, 255, 0.22);
    border-radius: 28px;
    color: #ffffff;
    font-size: var(--font-size-base);
    font-weight: 800;
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
    cursor: pointer;
    touch-action: manipulation;
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease, box-shadow 0.18s ease;
  }

  .btn-load-more:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 1) 100%);
    border-color: rgba(255, 255, 255, 0.35);
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 12px 30px rgba(37, 99, 235, 0.5);
  }

  .btn-load-more:active:not(:disabled) {
    transform: scale(0.97);
  }

  .btn-load-more:disabled {
    opacity: 0.7;
    cursor: default;
  }
</style>
