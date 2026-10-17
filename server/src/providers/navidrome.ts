import * as crypto from 'node:crypto';
import type { ContentProvider, Item, ItemProgress, Section, Track } from './types.js';

export interface NavidromeConfig {
  baseUrl: string;
  user?: string;
  password?: string;
  albumSortType?: 'recent' | 'alphabeticalByArtist' | 'alphabeticalByName' | 'random' | 'newest';
  sharedPlaylistIds?: string[];
}

export class NavidromeProvider implements ContentProvider {
  private config: NavidromeConfig;
  private fetchFn: typeof fetch;

  constructor(config?: Partial<NavidromeConfig>, customFetch?: typeof fetch) {
    this.config = {
      baseUrl: (config?.baseUrl || '').replace(/\/+$/, ''),
      user: config?.user || '',
      password: config?.password || '',
      albumSortType: config?.albumSortType || 'recent',
      sharedPlaylistIds: config?.sharedPlaylistIds || []
    };
    this.fetchFn = customFetch || fetch;
  }

  public parseId(id: string): { kind: 'album' | 'playlist' | 'track' | 'cover'; id: string } | null {
    if (!id.startsWith('nd:')) return null;
    const parts = id.split(':');
    if (parts.length < 3) return null;
    const kind = parts[1];
    if (kind !== 'album' && kind !== 'playlist' && kind !== 'track' && kind !== 'cover') {
      return null;
    }
    return {
      kind,
      id: parts.slice(2).join(':')
    };
  }

  public makeId(kind: 'album' | 'playlist' | 'track' | 'cover', id: string): string {
    return `nd:${kind}:${id}`;
  }

  public buildAuthParams(): URLSearchParams {
    const salt = crypto.randomBytes(8).toString('hex');
    const token = crypto
      .createHash('md5')
      .update((this.config.password || '') + salt)
      .digest('hex');

    const params = new URLSearchParams();
    params.set('u', this.config.user || '');
    params.set('s', salt);
    params.set('t', token);
    params.set('v', '1.16.1');
    params.set('c', 'nilsomat');
    params.set('f', 'json');

    return params;
  }

  private buildUrl(endpoint: string, extraParams?: Record<string, string>): string {
    const params = this.buildAuthParams();
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        params.set(key, val);
      }
    }
    return `${this.config.baseUrl}/rest/${endpoint}?${params.toString()}`;
  }

  async listItems(section: Section): Promise<Item[]> {
    if (section !== 'music' || !this.config.baseUrl) {
      return [];
    }

    const items: Item[] = [];

    // 1. Playlists abrufen (haben gemäß Abschnitt 4.2 Vorrang)
    try {
      const plUrl = this.buildUrl('getPlaylists.view');
      const res = await this.fetchFn(plUrl);
      if (res.ok) {
        const json = await res.json();
        let rawPlaylists = json['subsonic-response']?.playlists?.playlist || [];
        if (!Array.isArray(rawPlaylists) && rawPlaylists && typeof rawPlaylists === 'object') {
          rawPlaylists = [rawPlaylists];
        }

        for (const pl of rawPlaylists) {
          // Falls bestimmte Playlists freigegeben sind, filtern
          const isExplicitlyShared =
            this.config.sharedPlaylistIds && this.config.sharedPlaylistIds.length > 0
              ? this.config.sharedPlaylistIds.includes(pl.id)
              : true;

          if (isExplicitlyShared) {
            const id = this.makeId('playlist', pl.id);
            const coverArtId = pl.coverArt || pl.id;
            items.push({
              id,
              section: 'music',
              kind: 'playlist',
              title: pl.name || 'Playlist',
              coverUrl: `/media/cover/${id}?w=640&v=${encodeURIComponent(coverArtId)}`,
              durationSec: pl.duration ? Math.round(pl.duration) : undefined
            });
          }
        }
      }
    } catch {
      // Weiter mit Alben
    }

    // 2. Alben abrufen (Standard: newest / alphabeticalByName anstelle von recent, da recent nur gescrobbelte Alben liefert)
    try {
      const sortType = this.config.albumSortType || 'newest';
      const albUrl = this.buildUrl('getAlbumList2.view', {
        type: sortType,
        size: '500'
      });
      const res = await this.fetchFn(albUrl);
      let albums: any[] = [];
      if (res.ok) {
        const json = await res.json();
        const raw = json['subsonic-response']?.albumList2?.album || [];
        albums = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
      }

      // Fallback: Falls keine Alben gefunden wurden, mit alphabeticalByName versuchen
      if (albums.length === 0 && sortType !== 'alphabeticalByName') {
        const fallbackUrl = this.buildUrl('getAlbumList2.view', {
          type: 'alphabeticalByName',
          size: '500'
        });
        const fbRes = await this.fetchFn(fallbackUrl);
        if (fbRes.ok) {
          const fbJson = await fbRes.json();
          const rawFb = fbJson['subsonic-response']?.albumList2?.album || [];
          albums = Array.isArray(rawFb) ? rawFb : (rawFb && typeof rawFb === 'object' ? [rawFb] : []);
        }
      }

      for (const alb of albums) {
        const id = this.makeId('album', alb.id);
        const coverArtId = alb.coverArt || alb.id;
        items.push({
          id,
          section: 'music',
          kind: 'album',
          title: alb.name || alb.title || 'Album',
          coverUrl: `/media/cover/${id}?w=640&v=${encodeURIComponent(coverArtId)}`,
          durationSec: alb.duration ? Math.round(alb.duration) : undefined
        });
      }
    } catch {
      // Fehler stillschweigend fangen
    }

    return items;
  }

  async listTracks(itemId: string): Promise<Track[]> {
    const parsed = this.parseId(itemId);
    if (!parsed || !this.config.baseUrl) return [];

    const tracks: Track[] = [];

    if (parsed.kind === 'album') {
      try {
        const url = this.buildUrl('getAlbum.view', { id: parsed.id });
        const res = await this.fetchFn(url);
        if (res.ok) {
          const json = await res.json();
          const raw = json['subsonic-response']?.album?.song || [];
          const songs: any[] = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
          for (const s of songs) {
            tracks.push({
              id: this.makeId('track', s.id),
              title: s.title || 'Lied',
              durationSec: Math.round(s.duration || 0),
              streamUrl: `/media/stream/${this.makeId('track', s.id)}`,
              startOffsetSec: 0
            });
          }
        }
      } catch {
        return [];
      }
    } else if (parsed.kind === 'playlist') {
      try {
        const url = this.buildUrl('getPlaylist.view', { id: parsed.id });
        const res = await this.fetchFn(url);
        if (res.ok) {
          const json = await res.json();
          const raw = json['subsonic-response']?.playlist?.entry || [];
          const entries: any[] = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
          for (const e of entries) {
            tracks.push({
              id: this.makeId('track', e.id),
              title: e.title || 'Lied',
              durationSec: Math.round(e.duration || 0),
              streamUrl: `/media/stream/${this.makeId('track', e.id)}`,
              startOffsetSec: 0
            });
          }
        }
      } catch {
        return [];
      }
    }

    return tracks;
  }

  async getProgress(_itemId: string): Promise<ItemProgress | null> {
    // Abschnitt 4.2: Kein Fortschritt für Musik
    return null;
  }

  async saveProgress(
    _itemId: string,
    _positionSec: number,
    _finished: boolean,
    _durationSec?: number
  ): Promise<void> {
    // Abschnitt 4.2: Kein Scrobbling, kein Fortschritt
  }

  async fetchCoverOriginal(rawId: string): Promise<Buffer | null> {
    if (!this.config.baseUrl) return null;
    try {
      const url = this.buildUrl('getCoverArt.view', {
        id: rawId,
        size: '1280'
      });
      const res = await this.fetchFn(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  async streamAudio(songId: string, rangeHeader?: string): Promise<Response> {
    const url = this.buildUrl('stream.view', { id: songId });
    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }
    return this.fetchFn(url, { headers });
  }
}
