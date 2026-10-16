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
    background: rgba(26, 33, 56, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    border-radius: 40px;
    padding: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 26px;
    max-width: 620px;
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.6),
      0 4px 16px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .error-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 108px;
    height: 108px;
    border-radius: 36px;
    background: rgba(245, 158, 11, 0.14);
    border: 1.5px solid rgba(245, 158, 11, 0.35);
    box-shadow: 0 0 32px rgba(245, 158, 11, 0.25);
    filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.4));
  }

  .error-message {
    font-size: var(--font-size-title);
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .error-actions {
    display: flex;
    gap: 20px;
    margin-top: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-action {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 0 36px;
    min-height: var(--touch-min-size);
    border-radius: 9999px;
    font-size: var(--font-size-base);
    font-weight: 800;
    cursor: pointer;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.35),
      inset 0 1.5px 0 rgba(255, 255, 255, 0.2);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, filter 0.15s ease;
  }

  .btn-action:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.45),
      inset 0 1.5px 0 rgba(255, 255, 255, 0.25);
  }

  .btn-action:active {
    transform: scale(0.94);
  }

  .btn-back {
    background: rgba(38, 48, 80, 0.9);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    color: var(--text-primary);
  }

  .btn-retry {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    box-shadow:
      0 10px 28px rgba(16, 185, 129, 0.45),
      inset 0 2px 0 rgba(255, 255, 255, 0.35);
  }

  .btn-retry:hover {
    filter: brightness(1.08);
    box-shadow:
      0 14px 32px rgba(16, 185, 129, 0.55),
      inset 0 2px 0 rgba(255, 255, 255, 0.4);
  }
</style>
