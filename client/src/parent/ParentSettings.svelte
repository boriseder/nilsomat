<script lang="ts">
  import { onMount } from 'svelte';
  import { strings } from '../strings';
  import type { Item } from '../types';
  import PinPad from './PinPad.svelte';

  interface Props {
    onClose: () => void;
  }

  const { onClose }: Props = $props();

  type Tab = 'connections' | 'assignment' | 'items' | 'rules' | 'status' | 'security';

  let authenticated = $state(false);
  let hasPin = $state(true);
  let isLocked = $state(false);
  let remainingSeconds = $state(0);
  let authError = $state('');

  let activeTab = $state<Tab>('connections');

  // Form State
  let absUrl = $state('');
  let absToken = $state('');
  let hasAbsToken = $state(false);
  let navidromeUrl = $state('');
  let navidromeUser = $state('');
  let navidromePassword = $state('');
  let hasNavidromePassword = $state(false);

  // Library assignments
  let absBooksLibId = $state('');
  let absPodcastsLibId = $state('');
  let availableLibraries = $state<{ id: string; name: string; mediaType: string }[]>([]);

  // Rules
  let sleepTimerDefault = $state(0);
  let dailyLimitMinutes = $state(0);

  // Status & Logs
  let statusInfo = $state<any>(null);
  let logs = $state<any[]>([]);

  // Items
  let allItems = $state<(Item & { hidden: boolean })[]>([]);
  let itemFilter = $state('');

  // Pin Change
  let currentPinInput = $state('');
  let newPinInput = $state('');
  let pinChangeMsg = $state('');
  let pinChangeError = $state('');

  // Feedbacks
  let saveMsg = $state('');
  let testAbsMsg = $state('');
  let testNavidromeMsg = $state('');
  let testingAbs = $state(false);
  let testingNavidrome = $state(false);

  onMount(() => {
    checkAuthState();
  });

  async function checkAuthState(): Promise<void> {
    try {
      const res = await fetch('/api/parent/auth-state');
      if (res.ok) {
        const data = await res.json();
        hasPin = data.hasPin;
        isLocked = data.isLocked;
        remainingSeconds = data.remainingSeconds || 0;
        authenticated = data.authenticated;

        if (authenticated) {
          loadAllData();
        }
      }
    } catch {
      // Offline / Error
    }
  }

  async function handlePinSubmit(pin: string): Promise<void> {
    authError = '';
    if (!hasPin) {
      // Erstkonfiguration
      try {
        const res = await fetch('/api/parent/init-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          hasPin = true;
          authenticated = true;
          loadAllData();
        } else {
          authError = data.error || 'Fehler beim Setzen der PIN';
        }
      } catch {
        authError = 'Netzwerkfehler';
      }
      return;
    }

    try {
      const res = await fetch('/api/parent/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        authenticated = true;
        loadAllData();
      } else {
        isLocked = data.isLocked || false;
        remainingSeconds = data.remainingSeconds || 0;
        authError = data.error || 'Falsche PIN';
      }
    } catch {
      authError = 'Netzwerkfehler';
    }
  }

  async function loadAllData(): Promise<void> {
    loadConfig();
    loadStatus();
    loadItems();
    testAbsConnection(true);
  }

  async function loadConfig(): Promise<void> {
    try {
      const res = await fetch('/api/parent/config');
      if (res.ok) {
        const cfg = await res.json();
        absUrl = cfg.absUrl || '';
        hasAbsToken = cfg.hasAbsToken;
        absBooksLibId = cfg.absBooksLibId || '';
        absPodcastsLibId = cfg.absPodcastsLibId || '';
        navidromeUrl = cfg.navidromeUrl || '';
        navidromeUser = cfg.navidromeUser || '';
        hasNavidromePassword = cfg.hasNavidromePassword;
        sleepTimerDefault = cfg.sleepTimerDefault || 0;
        dailyLimitMinutes = cfg.dailyLimitMinutes || 0;
      }
    } catch {}
  }

  async function loadStatus(): Promise<void> {
    try {
      const res = await fetch('/api/parent/status');
      if (res.ok) {
        statusInfo = await res.json();
        logs = statusInfo.logs || [];
      }
    } catch {}
  }

  async function loadItems(): Promise<void> {
    try {
      const res = await fetch('/api/parent/items');
      if (res.ok) {
        const data = await res.json();
        allItems = data.items || [];
      }
    } catch {}
  }

  async function testAbsConnection(silent = false): Promise<void> {
    if (!silent) testingAbs = true;
    testAbsMsg = '';
    try {
      const res = await fetch('/api/parent/test-abs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: absUrl, token: absToken || undefined })
      });
      const data = await res.json();
      if (data.ok) {
        availableLibraries = data.libraries || [];
        if (!silent) testAbsMsg = strings.parent.connections.testSuccess;
      } else if (!silent) {
        testAbsMsg = `${strings.parent.connections.testFailed}: ${data.error || ''}`;
      }
    } catch {
      if (!silent) testAbsMsg = strings.parent.connections.testFailed;
    } finally {
      if (!silent) testingAbs = false;
    }
  }

  async function testNavidromeConnection(): Promise<void> {
    testingNavidrome = true;
    testNavidromeMsg = '';
    try {
      const res = await fetch('/api/parent/test-navidrome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: navidromeUrl,
          user: navidromeUser,
          password: navidromePassword || undefined
        })
      });
      const data = await res.json();
      if (data.ok) {
        testNavidromeMsg = strings.parent.connections.testSuccess;
      } else {
        testNavidromeMsg = `${strings.parent.connections.testFailed}: ${data.error || ''}`;
      }
    } catch {
      testNavidromeMsg = strings.parent.connections.testFailed;
    } finally {
      testingNavidrome = false;
    }
  }

  async function saveConfig(): Promise<void> {
    saveMsg = strings.parent.connections.saving;
    try {
      const res = await fetch('/api/parent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          absUrl,
          absToken: absToken || undefined,
          absBooksLibId,
          absPodcastsLibId,
          navidromeUrl,
          navidromeUser,
          navidromePassword: navidromePassword || undefined,
          sleepTimerDefault,
          dailyLimitMinutes
        })
      });
      if (res.ok) {
        saveMsg = strings.parent.connections.savedSuccess;
        absToken = '';
        navidromePassword = '';
        loadConfig();
        loadStatus();
        setTimeout(() => (saveMsg = ''), 3000);
      } else {
        const err = await res.json();
        saveMsg = `Fehler: ${err.error || 'Speichern fehlgeschlagen'}`;
      }
    } catch {
      saveMsg = 'Netzwerkfehler beim Speichern';
    }
  }

  async function toggleHideItem(item: Item & { hidden: boolean }): Promise<void> {
    const newHidden = !item.hidden;
    try {
      const res = await fetch('/api/parent/hidden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, hidden: newHidden })
      });
      if (res.ok) {
        item.hidden = newHidden;
      }
    } catch {}
  }

  async function handleChangePin(): Promise<void> {
    pinChangeMsg = '';
    pinChangeError = '';
    try {
      const res = await fetch('/api/parent/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: currentPinInput, newPin: newPinInput })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        pinChangeMsg = strings.parent.security.pinChangedSuccess;
        currentPinInput = '';
        newPinInput = '';
      } else {
        pinChangeError = data.error || 'Fehler beim Ändern der PIN';
      }
    } catch {
      pinChangeError = 'Netzwerkfehler';
    }
  }

  async function handleResetApp(): Promise<void> {
    if (!confirm(strings.parent.security.resetConfirmPrompt)) return;
    try {
      const res = await fetch('/api/parent/reset', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      alert('Fehler beim Zurücksetzen.');
    }
  }

  const filteredItems = $derived(
    allItems.filter((i) =>
      itemFilter.trim() === ''
        ? true
        : i.title.toLowerCase().includes(itemFilter.toLowerCase())
    )
  );
</script>

<div class="parent-overlay">
  <div class="parent-dialog parent-modal">
    <header class="dialog-header">
      <h2 class="dialog-title">{strings.parent.title}</h2>
      {#if hasPin}
        <button type="button" class="btn-close" onclick={onClose} aria-label={strings.kid.actions.close}>
          ✕
        </button>
      {/if}
    </header>

    <div class="dialog-body">
      {#if !authenticated}
        <PinPad
          isSetup={!hasPin}
          {isLocked}
          {remainingSeconds}
          error={authError}
          onSuccess={handlePinSubmit}
          onCancel={hasPin ? onClose : undefined}
        />
      {:else}
        <!-- Tab Navigation -->
        <nav class="tabs-nav">
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === 'connections'}
            onclick={() => (activeTab = 'connections')}
          >
            {strings.parent.tabs.connections}
          </button>
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === 'assignment'}
            onclick={() => {
              activeTab = 'assignment';
              testAbsConnection(true);
            }}
          >
            {strings.parent.tabs.assignment}
          </button>
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === 'items'}
            onclick={() => {
              activeTab = 'items';
              loadItems();
            }}
          >
            {strings.parent.tabs.items}
          </button>
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === 'rules'}
            onclick={() => (activeTab = 'rules')}
          >
            {strings.parent.tabs.rules}
          </button>
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === 'status'}
            onclick={() => {
              activeTab = 'status';
              loadStatus();
            }}
          >
            {strings.parent.tabs.status}
          </button>
          <button
            type="button"
            class="tab-btn"
            class:active={activeTab === 'security'}
            onclick={() => (activeTab = 'security')}
          >
            {strings.parent.tabs.security}
          </button>
        </nav>

        <div class="tab-content">
          <!-- 1. VERBINDUNGEN -->
          {#if activeTab === 'connections'}
            <div class="settings-section">
              <h3>{strings.parent.connections.absTitle}</h3>
              <div class="form-group">
                <label for="abs-url">{strings.parent.connections.absUrl}</label>
                <input
                  id="abs-url"
                  type="url"
                  bind:value={absUrl}
                  placeholder="http://192.168.1.50:13378"
                />
              </div>
              <div class="form-group">
                <label for="abs-token">
                  {strings.parent.connections.absToken}
                  <span class="badge-status">
                    {hasAbsToken ? strings.parent.connections.savedSet : strings.parent.connections.savedNotSet}
                  </span>
                </label>
                <input
                  id="abs-token"
                  type="password"
                  bind:value={absToken}
                  placeholder={hasAbsToken ? '•••••••• (unverändert)' : 'API-Token eingeben'}
                />
              </div>
              <div class="button-row">
                <button
                  type="button"
                  class="btn-action"
                  disabled={testingAbs}
                  onclick={() => testAbsConnection(false)}
                >
                  {testingAbs ? strings.parent.connections.testing : strings.parent.connections.test}
                </button>
                {#if testAbsMsg}
                  <span class="test-feedback">{testAbsMsg}</span>
                {/if}
              </div>
            </div>

            <div class="settings-section">
              <h3>{strings.parent.connections.navidromeTitle}</h3>
              <div class="form-group">
                <label for="nd-url">{strings.parent.connections.navidromeUrl}</label>
                <input
                  id="nd-url"
                  type="url"
                  bind:value={navidromeUrl}
                  placeholder="http://192.168.1.50:4533"
                />
              </div>
              <div class="form-group">
                <label for="nd-user">{strings.parent.connections.navidromeUser}</label>
                <input
                  id="nd-user"
                  type="text"
                  bind:value={navidromeUser}
                  placeholder="kind"
                />
              </div>
              <div class="form-group">
                <label for="nd-pass">
                  {strings.parent.connections.navidromePassword}
                  <span class="badge-status">
                    {hasNavidromePassword ? strings.parent.connections.savedSet : strings.parent.connections.savedNotSet}
                  </span>
                </label>
                <input
                  id="nd-pass"
                  type="password"
                  bind:value={navidromePassword}
                  placeholder={hasNavidromePassword ? '•••••••• (unverändert)' : 'Passwort eingeben'}
                />
              </div>
              <div class="button-row">
                <button
                  type="button"
                  class="btn-action"
                  disabled={testingNavidrome}
                  onclick={testNavidromeConnection}
                >
                  {testingNavidrome ? strings.parent.connections.testing : strings.parent.connections.test}
                </button>
                {#if testNavidromeMsg}
                  <span class="test-feedback">{testNavidromeMsg}</span>
                {/if}
              </div>
            </div>

            <div class="save-footer">
              <button type="button" class="btn-primary" onclick={saveConfig}>
                {strings.parent.connections.saveAll}
              </button>
              {#if saveMsg}
                <span class="save-feedback">{saveMsg}</span>
              {/if}
            </div>

          <!-- 2. ZUORDNUNG -->
          {:else if activeTab === 'assignment'}
            <div class="settings-section">
              <h3>{strings.parent.tabs.assignment}</h3>
              <p class="section-desc">{strings.parent.assignment.intro}</p>

              {#if availableLibraries.length === 0}
                <p class="hint-warn">{strings.parent.assignment.noLibraries}</p>
              {:else}
                <div class="form-group">
                  <label for="books-lib">{strings.parent.assignment.booksLib}</label>
                  <select id="books-lib" bind:value={absBooksLibId}>
                    <option value="">{strings.parent.assignment.selectPlaceholder}</option>
                    {#each availableLibraries as lib}
                      <option value={lib.id}>{lib.name} ({lib.mediaType})</option>
                    {/each}
                  </select>
                </div>

                <div class="form-group">
                  <label for="podcasts-lib">{strings.parent.assignment.podcastsLib}</label>
                  <select id="podcasts-lib" bind:value={absPodcastsLibId}>
                    <option value="">{strings.parent.assignment.selectPlaceholder}</option>
                    {#each availableLibraries as lib}
                      <option value={lib.id}>{lib.name} ({lib.mediaType})</option>
                    {/each}
                  </select>
                </div>
              {/if}
            </div>

            <div class="save-footer">
              <button type="button" class="btn-primary" onclick={saveConfig}>
                {strings.parent.connections.saveAll}
              </button>
              {#if saveMsg}
                <span class="save-feedback">{saveMsg}</span>
              {/if}
            </div>

          <!-- 3. INHALTE VERWALTEN (HIDE/UNHIDE) -->
          {:else if activeTab === 'items'}
            <div class="settings-section">
              <h3>{strings.parent.tabs.items}</h3>
              <p class="section-desc">{strings.parent.items.intro}</p>

              <div class="filter-box">
                <input
                  type="text"
                  bind:value={itemFilter}
                  placeholder={strings.parent.items.searchPlaceholder}
                />
              </div>

              {#if filteredItems.length === 0}
                <p class="empty-hint">{strings.parent.items.empty}</p>
              {:else}
                <div class="items-list">
                  {#each filteredItems as item}
                    <div class="item-row" class:is-hidden={item.hidden}>
                      <img
                        src={`/media/cover/${encodeURIComponent(item.id)}?w=160&v=1`}
                        alt=""
                        class="thumb-img"
                        loading="lazy"
                      />
                      <div class="item-meta">
                        <span class="item-title">{item.title}</span>
                        <span class="item-kind">
                          {item.section === 'books' ? 'Hörbuch' : item.section === 'podcasts' ? 'Podcast' : 'Musik'}
                        </span>
                      </div>
                      <button
                        type="button"
                        class="btn-toggle"
                        class:btn-hidden={item.hidden}
                        onclick={() => toggleHideItem(item)}
                      >
                        {item.hidden ? strings.parent.items.show : strings.parent.items.hide}
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

          <!-- 4. REGELN & LIMITS -->
          {:else if activeTab === 'rules'}
            <div class="settings-section">
              <h3>{strings.parent.rules.sleepTimerTitle}</h3>
              <div class="choice-group">
                {#each [0, 15, 30, 45, 60] as mins}
                  <button
                    type="button"
                    class="choice-btn"
                    class:selected={sleepTimerDefault === mins}
                    onclick={() => (sleepTimerDefault = mins)}
                  >
                    {mins === 0 ? strings.parent.rules.off : `${mins} Min`}
                  </button>
                {/each}
              </div>
            </div>

            <div class="settings-section">
              <h3>{strings.parent.rules.dailyLimitTitle}</h3>
              <p class="section-desc">{strings.parent.rules.dailyLimitDesc}</p>
              <div class="choice-group">
                {#each [0, 30, 45, 60, 90, 120] as mins}
                  <button
                    type="button"
                    class="choice-btn"
                    class:selected={dailyLimitMinutes === mins}
                    onclick={() => (dailyLimitMinutes = mins)}
                  >
                    {mins === 0 ? strings.parent.rules.off : `${mins} Min`}
                  </button>
                {/each}
              </div>
            </div>

            <div class="save-footer">
              <button type="button" class="btn-primary" onclick={saveConfig}>
                {strings.parent.connections.saveAll}
              </button>
              {#if saveMsg}
                <span class="save-feedback">{saveMsg}</span>
              {/if}
            </div>

          <!-- 5. STATUS -->
          {:else if activeTab === 'status'}
            <div class="settings-section">
              <h3>{strings.parent.status.title}</h3>
              {#if statusInfo}
                <div class="status-cards">
                  <div class="status-card">
                    <span class="card-label">{strings.parent.status.todayListened}</span>
                    <span class="card-value">{statusInfo.listenedTodayMinutes} Min</span>
                  </div>
                  <div class="status-card">
                    <span class="card-label">{strings.parent.status.dailyLimit}</span>
                    <span class="card-value">
                      {statusInfo.dailyLimitMinutes > 0 ? `${statusInfo.dailyLimitMinutes} Min` : strings.parent.rules.off}
                    </span>
                  </div>
                  <div class="status-card">
                    <span class="card-label">{strings.parent.status.absStatus}</span>
                    <span class="card-value">{statusInfo.hasAbs ? strings.parent.status.configured : strings.parent.status.notConfigured}</span>
                  </div>
                  <div class="status-card">
                    <span class="card-label">{strings.parent.status.navidromeStatus}</span>
                    <span class="card-value">{statusInfo.hasNavidrome ? strings.parent.status.configured : strings.parent.status.notConfigured}</span>
                  </div>
                </div>
              {/if}

              <h4>Protokolleinträge</h4>
              <div class="logs-container">
                {#if logs.length === 0}
                  <p class="empty-hint">{strings.parent.status.noLogs}</p>
                {:else}
                  <ul class="log-list">
                    {#each logs as log}
                      <li class="log-entry log-{log.level}">
                        <span class="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span class="log-service">[{log.service}]</span>
                        <span class="log-msg">{log.message}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            </div>

          <!-- 6. SICHERHEIT -->
          {:else if activeTab === 'security'}
            <div class="settings-section">
              <h3>{strings.parent.security.changePinTitle}</h3>
              <div class="form-group">
                <label for="cur-pin">{strings.parent.security.currentPin}</label>
                <input id="cur-pin" type="password" bind:value={currentPinInput} placeholder="••••" />
              </div>
              <div class="form-group">
                <label for="new-pin">{strings.parent.security.newPin}</label>
                <input id="new-pin" type="password" bind:value={newPinInput} placeholder="••••" />
              </div>
              <button type="button" class="btn-action" onclick={handleChangePin}>
                {strings.parent.security.changePinButton}
              </button>
              {#if pinChangeMsg}
                <p class="success-msg">{pinChangeMsg}</p>
              {/if}
              {#if pinChangeError}
                <p class="error-msg">{pinChangeError}</p>
              {/if}
            </div>

            <div class="settings-section danger-section">
              <h3>{strings.parent.security.resetTitle}</h3>
              <p class="section-desc">{strings.parent.security.resetDesc}</p>
              <button type="button" class="btn-danger" onclick={handleResetApp}>
                {strings.parent.security.resetButton}
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .parent-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .parent-dialog {
    background: var(--bg-surface);
    color: var(--text-primary);
    border-radius: 28px;
    width: 100%;
    max-width: 820px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.6);
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    border-bottom: 1px solid var(--border-color);
  }

  .dialog-title {
    font-size: 26px;
    font-weight: 700;
  }

  .btn-close {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dialog-body {
    padding: 24px 32px;
    overflow-y: auto;
    flex: 1;
  }

  .tabs-nav {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid var(--border-color);
    margin-bottom: 24px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .tab-btn {
    padding: 12px 18px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-secondary);
    background: transparent;
    border-radius: 12px 12px 0 0;
    white-space: nowrap;
  }

  .tab-btn.active {
    color: var(--accent);
    background: rgba(245, 158, 11, 0.12);
    border-bottom: 3px solid var(--accent);
  }

  .settings-section {
    background: var(--bg-secondary);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .settings-section h3 {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .section-desc {
    color: var(--text-secondary);
    font-size: 15px;
    margin-bottom: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .form-group label {
    font-size: 15px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badge-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
  }

  input[type='text'],
  input[type='password'],
  input[type='url'],
  select {
    height: 52px;
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-primary);
    padding: 0 16px;
    font-size: 16px;
  }

  .button-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
  }

  .btn-action {
    height: 48px;
    padding: 0 20px;
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 600;
  }

  .btn-primary {
    height: 54px;
    padding: 0 32px;
    background: var(--accent);
    color: #ffffff;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
  }

  .btn-danger {
    height: 52px;
    padding: 0 24px;
    background: #ef4444;
    color: #ffffff;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
  }

  .save-footer {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 16px;
  }

  .save-feedback,
  .test-feedback {
    font-size: 15px;
    font-weight: 600;
  }

  .choice-group {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .choice-btn {
    height: 50px;
    padding: 0 20px;
    border-radius: 14px;
    background: var(--bg-surface);
    color: var(--text-secondary);
    border: 2px solid transparent;
    font-size: 16px;
    font-weight: 600;
  }

  .choice-btn.selected {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(245, 158, 11, 0.12);
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--bg-surface);
    padding: 12px 16px;
    border-radius: 14px;
  }

  .item-row.is-hidden {
    opacity: 0.55;
  }

  .thumb-img {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    object-fit: cover;
  }

  .item-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-title {
    font-weight: 600;
    font-size: 16px;
  }

  .item-kind {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .btn-toggle {
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .btn-toggle.btn-hidden {
    background: #10b981;
    color: #ffffff;
  }

  .status-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .status-card {
    background: var(--bg-surface);
    padding: 16px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-label {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .card-value {
    font-size: 20px;
    font-weight: 700;
  }

  .logs-container {
    background: var(--bg-surface);
    border-radius: 14px;
    padding: 16px;
    max-height: 250px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 13px;
  }

  .log-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .log-entry {
    display: flex;
    gap: 8px;
  }

  .log-time {
    color: var(--text-secondary);
  }

  .log-warn {
    color: #f59e0b;
  }

  .log-error {
    color: #ef4444;
  }

  .danger-section {
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .error-msg {
    color: #ef4444;
    font-weight: 600;
    margin-top: 8px;
  }

  .success-msg {
    color: #10b981;
    font-weight: 600;
    margin-top: 8px;
  }
</style>
