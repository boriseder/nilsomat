<script lang="ts">
  import type { Item, Section } from '../types';
  import { strings } from '../strings';
  import CoverImage from './CoverImage.svelte';
  import Icon from '../icons/Icon.svelte';

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

  const sectionIconName = $derived<'books' | 'podcasts' | 'music'>(
    section === 'books' ? 'books' : section === 'podcasts' ? 'podcasts' : 'music'
  );

  const sectionColor = $derived(
    section === 'books' ? '#f59e0b' : section === 'podcasts' ? '#a78bfa' : '#f472b6'
  );
</script>

<div class="grid-view kid-area">
  <header class="grid-header">
    <button type="button" class="btn-back" onclick={onBack}>
      <Icon name="back" size={26} />
      <span>{strings.kid.actions.back}</span>
    </button>

    <div class="section-badge">
      <div class="section-icon-wrap" style="color: {sectionColor}">
        <Icon name={sectionIconName} size={32} />
      </div>
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

  .section-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: var(--font-size-xl);
    font-weight: 800;
  }

  .section-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 32px;
  }

  /* Responsive Raster: iPad mind. 300px (2 Spalten hoch, 3 quer), auf großen Desktop-Bildschirmen bis zu 4-5 Spalten */
  .covers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 32px;
    max-width: 1500px;
    margin: 0 auto;
  }

  @media (orientation: portrait) and (max-width: 900px) {
    .covers-grid {
      grid-template-columns: repeat(2, minmax(300px, 1fr));
    }
  }

  @media (orientation: landscape) and (max-width: 1200px) {
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
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .item-card:hover {
    transform: translateY(-4px) scale(1.02);
  }

  .item-card:active {
    transform: scale(0.97);
  }

  .card-cover {
    width: 100%;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.08);
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
    margin-top: 8px;
    font-size: 16px;
    font-weight: 700;
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.16);
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 4px 14px;
    border-radius: 9999px;
  }
</style>
