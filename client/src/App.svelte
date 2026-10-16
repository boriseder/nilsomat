<script lang="ts">
  import { onMount } from 'svelte';
  import type { Item, Section, Track } from './types';
  import EpisodeList from './kid/EpisodeList.svelte';
  import ErrorView from './kid/ErrorView.svelte';
  import ItemGrid from './kid/ItemGrid.svelte';
  import KidHome from './kid/KidHome.svelte';
  import LoadingView from './kid/LoadingView.svelte';
  import ParentSettings from './parent/ParentSettings.svelte';
  import { audioEngine } from './player/AudioEngine';

  let currentView = $state<'home' | 'grid' | 'episodes'>('home');
  let selectedSection = $state<Section | null>(null);
  let selectedItem = $state<Item | null>(null);
  let activeSections = $state<Section[]>(['books', 'podcasts', 'music']);
  let items = $state<Item[]>([]);
  let tracks = $state<Track[]>([]);
  let recentItems = $state<Item[]>([]);
  let loading = $state(false);
  let hasError = $state(false);
  let showParent = $state(false);

  function handleInteraction(): void {
    audioEngine.init();
  }

  async function loadSections(): Promise<void> {
    try {
      const res = await fetch('/api/kid/sections');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          activeSections = data.sections;
        }
      }
    } catch {
      // Behalte Standard-Sektionen
    }
  }

  onMount(() => {
    loadSections();
  });

  async function handleSelectSection(sec: Section): Promise<void> {
    handleInteraction();
    selectedSection = sec;
    loading = true;
    hasError = false;
    currentView = 'grid';

    try {
      const res = await fetch(`/api/kid/items?section=${sec}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      items = data.items || [];
      loading = false;
    } catch {
      loading = false;
      hasError = true;
    }
  }

  async function handleSelectItem(item: Item): Promise<void> {
    handleInteraction();
    selectedItem = item;

    if (item.kind === 'podcast') {
      loading = true;
      hasError = false;
      currentView = 'episodes';
      try {
        const res = await fetch(`/api/kid/tracks/${encodeURIComponent(item.id)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        tracks = data.tracks || [];
        loading = false;
      } catch {
        loading = false;
        hasError = true;
      }
    }
  }

  function handleBackToHome(): void {
    currentView = 'home';
    selectedSection = null;
    selectedItem = null;
    items = [];
    tracks = [];
    hasError = false;
  }

  function handleBackToGrid(): void {
    currentView = 'grid';
    selectedItem = null;
    tracks = [];
    hasError = false;
  }

  function handleParentTrigger(): void {
    showParent = true;
  }

  function handleCloseParent(): void {
    showParent = false;
  }
</script>

<div
  class="app-root"
  role="none"
  onclick={handleInteraction}
  onkeydown={handleInteraction}
>
  {#if hasError}
    <ErrorView
      onBack={currentView !== 'home' ? handleBackToHome : undefined}
      onRetry={() => {
        if (selectedSection) {
          handleSelectSection(selectedSection);
        } else {
          loadSections();
        }
      }}
    />
  {:else if loading}
    <LoadingView onTimeout={() => (hasError = true)} />
  {:else if currentView === 'home'}
    <KidHome
      {activeSections}
      {recentItems}
      onSelectSection={handleSelectSection}
      onSelectRecent={handleSelectItem}
      onParentTrigger={handleParentTrigger}
    />
  {:else if currentView === 'grid' && selectedSection}
    <ItemGrid
      section={selectedSection}
      {items}
      onBack={handleBackToHome}
      onSelectItem={handleSelectItem}
    />
  {:else if currentView === 'episodes' && selectedItem}
    <EpisodeList
      podcast={selectedItem}
      {tracks}
      onBack={handleBackToGrid}
      onPlayTrack={(track) => console.log('Play episode:', track.title)}
    />
  {/if}

  {#if showParent}
    <ParentSettings onClose={handleCloseParent} />
  {/if}
</div>

<style>
  .app-root {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-primary);
    overflow: hidden;
  }
</style>
