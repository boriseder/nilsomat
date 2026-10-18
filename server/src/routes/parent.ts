import * as crypto from 'node:crypto';
import { Hono } from 'hono';
import { AuthService, requireParentAuth } from '../auth/index.js';
import { getDB } from '../db.js';
import { getABSProvider, getNavidromeProvider, reloadProvidersFromDB } from '../providers/index.js';
import type { Item } from '../providers/types.js';

export const parentRoutes = new Hono();

// 1. Auth-Status (öffentlich für Client)
parentRoutes.get('/auth-state', (c) => {
  const state = AuthService.getAuthState();
  const isValidSession = AuthService.validateSession(c);
  return c.json({
    ...state,
    authenticated: isValidSession
  });
});

// 2. Initiales PIN-Setzen (nur wenn noch keine PIN existiert)
parentRoutes.post('/init-pin', async (c) => {
  const db = getDB();
  if (db.hasPin()) {
    return c.json({ error: 'PIN ist bereits gesetzt' }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const pin = String(body.pin || '').trim();

  if (!/^\d{4,8}$/.test(pin)) {
    return c.json({ error: 'PIN muss aus 4 bis 8 Ziffern bestehen' }, 400);
  }

  db.setPin(pin);
  db.log('info', 'system', 'Erstkonfiguration: PIN erfolgreich eingerichtet');
  const token = AuthService.createSession(c);

  return c.json({ ok: true, sessionToken: token });
});

// 3. Login / PIN-Prüfung mit Rate-Limit
parentRoutes.post('/auth', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const pin = String(body.pin || '').trim();

  const result = AuthService.verifyPin(pin);

  if (result.isLocked) {
    const db = getDB();
    db.log('warn', 'system', `Zu viele Fehlversuche. Elternbereich gesperrt für ${result.remainingSeconds}s`);
    return c.json(
      {
        ok: false,
        isLocked: true,
        remainingSeconds: result.remainingSeconds,
        error: `Zu viele Fehlversuche. Bitte warten Sie ${result.remainingSeconds} Sekunden.`
      },
      429
    );
  }

  if (!result.success) {
    return c.json(
      {
        ok: false,
        isLocked: false,
        attemptsLeft: result.attemptsLeft,
        error: `Falsche PIN. Noch ${result.attemptsLeft} Versuche.`
      },
      401
    );
  }

  const token = AuthService.createSession(c);
  const db = getDB();
  db.log('info', 'system', 'Erfolgreicher Login im Elternbereich');

  return c.json({ ok: true, sessionToken: token });
});

// 4. Logout
parentRoutes.post('/logout', (c) => {
  AuthService.clearSession(c);
  return c.json({ ok: true });
});

// --- Ab hier geschützte Eltern-Routen (requireParentAuth) ---
parentRoutes.use('*', requireParentAuth);

// 5. Konfiguration abrufen (OHNE Secrets nach außen zu geben - Abschnitt 6)
parentRoutes.get('/config', (c) => {
  const db = getDB();
  const cfg = db.getConfig();

  return c.json({
    absUrl: cfg.absUrl || '',
    absUsername: cfg.absUsername || '',
    hasAbsPassword: !!cfg.absPassword,
    hasAbsToken: !!cfg.absToken,
    absBooksLibId: cfg.absBooksLibId || '',
    absPodcastsLibId: cfg.absPodcastsLibId || '',
    navidromeUrl: cfg.navidromeUrl || '',
    navidromeUser: cfg.navidromeUser || '',
    hasNavidromePassword: !!cfg.navidromePassword,
    sleepTimerDefault: cfg.sleepTimerDefault || 0,
    dailyLimitMinutes: cfg.dailyLimitMinutes || 0,
    maxItemsPerCategory: cfg.maxItemsPerCategory || 0,
    podcastEpisodeLimit: cfg.podcastEpisodeLimit || 30
  });
});

// 6. Konfiguration speichern
parentRoutes.post('/config', async (c) => {
  const db = getDB();
  const body = await c.req.json().catch(() => ({}));

  // URL-Validierung (nur http / https - Abschnitt 8)
  const validateUrl = (url?: string) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (body.absUrl && !validateUrl(body.absUrl)) {
    return c.json({ error: 'Ungültige ABS-URL (muss mit http:// oder https:// beginnen)' }, 400);
  }
  if (body.navidromeUrl && !validateUrl(body.navidromeUrl)) {
    return c.json({ error: 'Ungültige Navidrome-URL (muss mit http:// oder https:// beginnen)' }, 400);
  }

  const updates: Record<string, any> = {};
  if (body.absUrl !== undefined) updates.absUrl = body.absUrl;
  if (body.absUsername !== undefined) updates.absUsername = body.absUsername;
  if (body.absPassword !== undefined && body.absPassword !== '') updates.absPassword = body.absPassword;
  if (body.absToken !== undefined && body.absToken !== '') updates.absToken = body.absToken;
  if (body.absBooksLibId !== undefined) updates.absBooksLibId = body.absBooksLibId;
  if (body.absPodcastsLibId !== undefined) updates.absPodcastsLibId = body.absPodcastsLibId;
  if (body.navidromeUrl !== undefined) updates.navidromeUrl = body.navidromeUrl;
  if (body.navidromeUser !== undefined) updates.navidromeUser = body.navidromeUser;
  if (body.navidromePassword !== undefined && body.navidromePassword !== '') updates.navidromePassword = body.navidromePassword;
  if (body.sleepTimerDefault !== undefined) updates.sleepTimerDefault = Number(body.sleepTimerDefault);
  if (body.dailyLimitMinutes !== undefined) updates.dailyLimitMinutes = Number(body.dailyLimitMinutes);
  if (body.maxItemsPerCategory !== undefined) updates.maxItemsPerCategory = Number(body.maxItemsPerCategory);
  if (body.podcastEpisodeLimit !== undefined) updates.podcastEpisodeLimit = Number(body.podcastEpisodeLimit);

  db.saveConfig(updates);
  reloadProvidersFromDB();
  db.log('info', 'system', 'Einstellungen wurden aktualisiert');

  return c.json({ ok: true });
});

// 7. ABS Verbindung testen & Bibliotheken abfragen
parentRoutes.post('/test-abs', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const db = getDB();
  const cfg = db.getConfig();

  const baseUrl = (body.url || cfg.absUrl || '').replace(/\/+$/, '');
  let token = body.token || cfg.absToken || '';
  const username = body.username || cfg.absUsername || '';
  const password = body.password || cfg.absPassword || '';

  if (!baseUrl) {
    return c.json({ ok: false, error: 'Keine ABS-URL angegeben' });
  }

  // Wenn Benutzername und Passwort angegeben sind: Login durchführen
  if (username && password) {
    try {
      const loginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!loginRes.ok) {
        let msg = loginRes.status === 401 ? 'Falscher Benutzername oder Passwort' : `Login fehlgeschlagen (${loginRes.status})`;
        try {
          const errJson = await loginRes.json();
          if (errJson.error) msg = errJson.error;
        } catch {}
        db.log('warn', 'abs', `Login fehlgeschlagen: ${msg}`);
        return c.json({ ok: false, error: msg });
      }

      const loginData = await loginRes.json();
      token = loginData.user?.token || token;
    } catch (err: any) {
      db.log('error', 'abs', `Login Fehler: ${err?.message || err}`);
      return c.json({ ok: false, error: 'ABS nicht erreichbar' });
    }
  }

  if (!token) {
    return c.json({ ok: false, error: 'Weder Zugangsdaten noch Token angegeben' });
  }

  try {
    const res = await fetch(`${baseUrl}/api/libraries`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const statusText = res.status === 401 ? 'Ungültiges Token / Nicht autorisiert' : `Server antwortete mit Code ${res.status}`;
      db.log('warn', 'abs', `Verbindungstest fehlgeschlagen: ${statusText}`);
      return c.json({ ok: false, error: statusText });
    }

    const data = await res.json();
    const libraries = (data.libraries || []).map((lib: any) => ({
      id: lib.id,
      name: lib.name,
      mediaType: lib.mediaType
    }));

    db.log('info', 'abs', `Verbindungstest erfolgreich (${libraries.length} Bibliotheken gefunden)`);
    return c.json({ ok: true, libraries, token });
  } catch (err: any) {
    db.log('error', 'abs', `Verbindungstest Fehler: ${err?.message || err}`);
    return c.json({ ok: false, error: 'ABS nicht erreichbar' });
  }
});

// 8. Navidrome Verbindung testen
parentRoutes.post('/test-navidrome', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const db = getDB();
  const cfg = db.getConfig();

  const baseUrl = (body.url || cfg.navidromeUrl || '').replace(/\/+$/, '');
  const user = body.user || cfg.navidromeUser || '';
  const password = body.password || cfg.navidromePassword || '';

  if (!baseUrl || !user) {
    return c.json({ ok: false, error: 'URL und Benutzername erforderlich' });
  }

  try {
    const salt = crypto.randomBytes(8).toString('hex');
    const token = crypto.createHash('md5').update(`${password}${salt}`).digest('hex');
    const testUrl = `${baseUrl}/rest/ping.view?u=${encodeURIComponent(user)}&t=${token}&s=${salt}&v=1.16.1&c=nilsomat&f=json`;

    const res = await fetch(testUrl);
    if (!res.ok) {
      db.log('warn', 'navidrome', `Navidrome antwortete mit HTTP ${res.status}`);
      return c.json({ ok: false, error: `HTTP ${res.status}` });
    }

    const json = await res.json();
    const sub = json['subsonic-response'];
    if (sub && sub.status === 'ok') {
      db.log('info', 'navidrome', 'Verbindungstest erfolgreich');
      return c.json({ ok: true });
    }

    const errorMsg = sub?.error?.message || 'Ungültige Zugangsdaten';
    db.log('warn', 'navidrome', `Verbindungstest abgelehnt: ${errorMsg}`);
    return c.json({ ok: false, error: errorMsg });
  } catch (err: any) {
    db.log('error', 'navidrome', `Navidrome nicht erreichbar: ${err?.message || err}`);
    return c.json({ ok: false, error: 'Navidrome nicht erreichbar' });
  }
});

// 9. Alle Inhalte für Eltern zur Verwaltung auflisten (mit hidden-Status)
parentRoutes.get('/items', async (c) => {
  const db = getDB();
  const allItems: (Item & { hidden: boolean })[] = [];

  const abs = getABSProvider();
  const navidrome = getNavidromeProvider();

  // Hörbücher
  try {
    const books = await abs.listItems('books');
    for (const b of books) {
      allItems.push({ ...b, hidden: db.isItemHidden(b.id) });
    }
  } catch {}

  // Podcasts
  try {
    const podcasts = await abs.listItems('podcasts');
    for (const p of podcasts) {
      allItems.push({ ...p, hidden: db.isItemHidden(p.id) });
    }
  } catch {}

  // Musik
  try {
    const music = await navidrome.listItems('music');
    for (const m of music) {
      allItems.push({ ...m, hidden: db.isItemHidden(m.id) });
    }
  } catch {}

  return c.json({ items: allItems });
});

// 10. Titel verbergen oder freigeben
parentRoutes.post('/hidden', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const id = String(body.id || '');
  const hidden = Boolean(body.hidden);

  if (!id) {
    return c.json({ error: 'Keine ID angegeben' }, 400);
  }

  const db = getDB();
  db.setItemHidden(id, hidden);
  db.log('info', 'system', `Item ${id} ${hidden ? 'verborgen' : 'freigegeben'}`);

  return c.json({ ok: true, id, hidden });
});

// 11. PIN ändern
parentRoutes.post('/pin', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const currentPin = String(body.currentPin || '');
  const newPin = String(body.newPin || '').trim();

  const db = getDB();
  if (!db.verifyPin(currentPin)) {
    return c.json({ error: 'Aktuelle PIN ist nicht korrekt' }, 400);
  }

  if (!/^\d{4,8}$/.test(newPin)) {
    return c.json({ error: 'Neue PIN muss aus 4 bis 8 Ziffern bestehen' }, 400);
  }

  db.setPin(newPin);
  db.log('info', 'system', 'PIN erfolgreich geändert');
  return c.json({ ok: true });
});

// 12. System- & Fehler-Status
parentRoutes.get('/status', (c) => {
  const db = getDB();
  const cfg = db.getConfig();
  const usageSec = db.getDailyUsageSeconds();
  const logs = db.getLogs(50);

  return c.json({
    status: 'ok',
    configured: db.hasPin(),
    hasAbs: !!(cfg.absUrl && (cfg.absToken || (cfg.absUsername && cfg.absPassword))),
    hasNavidrome: !!(cfg.navidromeUrl && cfg.navidromeUser),
    dailyLimitMinutes: cfg.dailyLimitMinutes || 0,
    listenedTodayMinutes: Math.round(usageSec / 60),
    dailyLimitReached: db.isDailyLimitReached(),
    logs
  });
});

// 13. App-Daten zurücksetzen
parentRoutes.post('/reset', (c) => {
  const db = getDB();
  db.resetAllData();
  AuthService.clearSession(c);
  reloadProvidersFromDB();

  return c.json({ ok: true });
});
