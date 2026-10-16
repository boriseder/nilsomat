<script lang="ts">
  import type { Item, Track } from '../types';
  import CoverImage from '../kid/CoverImage.svelte';
  import { strings } from '../strings';
  import { audioEngine } from './AudioEngine';

  interface Props {
    item: Item;
    track: Track;
    isPlaying: boolean;
    onOpenFullscreen: () => void;
  }

  const { item, track, isPlaying, onOpenFullscreen }: Props = $props();
</script>

<div
  class="mini-player"
  role="button"
  tabindex="0"
  aria-label="Wiedergabeleiste öffnen"
  onclick={onOpenFullscreen}
  onkeydown={(e) => e.key === 'Enter' && onOpenFullscreen()}
>
  <div class="mini-cover">
    <CoverImage
      coverSrc={item.coverUrl}
      altText={item.title}
      dominantColor={item.dominantColor}
      size={320}
      loading="eager"
    />
  </div>

  <div class="mini-meta">
    <span class="mini-title">{item.title}</span>
    {#if track.title !== item.title}
      <span class="mini-subtitle">{track.title}</span>
    {/if}
  </div>

  <button
    type="button"
    class="mini-btn-play"
    onclick={(e) => {
      e.stopPropagation();
      audioEngine.togglePlay();
    }}
  >
    <span aria-hidden="true">{isPlaying ? '⏸️' : '▶️'}</span>
  </button>
</div>

<style>
  .mini-player {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 16px);
    left: 24px;
    right: 24px;
    height: 96px;
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(16px);
    border-radius: 28px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 150;
    cursor: pointer;
    max-width: 900px;
    margin: 0 auto;
  }

  .mini-cover {
    width: 72px;
    height: 72px;
    flex-shrink: 0;
  }

  .mini-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }

  .mini-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mini-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mini-btn-play {
    width: var(--touch-min-size);
    height: var(--touch-min-size);
    border-radius: 50%;
    background: var(--accent-play);
    color: #ffffff;
    font-size: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  }
</style>
