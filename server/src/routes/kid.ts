import { Hono } from 'hono';
import { getDB } from '../db.js';
import { getProviderForId, getProviderForSection } from '../providers/index.js';
import type { Section } from '../providers/types.js';

export const kidRoutes = new Hono();

// Status für den Kinderbereich (Tageslimit, Timer-Default, Erstkonfiguration)
kidRoutes.get('/status', (c) => {
  const db = getDB();
  const config = db.getConfig();
  return c.json({
    configured: db.hasPin(),
    dailyLimitReached: db.isDailyLimitReached(),
    sleepTimerDefault: config.sleepTimerDefault || 0
  });
});

// Verfügbare Bereiche (Abschnitt 5.2)
kidRoutes.get('/sections', async (c) => {
  const db = getDB();
  const allSections: Section[] = ['books', 'podcasts', 'music'];
  const activeSections: Section[] = [];

  for (const sec of allSections) {
    const provider = getProviderForSection(sec);
    if (provider) {
      try {
        const items = await provider.listItems(sec);
        // Verborgene Einträge herausfiltern (Abschnitt 6 & 8)
        const visibleItems = items.filter((item) => !db.isItemHidden(item.id));
        if (visibleItems.length > 0) {
          activeSections.push(sec);
        }
      } catch {
        // Fehler bei einem Provider schlägt nicht auf andere durch (Abschnitt 9)
      }
    }
  }

  return c.json({
    sections: activeSections
  });
});

// Titel/Sendungen für eine Sektion auflisten
kidRoutes.get('/items', async (c) => {
  const section = c.req.query('section') as Section;
  if (!section || !['books', 'podcasts', 'music'].includes(section)) {
    return c.json({ items: [] });
  }

  const provider = getProviderForSection(section);
  if (!provider) {
    return c.json({ items: [] });
  }

  try {
    const items = await provider.listItems(section);
    const db = getDB();

    // Verborgene Items herausfiltern (Abschnitt 6 & 8)
    const visibleItems = items.filter((item) => !db.isItemHidden(item.id));

    // Sicherstellen, dass Fortschritt für Bücher/Podcasts beigefügt wird
    const itemsWithProgress = await Promise.all(
      visibleItems.map(async (item) => {
        if (item.section === 'books' || item.section === 'podcasts') {
          try {
            const progress = await provider.getProgress(item.id);
            if (progress) {
              return { ...item, progress };
            }
          } catch {
            // Ignorieren falls nicht verfügbar
          }
        }
        return item;
      })
    );

    return c.json({ items: itemsWithProgress });
  } catch (err: any) {
    const db = getDB();
    db.log('error', section === 'music' ? 'navidrome' : 'abs', `Fehler beim Laden von ${section}: ${err?.message || err}`);
    return c.json({ error: 'Fehler beim Laden der Inhalte', items: [] }, 502);
  }
});

// Bücher einer Serie auflisten (Abschnitt 3 & 5.2)
kidRoutes.get('/series/:seriesId/items', async (c) => {
  const seriesId = c.req.param('seriesId');
  const db = getDB();

  if (db.isItemHidden(seriesId)) {
    return c.json({ items: [] });
  }

  const provider = getProviderForId(seriesId);
  if (!provider || !provider.listSeriesBooks) {
    return c.json({ items: [] });
  }

  try {
    const books = await provider.listSeriesBooks(seriesId);
    const visible = books.filter((b) => !db.isItemHidden(b.id));

    const withProgress = await Promise.all(
      visible.map(async (b) => {
        try {
          const progress = await provider.getProgress(b.id);
          if (progress) return { ...b, progress };
        } catch {}
        return b;
      })
    );

    return c.json({ items: withProgress });
  } catch (err: any) {
    db.log('error', 'abs', `Fehler beim Laden der Serie (${seriesId}): ${err?.message || err}`);
    return c.json({ error: 'Fehler beim Laden der Inhalte', items: [] }, 502);
  }
});

// Tracks/Episoden für ein Item auflisten
kidRoutes.get('/tracks/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const db = getDB();

  // Verborgene Items niemals ausliefern
  if (db.isItemHidden(itemId)) {
    return c.json({ tracks: [] });
  }

  const provider = getProviderForId(itemId);
  if (!provider) {
    return c.json({ tracks: [] });
  }

  try {
    const tracks = await provider.listTracks(itemId);
    return c.json({ tracks });
  } catch (err: any) {
    db.log('error', itemId.startsWith('nd:') ? 'navidrome' : 'abs', `Fehler beim Laden von Tracks (${itemId}): ${err?.message || err}`);
    return c.json({ error: 'Fehler beim Laden der Inhalte', tracks: [] }, 502);
  }
});

// Fortschritt abrufen
kidRoutes.get('/progress/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const db = getDB();
  if (db.isItemHidden(itemId)) {
    return c.json({ progress: null });
  }

  const provider = getProviderForId(itemId);
  if (!provider) {
    return c.json({ progress: null });
  }

  const progress = await provider.getProgress(itemId);
  return c.json({ progress });
});

// Fortschritt speichern & Tagesnutzung protokollieren
kidRoutes.post('/progress/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const db = getDB();
  const provider = getProviderForId(itemId);

  if (!provider) {
    return c.json({ ok: false, error: 'Unbekanntes Medium' }, 400);
  }

  try {
    const body = await c.req.json();
    const positionSec = Number(body.positionSec) || 0;
    const finished = Boolean(body.finished);
    const durationSec = body.durationSec ? Number(body.durationSec) : undefined;
    const deltaSec = body.deltaSec ? Number(body.deltaSec) : 0;

    if (deltaSec > 0) {
      db.addDailyUsageSeconds(deltaSec);
    }

    await provider.saveProgress(itemId, positionSec, finished, durationSec);
    return c.json({
      ok: true,
      dailyLimitReached: db.isDailyLimitReached()
    });
  } catch {
    return c.json({ ok: false }, 500);
  }
});
