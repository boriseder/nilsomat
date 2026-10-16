<script lang="ts">
  import type { Item, Track } from '../types';
  import CoverImage from '../kid/CoverImage.svelte';
  import Icon from '../icons/Icon.svelte';
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
    aria-label={isPlaying ? 'Pause' : 'Abspielen'}
    onclick={(e) => {
      e.stopPropagation();
      audioEngine.togglePlay();
    }}
  >
    <Icon name={isPlaying ? 'pause' : 'play'} size={32} color="#ffffff" />
  </button>
</div>

<style>
  .mini-player {
    position: fixed;
    bottom: max(16px, env(safe-area-inset-bottom, 16px));
    left: 24px;
    right: 24px;
    height: 96px;
    background: rgba(30, 41, 59, 0.92);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 32px;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    z-index: 150;
    cursor: pointer;
    max-width: 900px;
    margin: 0 auto;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .mini-player:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.24);
  }

  .mini-cover {
    width: 68px;
    height: 68px;
    border-radius: 18px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
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
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mini-btn-play {
    width: var(--touch-min-size);
    height: var(--touch-min-size);
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
    transition: transform 0.15s ease, filter 0.15s ease;
  }

  .mini-btn-play:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }

  .mini-btn-play:active {
    transform: scale(0.94);
  }
</style>
