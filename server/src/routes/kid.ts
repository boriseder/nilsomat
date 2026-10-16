import { Hono } from 'hono';
import { getProviderForId, getProviderForSection } from '../providers/index.js';
import type { Section } from '../providers/types.js';

export const kidRoutes = new Hono();

// Verfügbare Bereiche (Abschnitt 5.2)
kidRoutes.get('/sections', async (c) => {
  const allSections: Section[] = ['books', 'podcasts', 'music'];
  const activeSections: Section[] = [];

  for (const sec of allSections) {
    const provider = getProviderForSection(sec);
    if (provider) {
      // Prüfen, ob Inhalte vorhanden sind
      const items = await provider.listItems(sec);
      if (items.length > 0) {
        activeSections.push(sec);
      }
    }
  }

  // Fallback: Wenn noch keine Konfiguration existiert, alle konfigurierten Sektionen zurückgeben
  return c.json({
    sections: activeSections.length > 0 ? activeSections : allSections
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

  const items = await provider.listItems(section);

  // Sicherstellen, dass Fortschritt für Bücher/Podcasts beigefügt wird
  const itemsWithProgress = await Promise.all(
    items.map(async (item) => {
      if (item.section === 'books' || item.section === 'podcasts') {
        const progress = await provider.getProgress(item.id);
        if (progress) {
          return { ...item, progress };
        }
      }
      return item;
    })
  );

  return c.json({ items: itemsWithProgress });
});

// Tracks/Episoden für ein Item auflisten
kidRoutes.get('/tracks/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const provider = getProviderForId(itemId);

  if (!provider) {
    return c.json({ tracks: [] });
  }

  const tracks = await provider.listTracks(itemId);
  return c.json({ tracks });
});

// Fortschritt abrufen
kidRoutes.get('/progress/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const provider = getProviderForId(itemId);

  if (!provider) {
    return c.json({ progress: null });
  }

  const progress = await provider.getProgress(itemId);
  return c.json({ progress });
});

// Fortschritt speichern
kidRoutes.post('/progress/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const provider = getProviderForId(itemId);

  if (!provider) {
    return c.json({ ok: false, error: 'Unbekanntes Medium' }, 400);
  }

  try {
    const body = await c.req.json();
    const positionSec = Number(body.positionSec) || 0;
    const finished = Boolean(body.finished);
    const durationSec = body.durationSec ? Number(body.durationSec) : undefined;

    await provider.saveProgress(itemId, positionSec, finished, durationSec);
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false }, 500);
  }
});
