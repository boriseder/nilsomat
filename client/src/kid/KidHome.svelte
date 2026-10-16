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
  let isHolding = $state(false);

  function startHold(): void {
    isHolding = true;
    holdTimer = setTimeout(() => {
      isHolding = false;
      onParentTrigger();
    }, 3000);
  }

  function cancelHold(): void {
    isHolding = false;
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
      class:holding={isHolding}
      onpointerdown={startHold}
      onpointerup={cancelHold}
      onpointercancel={cancelHold}
      onpointerleave={cancelHold}
    >
      <div class="logo-badge" class:holding-glow={isHolding}>
        <Icon name="sparkle" size={34} color="#fbbf24" />
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
          <Icon name="books" size={72} color="#ffffff" />
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
          <Icon name="podcasts" size={72} color="#ffffff" />
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
          <Icon name="music" size={72} color="#ffffff" />
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
    padding: 32px 32px 16px 32px;
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
    padding: 10px 24px;
    border-radius: 9999px;
    background: rgba(30, 38, 69, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .logo-area.holding {
    border-color: rgba(251, 191, 36, 0.5);
    box-shadow: 0 0 24px rgba(251, 191, 36, 0.35);
  }

  .logo-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
    animation: nightlight-pulse 4s infinite ease-in-out;
  }

  .logo-badge.holding-glow {
    filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.9));
  }

  @keyframes nightlight-pulse {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.35));
    }
    50% {
      transform: scale(1.08);
      filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.65));
    }
  }

  .app-title {
    font-size: var(--font-size-title);
    font-weight: 900;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #ffffff 40%, #e2e8f0 100%);
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
    width: clamp(250px, 25vw, 320px);
    height: clamp(250px, 25vw, 320px);
    border-radius: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 22px;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    min-width: var(--touch-min-size);
    min-height: var(--touch-min-size);
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, filter 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  /* Subtile Glanzkante oben */
  .tile::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%);
    pointer-events: none;
    border-radius: 44px 44px 0 0;
  }

  .tile:hover {
    transform: translateY(-8px) scale(1.04);
    filter: brightness(1.08);
  }

  .tile:active {
    transform: scale(0.95);
  }

  .tile-books {
    background: linear-gradient(145deg, #f59e0b 0%, #d97706 60%, #b45309 100%);
    box-shadow: 0 20px 42px rgba(217, 119, 6, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.45);
  }

  .tile-books:hover {
    box-shadow: 0 26px 52px rgba(245, 158, 11, 0.55), inset 0 2px 0 rgba(255, 255, 255, 0.55);
  }

  .tile-podcasts {
    background: linear-gradient(145deg, #8b5cf6 0%, #7c3aed 60%, #6d28d9 100%);
    box-shadow: 0 20px 42px rgba(124, 58, 237, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.45);
  }

  .tile-podcasts:hover {
    box-shadow: 0 26px 52px rgba(139, 92, 246, 0.55), inset 0 2px 0 rgba(255, 255, 255, 0.55);
  }

  .tile-music {
    background: linear-gradient(145deg, #f43f5e 0%, #e11d48 60%, #be123c 100%);
    box-shadow: 0 20px 42px rgba(225, 29, 72, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.45);
  }

  .tile-music:hover {
    box-shadow: 0 26px 52px rgba(244, 63, 94, 0.55), inset 0 2px 0 rgba(255, 255, 255, 0.55);
  }

  .tile-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
  }

  .tile-label {
    font-size: var(--font-size-lg);
    font-weight: 900;
    letter-spacing: -0.01em;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }
</style>
