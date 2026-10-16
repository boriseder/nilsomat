<script lang="ts">
  import { strings } from '../strings';
  import Icon from '../icons/Icon.svelte';

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
    <div class="error-icon-box">
      <Icon name="sparkle" size={64} color="#f59e0b" />
    </div>
    <p class="error-message">{message}</p>

    <div class="error-actions">
      {#if onBack}
        <button type="button" class="btn-action btn-back" onclick={onBack}>
          <Icon name="back" size={26} />
          <span>{strings.kid.actions.back}</span>
        </button>
      {/if}

      {#if onRetry}
        <button type="button" class="btn-action btn-retry" onclick={onRetry}>
          <Icon name="reload" size={26} />
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
    background: rgba(30, 41, 59, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 36px;
    padding: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    max-width: 650px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5);
  }

  .error-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.4));
  }

  .error-message {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .error-actions {
    display: flex;
    gap: 20px;
    margin-top: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-action {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 0 32px;
    min-height: var(--touch-min-size);
    border-radius: 9999px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .btn-action:hover {
    transform: translateY(-2px);
  }

  .btn-action:active {
    transform: scale(0.96);
  }

  .btn-back {
    background: rgba(51, 65, 85, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
  }

  .btn-retry {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #ffffff;
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
  }
</style>
