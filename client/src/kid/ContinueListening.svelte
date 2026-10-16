<script lang="ts">
  import type { Item } from '../types';
  import { strings } from '../strings';
  import CoverImage from './CoverImage.svelte';
  import Icon from '../icons/Icon.svelte';

  interface Props {
    items: Item[];
    onSelectItem: (item: Item) => void;
  }

  const { items, onSelectItem }: Props = $props();

  const unfinishedItems = $derived(
    items.filter((item) => item.progress && !item.progress.finished).slice(0, 4)
  );

  function getProgressPercent(item: Item): number {
    if (!item.progress || !item.durationSec || item.durationSec <= 0) return 20;
    return Math.min(98, Math.max(6, Math.round((item.progress.positionSec / item.durationSec) * 100)));
  }
</script>

{#if unfinishedItems.length > 0}
  <section class="continue-section">
    <div class="section-heading">
      <div class="heading-badge">
        <Icon name="sparkle" size={26} color="#fbbf24" />
      </div>
      <h3>{strings.kid.status.continueListening}</h3>
    </div>

    <div class="continue-row">
      {#each unfinishedItems as item (item.id)}
        <button
          type="button"
          class="continue-card"
          onclick={() => onSelectItem(item)}
        >
          <div class="card-cover-wrap">
            <div class="card-cover">
              <CoverImage
                coverSrc={item.coverUrl}
                altText={item.title}
                dominantColor={item.dominantColor}
                size={320}
                loading="eager"
              />
            </div>

            <!-- Schlanker, leuchtender Fortschrittsbalken am unteren Bildrand -->
            <div class="mini-progress-track">
              <div
                class="mini-progress-fill"
                style="width: {getProgressPercent(item)}%"
              ></div>
            </div>
          </div>
          <span class="card-title">{item.title}</span>
        </button>
      {/each}
    </div>
  </section>
{/if}

<style>
  .continue-section {
    padding: 0 32px 24px 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: var(--font-size-lg);
    font-weight: 800;
    color: var(--text-primary);
  }

  .heading-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
  }

  .continue-row {
    display: flex;
    gap: 24px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 4px 4px 12px 4px;
  }

  .continue-card {
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 180px;
    flex-shrink: 0;
    text-align: left;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .continue-card:hover {
    transform: translateY(-6px) scale(1.03);
  }

  .continue-card:active {
    transform: scale(0.96);
  }

  .card-cover-wrap {
    position: relative;
    width: 180px;
    height: 180px;
    border-radius: 26px;
    overflow: hidden;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: var(--bg-surface);
  }

  .card-cover {
    width: 100%;
    height: 100%;
  }

  .mini-progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 8px;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(4px);
    overflow: hidden;
  }

  .mini-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
    border-radius: 9999px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.25;
  }
</style>
