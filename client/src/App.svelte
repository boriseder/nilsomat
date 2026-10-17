<script lang="ts">
  import { onMount } from 'svelte';
  import type { Item, Section, Track } from './types';
  import DailyLimitView from './kid/DailyLimitView.svelte';
  import EpisodeList from './kid/EpisodeList.svelte';
  import ErrorView from './kid/ErrorView.svelte';
  import ItemGrid from './kid/ItemGrid.svelte';
  import KidHome from './kid/KidHome.svelte';
  import LoadingView from './kid/LoadingView.svelte';
  import ParentSettings from './parent/ParentSettings.svelte';
  import { audioEngine, type PlayerState } from './player/AudioEngine';
  import FullscreenPlayer from './player/FullscreenPlayer.svelte';
  import MiniPlayer from './player/MiniPlayer.svelte';

  let currentView = $state<'home' | 'grid' | 'episodes' | 'series'>('home');
  let selectedSection = $state<Section | null>(null);
  let selectedItem = $state<Item | null>(null);
  let selectedSeries = $state<Item | null>(null);
  let seriesBooks = $state<Item[]>([]);
  let activeSections = $state<Section[]>(['books', 'podcasts', 'music']);
  let items = $state<Item[]>([]);
  let tracks = $state<Track[]>([]);
  let recentItems = $state<Item[]>([]);
  let loading = $state(false);
  let hasError = $state(false);
  let showParent = $state(false);
  let showFullscreenPlayer = $state(false);
  let dailyLimitReached = $state(false);
  let isConfigured = $state(true);

  let playerState = $state<PlayerState>(audioEngine.getState());

  onMount(() => {
    checkKidStatus();
    loadSections();
    const unsubscribe = audioEngine.subscribe((state) => {
      playerState = state;
    });
    return unsubscribe;
  });

  async function checkKidStatus(): Promise<void> {
    try {
      const res = await fetch('/api/kid/status');
      if (res.ok) {
        const data = await res.json();
        isConfigured = data.configured;
        dailyLimitReached = data.dailyLimitReached;
        if (!isConfigured) {
          showParent = true;
        }
      }
    } catch {}
  }

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

    if (item.kind === 'series') {
      selectedSeries = item;
      loading = true;
      hasError = false;
      currentView = 'series';
      try {
        const res = await fetch(`/api/kid/series/${encodeURIComponent(item.id)}/items`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        seriesBooks = data.items || [];
        loading = false;
      } catch {
        loading = false;
        hasError = true;
      }
    } else if (item.kind === 'podcast') {
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
    } else {
      // Hörbuch oder Album/Playlist: Tracks laden und abspielen
      loading = true;
      hasError = false;
      try {
        const res = await fetch(`/api/kid/tracks/${encodeURIComponent(item.id)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const itemTracks: Track[] = data.tracks || [];
        loading = false;

        if (itemTracks.length > 0) {
          showFullscreenPlayer = true;
          const totalPositionSec = item.progress?.positionSec || 0;
          let targetIndex = 0;
          let targetOffset = 0;

          if (totalPositionSec > 0 && !item.progress?.finished) {
            let accumulated = 0;
            for (let i = 0; i < itemTracks.length; i++) {
              const dur = itemTracks[i].durationSec || 0;
              if (accumulated + dur > totalPositionSec) {
                targetIndex = i;
                targetOffset = totalPositionSec - accumulated;
                break;
              }
              accumulated += dur;
            }
          }

          await audioEngine.playItem(item, itemTracks, targetIndex, targetOffset);
        }
      } catch {
        loading = false;
        hasError = true;
      }
    }
  }

  async function handlePlayTrack(track: Track, allTracks: Track[]): Promise<void> {
    if (!selectedItem) return;
    const index = allTracks.findIndex((t) => t.id === track.id);
    await audioEngine.playItem(selectedItem, allTracks, Math.max(0, index));
    showFullscreenPlayer = true;
  }

  function handleBackToHome(): void {
    currentView = 'home';
    selectedSection = null;
    selectedItem = null;
    selectedSeries = null;
    seriesBooks = [];
    items = [];
    tracks = [];
    hasError = false;
  }

  function handleBackToGrid(): void {
    currentView = 'grid';
    selectedItem = null;
    selectedSeries = null;
    seriesBooks = [];
    tracks = [];
    hasError = false;
  }

  function handleParentTrigger(): void {
    showParent = true;
  }

  function handleCloseParent(): void {
    showParent = false;
    checkKidStatus();
    loadSections();
  }
</script>

<div
  class="app-root"
  role="none"
  onclick={handleInteraction}
  onkeydown={handleInteraction}
>
  {#if dailyLimitReached}
    <DailyLimitView onParentTrigger={handleParentTrigger} />
  {:else if hasError}
    <ErrorView
      onBack={currentView !== 'home' ? handleBackToHome : undefined}
      onRetry={() => {
        if (currentView === 'series' && selectedSeries) {
          handleSelectItem(selectedSeries);
        } else if (selectedSection) {
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
  {:else if currentView === 'series' && selectedSeries}
    <ItemGrid
      section="books"
      titleOverride={selectedSeries.title}
      items={seriesBooks}
      onBack={handleBackToGrid}
      onSelectItem={handleSelectItem}
    />
  {:else if currentView === 'episodes' && selectedItem}
    <EpisodeList
      podcast={selectedItem}
      {tracks}
      onBack={handleBackToGrid}
      onPlayTrack={handlePlayTrack}
    />
  {/if}

  <!-- Mini-Player: Erscheint, wenn ein Track geladen ist und der Vollbild-Player geschlossen ist -->
  {#if !showFullscreenPlayer && playerState.currentItem && playerState.currentTrack}
    <MiniPlayer
      item={playerState.currentItem}
      track={playerState.currentTrack}
      isPlaying={playerState.isPlaying}
      currentTime={playerState.currentTime}
      duration={playerState.duration}
      onOpenFullscreen={() => (showFullscreenPlayer = true)}
    />
  {/if}

  <!-- Vollbild-Player -->
  {#if showFullscreenPlayer && playerState.currentItem && playerState.currentTrack}
    <FullscreenPlayer
      item={playerState.currentItem}
      track={playerState.currentTrack}
      tracks={playerState.tracks}
      trackIndex={playerState.trackIndex}
      isPlaying={playerState.isPlaying}
      currentTime={playerState.currentTime}
      duration={playerState.duration}
      sleepTimerDuration={playerState.sleepTimerDuration}
      onClose={() => (showFullscreenPlayer = false)}
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
    position: relative;
  }
</style>
