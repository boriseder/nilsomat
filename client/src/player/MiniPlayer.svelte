<script lang="ts">
  import type { Item, Track } from '../types';
  import CoverImage from '../kid/CoverImage.svelte';
  import Icon from '../icons/Icon.svelte';
  import { audioEngine } from './AudioEngine';

  interface Props {
    item: Item;
    track: Track;
    isPlaying: boolean;
    currentTime?: number;
    duration?: number;
    onOpenFullscreen: () => void;
  }

  const {
    item,
    track,
    isPlaying,
    currentTime = 0,
    duration = 0,
    onOpenFullscreen
  }: Props = $props();

  const progressPercent = $derived(
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  );

  const activeCoverUrl = $derived(track.coverUrl || item.coverUrl);
</script>

<div
  class="mini-player"
  role="button"
  tabindex="0"
  aria-label="Wiedergabeleiste öffnen"
  onclick={onOpenFullscreen}
  onkeydown={(e) => e.key === 'Enter' && onOpenFullscreen()}
>
  <!-- Fortschrittsstreifen am oberen Rand -->
  <div class="mini-progress-track">
    <div class="mini-progress-fill" style="width: {progressPercent}%"></div>
  </div>

  <div class="mini-cover">
    <CoverImage
      coverSrc={activeCoverUrl}
      altText={track.title || item.title}
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
    <Icon name={isPlaying ? 'pause' : 'play'} size={34} color="#ffffff" />
  </button>
</div>

<style>
  .mini-player {
    position: fixed;
    bottom: max(18px, env(safe-area-inset-bottom, 18px));
    left: 20px;
    right: 20px;
    height: 98px;
    background: rgba(26, 33, 56, 0.92);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    border-radius: 36px;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow:
      0 18px 44px rgba(0, 0, 0, 0.55),
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    z-index: 150;
    cursor: pointer;
    max-width: 900px;
    margin: 0 auto;
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .mini-player:hover {
    transform: translateY(-3px) scale(1.008);
    border-color: rgba(255, 255, 255, 0.26);
    box-shadow:
      0 24px 52px rgba(0, 0, 0, 0.6),
      0 4px 16px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  .mini-player:active {
    transform: scale(0.98);
  }

  .mini-progress-track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
  }

  .mini-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
    box-shadow: 0 0 10px rgba(52, 211, 153, 0.85);
    border-radius: 0 2px 2px 0;
    transition: width 0.3s linear;
  }

  .mini-cover {
    width: 68px;
    height: 68px;
    border-radius: 20px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  .mini-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
    min-width: 0;
  }

  .mini-title {
    font-size: var(--font-size-base);
    font-weight: 800;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
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
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow:
      0 8px 24px rgba(16, 185, 129, 0.45),
      inset 0 2px 0 rgba(255, 255, 255, 0.35);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.15s ease, box-shadow 0.2s ease;
  }

  .mini-btn-play:hover {
    transform: scale(1.08);
    filter: brightness(1.1);
    box-shadow:
      0 12px 28px rgba(16, 185, 129, 0.55),
      inset 0 2px 0 rgba(255, 255, 255, 0.45);
  }

  .mini-btn-play:active {
    transform: scale(0.92);
  }
</style>
