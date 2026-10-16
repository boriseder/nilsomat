<script lang="ts">
  import type { Item } from '../types';
  import { strings } from '../strings';
  import CoverImage from './CoverImage.svelte';

  interface Props {
    items: Item[];
    onSelectItem: (item: Item) => void;
  }

  const { items, onSelectItem }: Props = $props();

  const unfinishedItems = $derived(
    items.filter((item) => item.progress && !item.progress.finished).slice(0, 4)
  );
</script>

{#if unfinishedItems.length > 0}
  <section class="continue-section">
    <div class="section-heading">
      <span aria-hidden="true">⏱️</span>
      <h3>{strings.kid.status.continueListening}</h3>
    </div>

    <div class="continue-row">
      {#each unfinishedItems as item (item.id)}
        <button
          type="button"
          class="continue-card"
          onclick={() => onSelectItem(item)}
        >
          <div class="card-cover">
            <CoverImage
              coverSrc={item.coverUrl}
              altText={item.title}
              dominantColor={item.dominantColor}
              size={320}
              loading="eager"
            />
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

  .continue-row {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
  }

  .continue-card {
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 180px;
    flex-shrink: 0;
    text-align: left;
    cursor: pointer;
  }

  .card-cover {
    width: 180px;
    height: 180px;
    border-radius: 20px;
    overflow: hidden;
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
