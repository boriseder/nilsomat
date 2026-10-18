import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DB, setDB } from '../server/src/db.js';
import app from '../server/src/index.js';
import { setABSProvider, setNavidromeProvider } from '../server/src/providers/index.js';
import { AudiobookshelfProvider } from '../server/src/providers/abs.js';

describe('Elternbereich Auth, PIN Rate-Limit & Hidden Items (AGENTS.md Abschnitt 6 & 8)', () => {
  let db: DB;

  beforeEach(() => {
    // In-Memory SQLite für isolierte Tests
    db = new DB(':memory:');
    setDB(db);
  });

  afterEach(() => {
    db.close();
  });

  it('Initialer Zustand: Noch keine PIN gesetzt', async () => {
    const res = await app.request('/api/parent/auth-state');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.hasPin).toBe(false);
    expect(data.isLocked).toBe(false);
  });

  it('Initiales PIN-Setzen mit ungültiger Länge schlägt fehl, mit 4-8 Ziffern gelingt es', async () => {
    // Zu kurz
    const res1 = await app.request('/api/parent/init-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '12' })
    });
    expect(res1.status).toBe(400);

    // Gültig: 4 Ziffern
    const res2 = await app.request('/api/parent/init-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '1234' })
    });
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.ok).toBe(true);
    expect(data2.sessionToken).toBeDefined();

    // Nochmaliges Init schlägt fehl, da bereits gesetzt
    const res3 = await app.request('/api/parent/init-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '5678' })
    });
    expect(res3.status).toBe(400);
  });

  it('Rate-Limit greift serverseitig: 5 Fehlversuche sperren den Elternbereich für 5 Minuten', async () => {
    db.setPin('4321');

    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await app.request('/api/parent/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '0000' })
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.isLocked).toBe(false);
      expect(data.attemptsLeft).toBe(5 - attempt);
    }

    // 5. Fehlversuch -> Lockout 429
    const res5 = await app.request('/api/parent/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '0000' })
    });
    expect(res5.status).toBe(429);
    const data5 = await res5.json();
    expect(data5.isLocked).toBe(true);
    expect(data5.remainingSeconds).toBeGreaterThan(0);

    // Selbst korrekte PIN wird während der Sperre abgelehnt
    const resLocked = await app.request('/api/parent/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '4321' })
    });
    expect(resLocked.status).toBe(429);
  });

  it('Secrets werden in DB verschlüsselt und /api/parent/config gibt nie Klartext-Secrets zurück', async () => {
    db.setPin('1234');

    // Login für Session
    const loginRes = await app.request('/api/parent/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '1234' })
    });
    const { sessionToken } = await loginRes.json();

    // Speichern von Zugangsdaten
    const saveRes = await app.request('/api/parent/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        absUrl: 'http://my-abs:13378',
        absToken: 'secret_token_123',
        navidromeUrl: 'http://my-nd:4533',
        navidromeUser: 'kiduser',
        navidromePassword: 'supersecretpassword',
        sleepTimerDefault: 30,
        dailyLimitMinutes: 60,
        maxItemsPerCategory: 15,
        podcastEpisodeLimit: 20
      })
    });
    expect(saveRes.status).toBe(200);

    // Abruf der Config über /api/parent/config
    const getRes = await app.request('/api/parent/config', {
      headers: { 'X-Session-Token': sessionToken }
    });
    expect(getRes.status).toBe(200);
    const configData = await getRes.json();

    expect(configData.absUrl).toBe('http://my-abs:13378');
    expect(configData.hasAbsToken).toBe(true);
    expect(configData.navidromeUser).toBe('kiduser');
    expect(configData.hasNavidromePassword).toBe(true);
    expect(configData.sleepTimerDefault).toBe(30);
    expect(configData.dailyLimitMinutes).toBe(60);
    expect(configData.maxItemsPerCategory).toBe(15);
    expect(configData.podcastEpisodeLimit).toBe(20);

    // /api/kid/status liefert die Limits ebenfalls für das UI aus
    const kidStatusRes = await app.request('/api/kid/status');
    expect(kidStatusRes.status).toBe(200);
    const kidStatus = await kidStatusRes.json();
    expect(kidStatus.maxItemsPerCategory).toBe(15);
    expect(kidStatus.podcastEpisodeLimit).toBe(20);

    // Weder ABS-Token noch Navidrome-Passwort dürfen in der Antwort stehen!
    const responseString = JSON.stringify(configData);
    expect(responseString).not.toContain('secret_token_123');
    expect(responseString).not.toContain('supersecretpassword');
  });

  it('Verborgene Items erscheinen nie im Kinderbereich (Abschnitt 6 & 9)', async () => {
    db.setPin('1234');
    const loginRes = await app.request('/api/parent/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '1234' })
    });
    const { sessionToken } = await loginRes.json();

    // Provider mit 2 Büchern mocken
    const mockAbs = new AudiobookshelfProvider({ baseUrl: 'http://dummy', token: 'token' });
    mockAbs.listItems = async () => [
      {
        id: 'abs:lib1:book1',
        section: 'books',
        kind: 'audiobook',
        title: 'Sichtbares Buch',
        coverUrl: '/media/cover/abs:lib1:book1?w=640'
      },
      {
        id: 'abs:lib1:book2',
        section: 'books',
        kind: 'audiobook',
        title: 'Verstecktes Buch',
        coverUrl: '/media/cover/abs:lib1:book2?w=640'
      }
    ];
    setABSProvider(mockAbs);

    // Buch 2 über Eltern-Endpunkt verbergen
    const hideRes = await app.request('/api/parent/hidden', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({ id: 'abs:lib1:book2', hidden: true })
    });
    expect(hideRes.status).toBe(200);

    // Kinder-Endpunkt /api/kid/items abfragen
    const kidRes = await app.request('/api/kid/items?section=books');
    expect(kidRes.status).toBe(200);
    const kidData = await kidRes.json();

    const ids = kidData.items.map((i: any) => i.id);
    expect(ids).toContain('abs:lib1:book1');
    expect(ids).not.toContain('abs:lib1:book2');
  });

  it('Kuratieren statt Überfluten: maxItemsPerCategory begrenzt sichtbare Items im Kinderbereich', async () => {
    db.saveConfig({ maxItemsPerCategory: 2 });

    const mockAbs = new AudiobookshelfProvider({ baseUrl: 'http://dummy', token: 'token' });
    mockAbs.listItems = async () => [
      { id: 'abs:b1', section: 'books', kind: 'audiobook', title: 'Buch 1', coverUrl: '/media/cover/abs:b1?w=640' },
      { id: 'abs:b2', section: 'books', kind: 'audiobook', title: 'Buch 2', coverUrl: '/media/cover/abs:b2?w=640' },
      { id: 'abs:b3', section: 'books', kind: 'audiobook', title: 'Buch 3', coverUrl: '/media/cover/abs:b3?w=640' },
      { id: 'abs:b4', section: 'books', kind: 'audiobook', title: 'Buch 4', coverUrl: '/media/cover/abs:b4?w=640' }
    ];
    setABSProvider(mockAbs);

    const res = await app.request('/api/kid/items?section=books');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(2);
    expect(data.items.map((i: any) => i.id)).toEqual(['abs:b1', 'abs:b2']);
  });
});
