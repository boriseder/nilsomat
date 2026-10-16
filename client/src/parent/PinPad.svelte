<script lang="ts">
  import { strings } from '../strings';

  interface Props {
    isSetup?: boolean;
    isLocked?: boolean;
    remainingSeconds?: number;
    error?: string;
    onSuccess: (pin: string) => void;
    onCancel?: () => void;
  }

  const {
    isSetup = false,
    isLocked = false,
    remainingSeconds = 0,
    error = '',
    onSuccess,
    onCancel
  }: Props = $props();

  let enteredPin = $state('');

  function handleDigit(digit: string): void {
    if (isLocked) return;
    if (enteredPin.length < 8) {
      enteredPin += digit;
    }
  }

  function handleBackspace(): void {
    if (enteredPin.length > 0) {
      enteredPin = enteredPin.slice(0, -1);
    }
  }

  function handleClear(): void {
    enteredPin = '';
  }

  function handleSubmit(): void {
    if (isLocked) return;
    if (enteredPin.length >= 4 && enteredPin.length <= 8) {
      onSuccess(enteredPin);
      enteredPin = '';
    }
  }
</script>

<div class="pinpad-container">
  <div class="pinpad-header">
    <h3 class="pinpad-title">
      {isSetup ? strings.parent.setupTitle : strings.parent.title}
    </h3>
    <p class="pinpad-prompt">
      {isSetup ? strings.parent.setupPrompt : strings.parent.pinPrompt}
    </p>
  </div>

  {#if isLocked}
    <div class="lockout-banner">
      <span class="lock-icon" aria-hidden="true">🔒</span>
      <p class="lock-text">
        {strings.parent.pinLocked} ({remainingSeconds}s)
      </p>
    </div>
  {:else}
    <!-- PIN Mask Display -->
    <div class="pin-display">
      {#each Array(Math.max(4, enteredPin.length)) as _, i}
        <div class="pin-dot" class:filled={i < enteredPin.length}></div>
      {/each}
    </div>

    {#if error}
      <p class="error-msg">{error}</p>
    {/if}

    <!-- Keypad Grid -->
    <div class="keypad-grid">
      {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
        <button
          type="button"
          class="key-btn"
          onclick={() => handleDigit(digit)}
        >
          {digit}
        </button>
      {/each}
      <button
        type="button"
        class="key-btn action-key"
        onclick={handleBackspace}
        aria-label="Letzte Ziffer löschen"
      >
        ⌫
      </button>
      <button
        type="button"
        class="key-btn"
        onclick={() => handleDigit('0')}
      >
        0
      </button>
      <button
        type="button"
        class="key-btn submit-key"
        disabled={enteredPin.length < 4}
        onclick={handleSubmit}
        aria-label={strings.parent.pinSubmit}
      >
        ✓
      </button>
    </div>

    {#if onCancel}
      <div class="cancel-row">
        <button type="button" class="btn-cancel" onclick={onCancel}>
          {strings.parent.pinCancel}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .pinpad-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    user-select: none;
    -webkit-user-select: none;
  }

  .pinpad-header {
    text-align: center;
  }

  .pinpad-title {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-primary);
  }

  .pinpad-prompt {
    font-size: 18px;
    color: var(--text-secondary);
  }

  .pin-display {
    display: flex;
    gap: 16px;
    margin: 8px 0;
  }

  .pin-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: transparent;
    transition: all 0.15s ease;
  }

  .pin-dot.filled {
    background: var(--accent);
    transform: scale(1.15);
  }

  .error-msg {
    color: #ef4444;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
  }

  .lockout-banner {
    background: rgba(239, 68, 68, 0.15);
    border: 2px solid #ef4444;
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    color: #ef4444;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .lock-icon {
    font-size: 40px;
  }

  .lock-text {
    font-size: 18px;
    font-weight: 600;
  }

  .keypad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;
  }

  .key-btn {
    height: 76px;
    min-height: 72px;
    font-size: 30px;
    font-weight: 600;
    border-radius: 20px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .key-btn:active {
    background: var(--accent);
    color: #ffffff;
    transform: scale(0.96);
  }

  .action-key {
    font-size: 24px;
    color: var(--text-secondary);
  }

  .submit-key {
    background: #10b981;
    color: #ffffff;
    font-size: 28px;
  }

  .submit-key:disabled {
    opacity: 0.35;
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .cancel-row {
    margin-top: 8px;
  }

  .btn-cancel {
    font-size: 18px;
    color: var(--text-secondary);
    background: transparent;
    padding: 12px 24px;
  }
</style>
