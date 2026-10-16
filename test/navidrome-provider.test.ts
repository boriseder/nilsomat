import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import app from '../server/src/index.js';
import { setNavidromeProvider } from '../server/src/providers/index.js';
import { NavidromeProvider } from '../server/src/providers/navidrome.js';

const fixturesDir = path.resolve(__dirname, 'fixtures/navidrome');
const albumListFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'album-list.json'), 'utf-8')
);
const albumFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'album.json'), 'utf-8')
);
const playlistsFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'playlists.json'), 'utf-8')
);
const playlistFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'playlist.json'), 'utf-8')
);

describe('Navidrome Provider mit Fixtures (AGENTS.md Abschnitt 4.2)', () => {
  it('buildAuthParams generiert neuen Salt pro Request und berechnet MD5-Token korrekt', () => {
    const provider = new NavidromeProvider({
      baseUrl: 'http://navidrome.local:4533',
      user: 'kind',
      password: 'geheimes-passwort'
    });

    const params1 = provider.buildAuthParams();
    const params2 = provider.buildAuthParams();

    // Salt muss sich bei jedem Aufruf ändern
    expect(params1.get('s')).not.toBe(params2.get('s'));
    expect(params1.get('u')).toBe('kind');
    expect(params1.get('v')).toBe('1.16.1');
    expect(params1.get('c')).toBe('hoerbox');
    expect(params1.get('f')).toBe('json');

    // Token-Berechnung verifizieren: MD5(password + salt)
    const salt = params1.get('s')!;
    const expectedToken = crypto
      .createHash('md5')
      .update('geheimes-passwort' + salt)
      .digest('hex');
    expect(params1.get('t')).toBe(expectedToken);
  });

  it('listItems für music liefert Playlists mit Vorrang gefolgt von Alben', async () => {
    const mockFetch = async (url: string) => {
      if (url.includes('getPlaylists.view')) {
        return new Response(JSON.stringify(playlistsFixture), { status: 200 });
      }
      if (url.includes('getAlbumList2.view')) {
        return new Response(JSON.stringify(albumListFixture), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    };

    const provider = new NavidromeProvider(
      {
        baseUrl: 'http://navidrome.local:4533',
        user: 'kind',
        password: 'pass'
      },
      mockFetch as any
    );

    const items = await provider.listItems('music');
    // 1 Playlist + 2 Alben = 3 Items
    expect(items).toHaveLength(3);

    // Playlist an 1. Stelle
    expect(items[0]).toEqual({
      id: 'nd:playlist:pl-1',
      section: 'music',
      kind: 'playlist',
      title: 'Lieblingslieder zum Tanzen',
      coverUrl: '/media/cover/nd:playlist:pl-1?w=640&v=pl-pl-1',
      durationSec: 210
    });

    // Alben danach
    expect(items[1].kind).toBe('album');
    expect(items[1].title).toBe('Bunte Kinderlieder');
    expect(items[1].coverUrl).toContain('/media/cover/nd:album:alb-1');

    expect(items[2].kind).toBe('album');
    expect(items[2].title).toBe('Klangreise durch die Natur');
  });

  it('listTracks für Alben normalisiert Songs zu Track[]', async () => {
    const mockFetch = async (url: string) => {
      expect(url).toContain('getAlbum.view');
      expect(url).toContain('id=alb-1');
      return new Response(JSON.stringify(albumFixture), { status: 200 });
    };

    const provider = new NavidromeProvider(
      {
        baseUrl: 'http://navidrome.local:4533',
        user: 'kind',
        password: 'pass'
      },
      mockFetch as any
    );

    const tracks = await provider.listTracks('nd:album:alb-1');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({
      id: 'nd:track:song-101',
      title: 'Das Sonnenschein-Lied',
      durationSec: 180,
      streamUrl: '/media/stream/nd:track:song-101',
      startOffsetSec: 0
    });
    expect(tracks[1].title).toBe('Der Regentanz');
  });

  it('listTracks für Playlists normalisiert Einträge zu Track[]', async () => {
    const mockFetch = async (url: string) => {
      expect(url).toContain('getPlaylist.view');
      expect(url).toContain('id=pl-1');
      return new Response(JSON.stringify(playlistFixture), { status: 200 });
    };

    const provider = new NavidromeProvider(
      {
        baseUrl: 'http://navidrome.local:4533',
        user: 'kind',
        password: 'pass'
      },
      mockFetch as any
    );

    const tracks = await provider.listTracks('nd:playlist:pl-1');
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toEqual({
      id: 'nd:track:song-201',
      title: 'Der lustige Pinguin',
      durationSec: 210,
      streamUrl: '/media/stream/nd:track:song-201',
      startOffsetSec: 0
    });
  });

  it('getProgress liefert immer null und saveProgress scrobbelt nicht (AGENTS.md Abschnitt 4.2)', async () => {
    let fetchCalled = false;
    const mockFetch = async () => {
      fetchCalled = true;
      return new Response(JSON.stringify({}), { status: 200 });
    };

    const provider = new NavidromeProvider(
      {
        baseUrl: 'http://navidrome.local:4533'
      },
      mockFetch as any
    );

    const prog = await provider.getProgress('nd:album:alb-1');
    expect(prog).toBeNull();

    await provider.saveProgress('nd:album:alb-1', 120, false);
    // Es darf kein HTTP-Request an Navidrome gesendet werden
    expect(fetchCalled).toBe(false);
  });

  it('Media-Endpunkte unterstützen Navidrome-Cover und Range-Streaming', async () => {
    let capturedRange: string | undefined;

    const validCover = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
      .jpeg()
      .toBuffer();

    const mockFetch = async (url: string, init?: RequestInit) => {
      if (url.includes('getCoverArt.view')) {
        return new Response(new Uint8Array(validCover), {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' }
        });
      }
      if (url.includes('stream.view')) {
        capturedRange = (init?.headers as any)?.['Range'];
        const headers = new Headers();
        headers.set('Content-Range', 'bytes 1000-1999/50000');
        headers.set('Content-Length', '1000');
        headers.set('Content-Type', 'audio/mpeg');
        return new Response(new Uint8Array(1000), {
          status: 206,
          headers
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    };

    const provider = new NavidromeProvider(
      {
        baseUrl: 'http://navidrome.test',
        user: 'testuser',
        password: 'testpassword'
      },
      mockFetch as any
    );
    setNavidromeProvider(provider);

    // 1. Cover
    const coverRes = await app.request('/media/cover/nd:album:alb-1?w=640');
    expect(coverRes.status).toBe(200);
    expect(coverRes.headers.get('Content-Type')).toMatch(/^image\/(webp|jpeg)$/);

    // 2. Stream mit Range
    const streamRes = await app.request('/media/stream/nd:track:song-101', {
      headers: {
        Range: 'bytes=1000-1999'
      }
    });

    expect(streamRes.status).toBe(206);
    expect(capturedRange).toBe('bytes=1000-1999');
    expect(streamRes.headers.get('Content-Range')).toBe('bytes 1000-1999/50000');
    expect(streamRes.headers.get('Accept-Ranges')).toBe('bytes');
  });
});
