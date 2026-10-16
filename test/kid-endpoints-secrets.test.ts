import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import app from '../server/src/index.js';
import { AudiobookshelfProvider } from '../server/src/providers/abs.js';
import { setABSProvider } from '../server/src/providers/index.js';

const fixturesDir = path.resolve(__dirname, 'fixtures/abs');
const bookSingleFileFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'book-single-file-item.json'), 'utf-8')
);

describe('Kind-Endpunkte liefern keine Secrets oder Fremd-URLs (AGENTS.md Abschnitt 2 & 9)', () => {
  const SECRET_TOKEN = 'secret-token-xyz-987';
  const SERVER_URL = 'http://abs-internal-host.local:13378';

  it('Antworten von /api/kid/* enthalten keine Token, Server-URLs oder Secrets', async () => {
    const mockFetch = async (url: string) => {
      if (url.includes('/api/libraries/lib-books-1/items')) {
        return new Response(
          JSON.stringify({
            results: [bookSingleFileFixture]
          }),
          { status: 200 }
        );
      }
      if (url.includes('/api/items/book-item-1')) {
        return new Response(JSON.stringify(bookSingleFileFixture), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    };

    const provider = new AudiobookshelfProvider(
      {
        baseUrl: SERVER_URL,
        token: SECRET_TOKEN,
        booksLibraryId: 'lib-books-1'
      },
      mockFetch as any
    );
    setABSProvider(provider);

    // 1. /api/kid/items
    const resItems = await app.request('/api/kid/items?section=books');
    expect(resItems.status).toBe(200);
    const textItems = await resItems.text();

    expect(textItems).not.toContain(SECRET_TOKEN);
    expect(textItems).not.toContain(SERVER_URL);
    expect(textItems).not.toContain('http://');
    expect(textItems).not.toContain('https://');

    const jsonItems = JSON.parse(textItems);
    for (const item of jsonItems.items) {
      expect(item.coverUrl).toMatch(/^\/media\/cover\//);
    }

    // 2. /api/kid/tracks/:itemId
    const resTracks = await app.request('/api/kid/tracks/abs:lib-books-1:book-item-1');
    expect(resTracks.status).toBe(200);
    const textTracks = await resTracks.text();

    expect(textTracks).not.toContain(SECRET_TOKEN);
    expect(textTracks).not.toContain(SERVER_URL);
    expect(textTracks).not.toContain('http://');
    expect(textTracks).not.toContain('https://');

    const jsonTracks = JSON.parse(textTracks);
    for (const track of jsonTracks.tracks) {
      expect(track.streamUrl).toMatch(/^\/media\/stream\//);
    }
  });

  it('Navidrome: Antworten von /api/kid/* für Musik enthalten keine Passwörter, Salts oder Server-URLs', async () => {
    const NAVIDROME_PASS = 'top-secret-navi-pass-999';
    const NAVIDROME_URL = 'http://navidrome-internal.local:4533';

    const { setNavidromeProvider } = await import('../server/src/providers/index.js');
    const { NavidromeProvider } = await import('../server/src/providers/navidrome.js');

    const mockFetch = async (url: string) => {
      if (url.includes('getAlbumList2.view')) {
        return new Response(
          JSON.stringify({
            'subsonic-response': {
              status: 'ok',
              albumList2: {
                album: [
                  {
                    id: 'alb-secret-1',
                    name: 'Geheimes Album',
                    coverArt: 'cov-1'
                  }
                ]
              }
            }
          }),
          { status: 200 }
        );
      }
      if (url.includes('getAlbum.view')) {
        return new Response(
          JSON.stringify({
            'subsonic-response': {
              status: 'ok',
              album: {
                id: 'alb-secret-1',
                song: [
                  {
                    id: 'song-secret-1',
                    title: 'Lied 1',
                    duration: 150
                  }
                ]
              }
            }
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    };

    const naviProvider = new NavidromeProvider(
      {
        baseUrl: NAVIDROME_URL,
        user: 'kiduser',
        password: NAVIDROME_PASS
      },
      mockFetch as any
    );
    setNavidromeProvider(naviProvider);

    // 1. Items
    const resItems = await app.request('/api/kid/items?section=music');
    expect(resItems.status).toBe(200);
    const textItems = await resItems.text();

    expect(textItems).not.toContain(NAVIDROME_PASS);
    expect(textItems).not.toContain(NAVIDROME_URL);
    expect(textItems).not.toContain('http://');
    expect(textItems).not.toContain('https://');

    // 2. Tracks
    const resTracks = await app.request('/api/kid/tracks/nd:album:alb-secret-1');
    expect(resTracks.status).toBe(200);
    const textTracks = await resTracks.text();

    expect(textTracks).not.toContain(NAVIDROME_PASS);
    expect(textTracks).not.toContain(NAVIDROME_URL);
    expect(textTracks).not.toContain('http://');
    expect(textTracks).not.toContain('https://');

    const jsonTracks = JSON.parse(textTracks);
    for (const track of jsonTracks.tracks) {
      expect(track.streamUrl).toMatch(/^\/media\/stream\//);
    }
  });
});
