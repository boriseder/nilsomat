<script lang="ts">
  import type { Item, Section } from '../types';
  import { strings } from '../strings';
  import CoverImage from './CoverImage.svelte';

  interface Props {
    section: Section;
    items: Item[];
    onBack: () => void;
    onSelectItem: (item: Item) => void;
    titleOverride?: string;
  }

  const { section, items, onBack, onSelectItem, titleOverride }: Props = $props();

  const sectionTitle = $derived(
    titleOverride ||
      (section === 'books'
        ? strings.kid.sections.books
        : section === 'podcasts'
          ? strings.kid.sections.podcasts
          : strings.kid.sections.music)
  );

  const sectionIcon = $derived(
    section === 'books' ? '📚' : section === 'podcasts' ? '🎙️' : '🎵'
  );
</script>

<div class="grid-view kid-area">
  <header class="grid-header">
    <button type="button" class="btn-back" onclick={onBack}>
      <span aria-hidden="true">⬅️</span>
      <span>{strings.kid.actions.back}</span>
    </button>

    <div class="section-badge">
      <span aria-hidden="true">{sectionIcon}</span>
      <h2>{sectionTitle}</h2>
    </div>
  </header>

  <main class="grid-content">
    <div class="covers-grid">
      {#each items as item, index (item.id)}
        <button
          type="button"
          class="item-card"
          onclick={() => onSelectItem(item)}
        >
          <div class="card-cover">
            <CoverImage
              coverSrc={item.coverUrl}
              altText={item.title}
              dominantColor={item.dominantColor}
              size={640}
              loading={index < 6 ? 'eager' : 'lazy'}
              fetchPriority={index < 4 ? 'high' : 'auto'}
            />
          </div>

          <div class="card-info">
            <span class="card-title">{item.title}</span>
            {#if item.bookCount}
              <span class="card-badge">{item.bookCount} {item.bookCount === 1 ? 'Folge' : 'Folgen'}</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </main>
</div>

<style>
  .grid-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .grid-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .section-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: var(--font-size-xl);
    font-weight: 800;
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 32px;
  }

  /* 2 Spalten im Hochformat, 3 im Querformat (Abschnitt 5b) */
  .covers-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(300px, 1fr));
    gap: 32px;
    max-width: 1400px;
    margin: 0 auto;
  }

  @media (orientation: landscape) {
    .covers-grid {
      grid-template-columns: repeat(3, minmax(300px, 1fr));
    }
  }

  .item-card {
    background: transparent;
    border: none;
    border-radius: 32px;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    text-align: left;
    min-width: var(--cover-min-size);
    cursor: pointer;
  }

  .card-cover {
    width: 100%;
    border-radius: 28px;
    overflow: hidden;
  }

  .card-info {
    padding: 0 8px;
  }

  .card-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.3;
  }

  .card-badge {
    display: inline-block;
    margin-top: 6px;
    font-size: 16px;
    font-weight: 600;
    color: var(--accent-books);
    background: rgba(245, 158, 11, 0.15);
    padding: 2px 10px;
    border-radius: 8px;
  }
</style>
