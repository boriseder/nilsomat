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
    section === 'books' ? '#f59e0b' : section === 'podcasts' ? '#a78bfa' : '#fb7185'
  );
</script>

<div class="grid-view kid-area">
  <header class="grid-header">
    <button type="button" class="btn-back" onclick={onBack}>
      <Icon name="back" size={26} />
      <span>{strings.kid.actions.back}</span>
    </button>

    <div class="section-badge">
      <div class="section-icon-wrap" style="color: {sectionColor}; filter: drop-shadow(0 0 10px {sectionColor}66);">
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
          <div class="card-cover-container">
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

            {#if item.bookCount}
              <div class="card-sticker-badge">
                <span class="sticker-star">★</span>
                <span>{item.bookCount} {item.bookCount === 1 ? 'Folge' : 'Folgen'}</span>
              </div>
            {/if}
          </div>

          <div class="card-info">
            <span class="card-title">{item.title}</span>
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

  .section-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: var(--font-size-xl);
    font-weight: 900;
    letter-spacing: -0.01em;
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
    padding: 36px 32px 48px 32px;
  }

  /* Responsive Raster: iPad mind. 300px (2 Spalten hoch, 3 quer), auf großen Desktop-Bildschirmen bis zu 4-5 Spalten */
  .covers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 36px;
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
    border-radius: 36px;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    text-align: left;
    min-width: var(--cover-min-size);
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .item-card:hover {
    transform: translateY(-8px) scale(1.03);
  }

  .item-card:active {
    transform: scale(0.96);
  }

  .card-cover-container {
    position: relative;
    width: 100%;
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: var(--bg-surface);
  }

  .card-cover {
    width: 100%;
    aspect-ratio: 1 / 1;
  }

  /* Sammelkarten Sticker-Badge */
  .card-sticker-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #ffffff;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.01em;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
  }

  .sticker-star {
    font-size: 14px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  .card-info {
    padding: 0 10px;
  }

  .card-title {
    font-size: var(--font-size-base);
    font-weight: 800;
    color: var(--text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.3;
  }
</style>
