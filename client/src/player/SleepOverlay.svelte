<script lang="ts">
  import { strings } from '../strings';
  import Icon from '../icons/Icon.svelte';

  interface Props {
    onDismiss: () => void;
  }

  const { onDismiss }: Props = $props();
</script>

<div
  class="sleep-overlay kid-area"
  role="dialog"
  aria-modal="true"
  aria-label={strings.kid.status.sleepTimerExpired}
  onclick={onDismiss}
  onkeydown={(e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      onDismiss();
    }
  }}
  tabindex="0"
>
  <div class="stars-bg" aria-hidden="true">
    <div class="star star-1"><Icon name="sparkle" size={28} color="#93c5fd" /></div>
    <div class="star star-2"><Icon name="sparkle" size={20} color="#fbbf24" /></div>
    <div class="star star-3"><Icon name="sparkle" size={24} color="#e2e8f0" /></div>
    <div class="star star-4"><Icon name="sparkle" size={18} color="#c084fc" /></div>
  </div>

  <div class="sleep-card">
    <div class="moon-wrap" aria-hidden="true">
      <div class="moon-halo"></div>
      <Icon name="moon" size={110} color="#fbbf24" />
    </div>

    <h2 class="sleep-title">{strings.kid.status.sleepTimerExpired}</h2>

    <button
      type="button"
      class="btn-wake-up"
      onclick={onDismiss}
    >
      <Icon name="play" size={28} color="#ffffff" />
      <span>{strings.kid.actions.wakeUp}</span>
    </button>
  </div>
</div>

<style>
  .sleep-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at center, #1e1b4b 0%, #070913 100%);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    padding: 32px;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
  }

  .stars-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .star {
    position: absolute;
    opacity: 0.65;
    animation: twinkle 3s infinite ease-in-out;
  }

  .star-1 { top: 18%; left: 22%; animation-delay: 0.2s; }
  .star-2 { top: 25%; right: 20%; animation-delay: 1.1s; }
  .star-3 { bottom: 28%; left: 18%; animation-delay: 1.8s; }
  .star-4 { bottom: 22%; right: 24%; animation-delay: 0.7s; }

  @keyframes twinkle {
    0%, 100% { transform: scale(0.9); opacity: 0.45; }
    50% { transform: scale(1.15); opacity: 0.9; }
  }

  .sleep-card {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 48px 40px;
    max-width: 540px;
    width: 100%;
    background: rgba(15, 23, 42, 0.88);
    border: 2px solid rgba(255, 255, 255, 0.16);
    border-radius: 40px;
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.7),
      0 0 50px rgba(99, 102, 241, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    text-align: center;
    cursor: default;
  }

  .moon-wrap {
    position: relative;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .moon-halo {
    position: absolute;
    inset: -15px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(251, 191, 36, 0) 70%);
    animation: pulse-moon 4s infinite ease-in-out;
  }

  @keyframes pulse-moon {
    0%, 100% { transform: scale(0.95); opacity: 0.6; }
    50% { transform: scale(1.1); opacity: 0.95; }
  }

  .sleep-title {
    font-size: 32px;
    font-weight: 800;
    color: #f8fafc;
    line-height: 1.3;
    letter-spacing: -0.02em;
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }

  .btn-wake-up {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: var(--touch-min-size);
    padding: 0 36px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: 2px solid rgba(255, 255, 255, 0.28);
    border-radius: 9999px;
    color: #ffffff;
    font-size: var(--font-size-base);
    font-weight: 800;
    box-shadow:
      0 10px 28px rgba(37, 99, 235, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    cursor: pointer;
    touch-action: manipulation;
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease;
  }

  .btn-wake-up:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
    border-color: rgba(255, 255, 255, 0.45);
    transform: translateY(-2px) scale(1.02);
  }

  .btn-wake-up:active {
    transform: scale(0.96);
  }

  @media (prefers-reduced-motion: reduce) {
    .star,
    .moon-halo,
    .btn-wake-up {
      animation: none;
      transition: none;
    }
  }
</style>
