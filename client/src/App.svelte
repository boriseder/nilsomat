<script lang="ts">
  import KidHome from './kid/KidHome.svelte';
  import ParentSettings from './parent/ParentSettings.svelte';
  import { audioEngine } from './player/AudioEngine';

  let showParent = $state(false);
  let currentSection = $state<'books' | 'podcasts' | 'music' | null>(null);

  function handleInteraction(): void {
    audioEngine.init();
  }

  function handleSelectSection(section: 'books' | 'podcasts' | 'music'): void {
    handleInteraction();
    currentSection = section;
  }

  function handleParentTrigger(): void {
    showParent = true;
  }

  function handleCloseParent(): void {
    showParent = false;
  }
</script>

<div class="app-root" role="none" onclick={handleInteraction} onkeydown={handleInteraction}>
  <KidHome
    onSelectSection={handleSelectSection}
    onParentTrigger={handleParentTrigger}
  />

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
  }
</style>
