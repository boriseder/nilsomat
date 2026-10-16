<script lang="ts">
  import type { Item, Section } from '../types';
  import { strings } from '../strings';
  import ContinueListening from './ContinueListening.svelte';

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

<div class="kid-area">
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
      <span class="logo-icon" aria-hidden="true">📻</span>
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
        <span class="tile-icon" aria-hidden="true">📚</span>
        <span class="tile-label">{strings.kid.sections.books}</span>
      </button>
    {/if}

    {#if activeSections.includes('podcasts')}
      <button
        type="button"
        class="tile tile-podcasts"
        onclick={() => onSelectSection('podcasts')}
      >
        <span class="tile-icon" aria-hidden="true">🎙️</span>
        <span class="tile-label">{strings.kid.sections.podcasts}</span>
      </button>
    {/if}

    {#if activeSections.includes('music')}
      <button
        type="button"
        class="tile tile-music"
        onclick={() => onSelectSection('music')}
      >
        <span class="tile-icon" aria-hidden="true">🎵</span>
        <span class="tile-label">{strings.kid.sections.music}</span>
      </button>
    {/if}
  </main>
</div>

<style>
  .header {
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-area {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
  }

  .logo-icon {
    font-size: 40px;
  }

  .app-title {
    font-size: var(--font-size-title);
    font-weight: 800;
    color: var(--text-primary);
  }

  .grid-container {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 32px;
    flex-wrap: wrap;
  }

  .tile {
    width: 260px;
    height: 260px;
    border-radius: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    color: #ffffff;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    min-width: var(--touch-min-size);
    min-height: var(--touch-min-size);
  }

  .tile-books {
    background: linear-gradient(145deg, #d97706, #b45309);
  }

  .tile-podcasts {
    background: linear-gradient(145deg, #7c3aed, #6d28d9);
  }

  .tile-music {
    background: linear-gradient(145deg, #db2777, #be185d);
  }

  .tile-icon {
    font-size: 72px;
  }

  .tile-label {
    font-size: var(--font-size-lg);
    font-weight: 700;
  }
</style>
