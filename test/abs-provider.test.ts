import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AudiobookshelfProvider } from '../server/src/providers/abs.js';

const fixturesDir = path.resolve(__dirname, 'fixtures/abs');
const librariesFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'libraries.json'), 'utf-8')
);
const bookSingleFileFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'book-single-file-item.json'), 'utf-8')
);
const bookMultiFileFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'book-multi-file-item.json'), 'utf-8')
);
const podcastFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'podcast-item.json'), 'utf-8')
);
const progressFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'progress.json'), 'utf-8')
);

describe('Audiobookshelf Provider mit Fixtures (AGENTS.md Abschnitt 4.1)', () => {
  it('listLibraries liefert Bibliotheken mit id, name und mediaType', async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify(librariesFixture), { status: 200 });

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        token: 'test-token',
        booksLibraryId: 'lib-books-1',
        podcastsLibraryId: 'lib-podcasts-2'
      },
      mockFetch as any
    );

    const libs = await provider.listLibraries();
    expect(libs).toHaveLength(2);
    expect(libs[0]).toEqual({
      id: 'lib-books-1',
      name: 'Kinder-Hörbücher',
      mediaType: 'book'
    });
    expect(libs[1]).toEqual({
      id: 'lib-podcasts-2',
      name: 'Kinder-Podcasts',
      mediaType: 'podcast'
    });
  });

  it('listItems für books mappt Hörbücher korrekt auf das Item-Modell (ohne Serien)', async () => {
    const mockFetch = async (url: string) => {
      if (url.includes('/series')) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      expect(url).toContain('/api/libraries/lib-books-1/items');
      return new Response(
        JSON.stringify({
          results: [bookSingleFileFixture, bookMultiFileFixture]
        }),
        { status: 200 }
      );
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        booksLibraryId: 'lib-books-1'
      },
      mockFetch as any
    );

    const items = await provider.listItems('books');
    expect(items).toHaveLength(2);

    expect(items[0]).toEqual({
      id: 'abs:lib-books-1:book-item-1',
      section: 'books',
      kind: 'audiobook',
      title: 'Die kleinen Abenteurer',
      coverUrl: '/media/cover/abs:lib-books-1:book-item-1?w=640&v=1710000000000',
      durationSec: 1800
    });

    expect(items[1].kind).toBe('audiobook');
    expect(items[1].title).toBe('Geschichten aus dem Zauberwald');
  });

  it('listItems für books gruppiert Serien als Kacheln und listSeriesBooks liefert Bücher', async () => {
    const mockFetch = async (url: string) => {
      if (url.includes('/series?')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 'series-pumuckl',
                name: 'Pumuckl',
                numBooks: 2,
                books: [
                  bookSingleFileFixture,
                  bookMultiFileFixture
                ]
              }
            ]
          }),
          { status: 200 }
        );
      }
      if (url.includes('/items?')) {
        return new Response(
          JSON.stringify({
            results: [bookSingleFileFixture, bookMultiFileFixture]
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        booksLibraryId: 'lib-books-1'
      },
      mockFetch as any
    );

    const items = await provider.listItems('books');
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('series');
    expect(items[0].title).toBe('Pumuckl');
    expect(items[0].bookCount).toBe(2);

    const seriesBooks = await provider.listSeriesBooks(items[0].id);
    expect(seriesBooks).toHaveLength(2);
    expect(seriesBooks[0].kind).toBe('audiobook');
    expect(seriesBooks[0].title).toBe('Die kleinen Abenteurer');
  });

  it('listTracks normalisiert kapitelbasiertes Einzeldatei-Hörbuch zu Tracks', async () => {
    const mockFetch = async (url: string) => {
      expect(url).toContain('/api/items/book-item-1?expanded=1');
      return new Response(JSON.stringify(bookSingleFileFixture), { status: 200 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        booksLibraryId: 'lib-books-1'
      },
      mockFetch as any
    );

    const tracks = await provider.listTracks('abs:lib-books-1:book-item-1');
    expect(tracks).toHaveLength(3);

    // Track 1
    expect(tracks[0]).toEqual({
      id: 'abs:lib-books-1:book-item-1:ch_0',
      title: 'Kapitel 1: Der geheime Baum',
      durationSec: 600,
      startOffsetSec: 0,
      streamUrl: '/media/stream/abs:lib-books-1:book-item-1:audio-file-1'
    });

    // Track 2
    expect(tracks[1]).toEqual({
      id: 'abs:lib-books-1:book-item-1:ch_1',
      title: 'Kapitel 2: Die alte Karte',
      durationSec: 600,
      startOffsetSec: 600,
      streamUrl: '/media/stream/abs:lib-books-1:book-item-1:audio-file-1'
    });
  });

  it('listTracks normalisiert Mehrdatei-Hörbuch (Dateien als Tracks)', async () => {
    const mockFetch = async (url: string) => {
      expect(url).toContain('/api/items/book-item-2?expanded=1');
      return new Response(JSON.stringify(bookMultiFileFixture), { status: 200 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        booksLibraryId: 'lib-books-1'
      },
      mockFetch as any
    );

    const tracks = await provider.listTracks('abs:lib-books-1:book-item-2');
    expect(tracks).toHaveLength(2);
    expect(tracks[0].title).toBe('01_zauberwald_teil1');
    expect(tracks[0].durationSec).toBe(550);
    expect(tracks[0].streamUrl).toBe('/media/stream/abs:lib-books-1:book-item-2:audio-file-2-1');
    expect(tracks[1].title).toBe('02_zauberwald_teil2');
    expect(tracks[1].durationSec).toBe(650);
  });

  it('listTracks für Podcasts liefert Episoden sortiert, neueste zuerst, max 30', async () => {
    const mockFetch = async (url: string) => {
      expect(url).toContain('/api/items/podcast-item-1?expanded=1');
      return new Response(JSON.stringify(podcastFixture), { status: 200 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        podcastsLibraryId: 'lib-podcasts-2'
      },
      mockFetch as any
    );

    const tracks = await provider.listTracks('abs:lib-podcasts-2:podcast-item-1');
    expect(tracks).toHaveLength(2);
    // Folge 102 ist neuer (1710600000000 > 1710500000000)
    expect(tracks[0].title).toBe('Wie schlafen Fische?');
    expect(tracks[0].streamUrl).toBe('/media/stream/abs:lib-podcasts-2:podcast-item-1:ep-audio-102');
    expect(tracks[1].title).toBe('Warum ist der Himmel blau?');
  });

  it('listTracksWithMeta respektiert limit und liefert hasMore/total', async () => {
    const mockFetch = async () => new Response(JSON.stringify(podcastFixture), { status: 200 });
    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        podcastsLibraryId: 'lib-podcasts-2'
      },
      mockFetch as any
    );

    // Limit 1 bei 2 vorhandenen Episoden -> 1 geliefert, total 2, hasMore true
    const page1 = await provider.listTracksWithMeta('abs:lib-podcasts-2:podcast-item-1', 1);
    expect(page1.tracks).toHaveLength(1);
    expect(page1.total).toBe(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.tracks[0].title).toBe('Wie schlafen Fische?');

    // Limit 2 bei 2 Episoden -> 2 geliefert, total 2, hasMore false
    const page2 = await provider.listTracksWithMeta('abs:lib-podcasts-2:podcast-item-1', 2);
    expect(page2.tracks).toHaveLength(2);
    expect(page2.total).toBe(2);
    expect(page2.hasMore).toBe(false);
  });

  it('getProgress und saveProgress synchronisieren den Hörfortschritt', async () => {
    let savedBody: any = null;

    const mockFetch = async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        savedBody = JSON.parse(init.body as string);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify(progressFixture), { status: 200 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        booksLibraryId: 'lib-books-1'
      },
      mockFetch as any
    );

    const prog = await provider.getProgress('abs:lib-books-1:book-item-1');
    expect(prog).not.toBeNull();
    expect(prog?.positionSec).toBe(450);
    expect(prog?.finished).toBe(false);

    await provider.saveProgress('abs:lib-books-1:book-item-1', 900, false, 1800);
    expect(savedBody).toEqual({
      currentTime: 900,
      duration: 1800,
      isFinished: false
    });
  });

  it('login mit username und password setzt token und autorisiert Anfragen', async () => {
    let loginCalled = false;
    const mockFetch = async (url: string, init?: RequestInit) => {
      if (url.includes('/login')) {
        loginCalled = true;
        const body = JSON.parse(init?.body as string);
        if (body.username === 'kind' && body.password === 'pass123') {
          return new Response(
            JSON.stringify({
              user: { id: 'u1', username: 'kind', token: 'jwt-auth-token-xyz' }
            }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({ error: 'Falsches Passwort' }), { status: 401 });
      }

      if (url.includes('/api/libraries')) {
        const auth = (init?.headers as any)?.['Authorization'];
        if (auth === 'Bearer jwt-auth-token-xyz') {
          return new Response(JSON.stringify(librariesFixture), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Nicht autorisiert' }), { status: 401 });
      }

      return new Response('{}', { status: 200 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        username: 'kind',
        password: 'pass123'
      },
      mockFetch as any
    );

    // Initial ist kein Token da -> Provider ruft automatisch /login auf
    const libs = await provider.listLibraries();
    expect(loginCalled).toBe(true);
    expect(libs).toHaveLength(2);
  });

  it('erneuert Token automatisch bei 401 Unauthorized, wenn User/Passwort konfiguriert sind', async () => {
    let loginCount = 0;
    let callCount = 0;

    const mockFetch = async (url: string, init?: RequestInit) => {
      if (url.includes('/login')) {
        loginCount++;
        return new Response(
          JSON.stringify({
            user: { id: 'u1', username: 'kind', token: `fresh-token-${loginCount}` }
          }),
          { status: 200 }
        );
      }

      if (url.includes('/api/libraries')) {
        callCount++;
        const auth = (init?.headers as any)?.['Authorization'];
        // Erster Aufruf mit altem Token schlägt fehl (401), zweiter mit fresh-token-1 gelingt
        if (auth === 'Bearer fresh-token-1') {
          return new Response(JSON.stringify(librariesFixture), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Token expired' }), { status: 401 });
      }

      return new Response('{}', { status: 200 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: 'http://abs.local:13378',
        token: 'expired-old-token',
        username: 'kind',
        password: 'valid-password'
      },
      mockFetch as any
    );

    const libs = await provider.listLibraries();
    expect(loginCount).toBe(1);
    expect(callCount).toBe(2); // Einmal mit expired-old-token (401), einmal mit fresh-token-1 (200)
    expect(libs).toHaveLength(2);
  });
});
