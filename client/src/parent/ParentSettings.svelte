<script lang="ts">
  import { strings } from '../strings';

  interface Props {
    onClose: () => void;
  }

  const { onClose }: Props = $props();
</script>

<div class="parent-overlay">
  <div class="parent-modal">
    <header class="modal-header">
      <h2>{strings.parent.title}</h2>
      <button type="button" class="btn-close" onclick={onClose}>
        ✕
      </button>
    </header>

    <div class="modal-content">
      <p>{strings.parent.pinPrompt}</p>
      <!-- PIN-Eingabe und Einstellungen folgen in Meilenstein 5 -->
    </div>
  </div>
</div>

<style>
  .parent-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .parent-modal {
    background: var(--bg-surface);
    color: var(--text-primary);
    border-radius: 24px;
    width: 100%;
    max-width: 600px;
    padding: 32px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .btn-close {
    width: 56px;
    height: 56px;
    min-width: 56px;
    min-height: 56px;
    border-radius: 50%;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 24px;
  }
</style>
