<script lang="ts">
  import type { Item, Section } from '../types';
  import { strings } from '../strings';
  import ContinueListening from './ContinueListening.svelte';
  import Icon from '../icons/Icon.svelte';

  interface Props {
    activeSections?: Section[];
    recentItems?: Item[];
    onSelectSection: (section: Section) => void;
    onSelectRecent?: (item: Item) => void;
    onParentTrigger: () => void;
  }

  const {
    activeSections = ['books', 'podcasts', 'music'],
    recentItems = [],
    onSelectSection,
    onSelectRecent = () => {},
    onParentTrigger
  }: Props = $props();

  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  function startHold(): void {
    holdTimer = setTimeout(() => {
      onParentTrigger();
    }, 3000);
  }

  function cancelHold(): void {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }
</script>

<div class="kid-area home-view">
  <header class="header">
    <div
      class="logo-area"
      role="button"
      tabindex="0"
      aria-label={strings.kid.appName}
      onpointerdown={startHold}
      onpointerup={cancelHold}
      onpointercancel={cancelHold}
      onpointerleave={cancelHold}
    >
      <div class="logo-badge">
        <Icon name="sparkle" size={32} color="#fbbf24" />
      </div>
      <h1 class="app-title">{strings.kid.appName}</h1>
    </div>
  </header>

  {#if recentItems.length > 0}
    <ContinueListening items={recentItems} onSelectItem={onSelectRecent} />
  {/if}

  <main class="grid-container">
    {#if activeSections.includes('books')}
      <button
        type="button"
        class="tile tile-books"
        onclick={() => onSelectSection('books')}
      >
        <div class="tile-icon-box">
          <Icon name="books" size={68} color="#ffffff" />
        </div>
        <span class="tile-label">{strings.kid.sections.books}</span>
      </button>
    {/if}

    {#if activeSections.includes('podcasts')}
      <button
        type="button"
        class="tile tile-podcasts"
        onclick={() => onSelectSection('podcasts')}
      >
        <div class="tile-icon-box">
          <Icon name="podcasts" size={68} color="#ffffff" />
        </div>
        <span class="tile-label">{strings.kid.sections.podcasts}</span>
      </button>
    {/if}

    {#if activeSections.includes('music')}
      <button
        type="button"
        class="tile tile-music"
        onclick={() => onSelectSection('music')}
      >
        <div class="tile-icon-box">
          <Icon name="music" size={68} color="#ffffff" />
        </div>
        <span class="tile-label">{strings.kid.sections.music}</span>
      </button>
    {/if}
  </main>
</div>

<style>
  .home-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .header {
    padding: 28px 32px 16px 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .logo-area {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    padding: 8px 20px;
    border-radius: 9999px;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .logo-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.4));
  }

  .app-title {
    font-size: var(--font-size-title);
    font-weight: 900;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .grid-container {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 36px;
    padding: 32px;
    flex-wrap: wrap;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .tile {
    width: clamp(240px, 24vw, 300px);
    height: clamp(240px, 24vw, 300px);
    border-radius: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-width: var(--touch-min-size);
    min-height: var(--touch-min-size);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, filter 0.2s ease;
    cursor: pointer;
  }

  .tile:hover {
    transform: translateY(-4px) scale(1.02);
    filter: brightness(1.06);
  }

  .tile:active {
    transform: scale(0.96);
  }

  .tile-books {
    background: linear-gradient(145deg, #f59e0b, #d97706 60%, #b45309);
    box-shadow: 0 16px 36px rgba(217, 119, 6, 0.35), inset 0 2px 0 rgba(255, 255, 255, 0.35);
  }

  .tile-podcasts {
    background: linear-gradient(145deg, #8b5cf6, #7c3aed 60%, #6d28d9);
    box-shadow: 0 16px 36px rgba(124, 58, 237, 0.35), inset 0 2px 0 rgba(255, 255, 255, 0.35);
  }

  .tile-music {
    background: linear-gradient(145deg, #ec4899, #db2777 60%, #be185d);
    box-shadow: 0 16px 36px rgba(219, 39, 119, 0.35), inset 0 2px 0 rgba(255, 255, 255, 0.35);
  }

  .tile-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
  }

  .tile-label {
    font-size: var(--font-size-lg);
    font-weight: 800;
    letter-spacing: -0.01em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>
