<script lang="ts">
  import { strings } from '../strings';

  interface Props {
    onParentTrigger?: () => void;
  }

  const { onParentTrigger }: Props = $props();

  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  function startHold(): void {
    if (!onParentTrigger) return;
    holdTimer = setTimeout(() => {
      onParentTrigger();
    }, 3000);
  }

  function cancelHold(): void {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }
</script>

<div class="limit-screen">
  <div
    class="icon-container"
    role="button"
    tabindex="0"
    aria-label={strings.kid.status.dailyLimitReached}
    onpointerdown={startHold}
    onpointerup={cancelHold}
    onpointercancel={cancelHold}
    onpointerleave={cancelHold}
  >
    <span class="moon-icon" aria-hidden="true">🌙</span>
  </div>

  <h2 class="limit-message">{strings.kid.status.dailyLimitReached}</h2>
</div>

<style>
  .limit-screen {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    background-color: var(--bg-primary);
  }

  .icon-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.1);
    margin-bottom: 32px;
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
  }

  .moon-icon {
    font-size: 80px;
  }

  .limit-message {
    font-size: var(--font-size-title);
    font-weight: 800;
    color: var(--text-primary);
    max-width: 600px;
    line-height: 1.4;
  }
</style>
