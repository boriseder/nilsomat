<script lang="ts">
  import { strings } from '../strings';

  interface Props {
    message?: string;
    onRetry?: () => void;
    onBack?: () => void;
  }

  const {
    message = strings.kid.error.general,
    onRetry,
    onBack
  }: Props = $props();
</script>

<div class="error-container">
  <div class="error-card">
    <span class="error-icon" aria-hidden="true">🧸</span>
    <p class="error-message">{message}</p>

    <div class="error-actions">
      {#if onBack}
        <button type="button" class="btn-action btn-back" onclick={onBack}>
          <span aria-hidden="true">⬅️</span>
          <span>{strings.kid.actions.back}</span>
        </button>
      {/if}

      {#if onRetry}
        <button type="button" class="btn-action btn-retry" onclick={onRetry}>
          <span aria-hidden="true">🔄</span>
          <span>{strings.kid.actions.retry}</span>
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .error-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }

  .error-card {
    background: var(--bg-surface);
    border-radius: 36px;
    padding: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    max-width: 650px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  }

  .error-icon {
    font-size: 80px;
  }

  .error-message {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
  }

  .error-actions {
    display: flex;
    gap: 20px;
    margin-top: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-action {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    padding: 0 32px;
    min-height: var(--touch-min-size);
  }

  .btn-retry {
    background-color: var(--accent-action);
  }
</style>
