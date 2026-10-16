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

  let viewMode = $state<'grid' | 'list'>('grid');

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

  function formatDuration(sec?: number): string {
    if (!sec) return '';
    const mins = Math.max(1, Math.round(sec / 60));
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hours} Std. ${rem} Min.` : `${hours} Std.`;
    }
    return `${mins} Min.`;
  }
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

    <!-- Umschalter Kacheln / Liste (besonders für Serien mit 50+ Folgen) -->
    <div class="view-toggle" role="group" aria-label="Ansicht wählen">
      <button
        type="button"
        class="btn-toggle-view"
        class:active={viewMode === 'grid'}
        onclick={() => (viewMode = 'grid')}
        aria-label={strings.kid.views.grid}
      >
        <Icon name="grid" size={22} />
        <span class="toggle-label">{strings.kid.views.grid}</span>
      </button>
      <button
        type="button"
        class="btn-toggle-view"
        class:active={viewMode === 'list'}
        onclick={() => (viewMode = 'list')}
        aria-label={strings.kid.views.list}
      >
        <Icon name="list" size={22} />
        <span class="toggle-label">{strings.kid.views.list}</span>
      </button>
    </div>
  </header>

  <main class="grid-content">
    {#if viewMode === 'grid'}
      <!-- Kachel-Raster -->
      <div class="covers-grid">
        {#each items as item, index (item.id)}
          <button
            type="button"
            class="item-card"
            class:is-series={item.kind === 'series'}
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

              <!-- Indikator auf dem Cover: Serie oder Folgennummer -->
              {#if item.kind === 'series'}
                <div class="card-sticker-badge series-badge">
                  <span class="sticker-star">★</span>
                  <span>
                    {item.bookCount
                      ? `${item.bookCount} ${item.bookCount === 1 ? strings.kid.types.episode : strings.kid.types.episodes}`
                      : strings.kid.types.series}
                  </span>
                </div>
              {:else if item.sequence}
                <div class="card-sticker-badge sequence-badge">
                  <span>{strings.kid.types.episode} {item.sequence}</span>
                </div>
              {/if}
            </div>

            <div class="card-info">
              <span class="card-title">{item.title}</span>
              <div class="card-meta-line">
                {#if item.kind === 'series'}
                  <span class="type-pill pill-series">
                    📚 {strings.kid.types.series}{item.bookCount ? ` · ${item.bookCount} ${item.bookCount === 1 ? strings.kid.types.episode : strings.kid.types.episodes}` : ''}
                  </span>
                {:else if item.section === 'books'}
                  <span class="type-pill pill-audiobook">
                    📖 {item.sequence ? `${strings.kid.types.episode} ${item.sequence}` : strings.kid.types.audiobook}{item.durationSec ? ` · ${formatDuration(item.durationSec)}` : ''}
                  </span>
                {:else if item.durationSec}
                  <span class="type-pill pill-duration">
                    {formatDuration(item.durationSec)}
                  </span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <!-- Listen-Ansicht: Schnell, kompakt und übersichtlich bei 50+ Folgen -->
      <div class="items-list">
        {#each items as item, index (item.id)}
          <button
            type="button"
            class="item-list-row"
            class:is-series={item.kind === 'series'}
            onclick={() => onSelectItem(item)}
          >
            <div class="list-index-badge">
              <span>{item.sequence || (index + 1)}</span>
            </div>

            <div class="list-cover">
              <CoverImage
                coverSrc={item.coverUrl}
                altText={item.title}
                dominantColor={item.dominantColor}
                size={320}
                loading={index < 12 ? 'eager' : 'lazy'}
              />
            </div>

            <div class="list-info">
              <span class="list-title">{item.title}</span>
              <div class="list-meta">
                {#if item.kind === 'series'}
                  <span class="type-pill pill-series">
                    📚 {strings.kid.types.series}{item.bookCount ? ` · ${item.bookCount} ${item.bookCount === 1 ? strings.kid.types.episode : strings.kid.types.episodes}` : ''}
                  </span>
                {:else if item.section === 'books'}
                  <span class="type-pill pill-audiobook">
                    📖 {item.sequence ? `${strings.kid.types.episode} ${item.sequence}` : strings.kid.types.audiobook}
                  </span>
                  {#if item.durationSec}
                    <span class="list-duration">{formatDuration(item.durationSec)}</span>
                  {/if}
                {:else if item.durationSec}
                  <span class="list-duration">{formatDuration(item.durationSec)}</span>
                {/if}
              </div>
            </div>

            <div class="list-action-badge">
              <Icon name={item.kind === 'series' ? 'skip-next' : 'play'} size={26} color="#ffffff" />
            </div>
          </button>
        {/each}
      </div>
    {/if}
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
    gap: 20px;
    padding: 20px 32px;
    background: rgba(14, 19, 38, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 10;
    flex-wrap: wrap;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(30, 38, 69, 0.85);
    border: 1.5px solid rgba(255, 255, 255, 0.18);
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

  /* Umschalter: Kacheln vs. Liste */
  .view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: rgba(22, 28, 50, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    border-radius: 9999px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    height: var(--touch-min-size);
  }

  .btn-toggle-view {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 20px;
    height: 100%;
    border-radius: 9999px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 17px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-toggle-view:hover {
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  .btn-toggle-view:active {
    transform: scale(0.96);
  }

  .btn-toggle-view.active {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #ffffff;
    box-shadow: 0 6px 18px rgba(245, 158, 11, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 32px 32px 48px 32px;
  }

  /* Responsive Raster: iPad mind. 300px (2 Spalten hoch, 3 quer) */
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
    gap: 14px;
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
    border: 1.5px solid rgba(255, 255, 255, 0.14);
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

  .sequence-badge {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  }

  .sticker-star {
    font-size: 14px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  .card-info {
    padding: 0 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
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

  .card-meta-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Type Pill für Kennzeichnung Serie / Hörbuch */
  .type-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .pill-series {
    background: rgba(245, 158, 11, 0.22);
    color: #fbbf24;
    border: 1.5px solid rgba(245, 158, 11, 0.45);
  }

  .pill-audiobook {
    background: rgba(59, 130, 246, 0.18);
    color: #93c5fd;
    border: 1.5px solid rgba(59, 130, 246, 0.35);
  }

  .pill-duration {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  /* Listen-Ansicht */
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
  }

  .item-list-row {
    min-height: 84px;
    background: rgba(26, 33, 56, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(255, 255, 255, 0.14);
    border-radius: 28px;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 18px;
    text-align: left;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease;
  }

  .item-list-row:hover {
    transform: translateY(-2px) scale(1.008);
    background: rgba(38, 48, 80, 0.96);
    border-color: rgba(255, 255, 255, 0.26);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
  }

  .item-list-row:active {
    transform: scale(0.97);
  }

  .list-index-badge {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1.5px solid rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 800;
    color: var(--text-primary);
    flex-shrink: 0;
  }

  .list-cover {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  }

  .list-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
    min-width: 0;
  }

  .list-title {
    font-size: var(--font-size-base);
    font-weight: 800;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }

  .list-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .list-duration {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .list-action-badge {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: transform 0.15s ease;
  }

  .item-list-row.is-series .list-action-badge {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    box-shadow: 0 6px 18px rgba(245, 158, 11, 0.4);
  }
</style>
