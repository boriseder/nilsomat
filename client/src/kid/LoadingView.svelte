<script lang="ts">
  import { onMount } from 'svelte';
  import { strings } from '../strings';

  interface Props {
    onTimeout: () => void;
  }

  const { onTimeout }: Props = $props();

  onMount(() => {
    // Maximal 10 Sekunden Spinner, dann Fehlerbild (Abschnitt 5.3)
    const timer = setTimeout(() => {
      onTimeout();
    }, 10000);

    return () => clearTimeout(timer);
  });
</script>

<div class="loading-container">
  <div class="loading-spinner" aria-hidden="true"></div>
  <p class="loading-text">{strings.kid.status.loading}</p>
</div>

<style>
  .loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .loading-spinner {
    width: 72px;
    height: 72px;
    border: 8px solid rgba(255, 255, 255, 0.15);
    border-top-color: var(--accent-action);
    border-radius: 50%;
    animation: spin 1s infinite linear;
  }

  .loading-text {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-secondary);
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
      border-top-color: var(--text-primary);
    }
  }
</style>
