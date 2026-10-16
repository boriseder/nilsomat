import type { ContentProvider, Item, ItemProgress, Section, Track } from './types.js';

export interface ABSConfig {
  baseUrl: string;
  token?: string;
  booksLibraryId?: string;
  podcastsLibraryId?: string;
}

export class AudiobookshelfProvider implements ContentProvider {
  private config: ABSConfig;
  private fetchFn: typeof fetch;

  constructor(config: ABSConfig, customFetch?: typeof fetch) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/+$/, '')
    };
    this.fetchFn = customFetch || fetch;
  }

  private get authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }
    return headers;
  }

  public parseId(id: string): { libraryId: string; itemId: string; partId?: string } | null {
    if (!id.startsWith('abs:')) return null;
    const parts = id.split(':');
    if (parts.length < 3) return null;
    return {
      libraryId: parts[1],
      itemId: parts[2],
      partId: parts.slice(3).join(':') || undefined
    };
  }

  public makeItemId(libraryId: string, itemId: string): string {
    return `abs:${libraryId}:${itemId}`;
  }

  public makeTrackId(libraryId: string, itemId: string, trackSubId: string): string {
    return `abs:${libraryId}:${itemId}:${trackSubId}`;
  }

  async listLibraries(): Promise<{ id: string; name: string; mediaType: 'book' | 'podcast' }[]> {
    try {
      const res = await this.fetchFn(`${this.config.baseUrl}/api/libraries`, {
        headers: this.authHeaders
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.libraries || []).map((lib: any) => ({
        id: lib.id,
        name: lib.name,
        mediaType: lib.mediaType
      }));
    } catch {
      return [];
    }
  }

  async listItems(section: Section): Promise<Item[]> {
    let libraryId: string | undefined;
    if (section === 'books') {
      libraryId = this.config.booksLibraryId;
    } else if (section === 'podcasts') {
      libraryId = this.config.podcastsLibraryId;
    } else {
      return [];
    }

    if (!libraryId) return [];

    try {
      const url = `${this.config.baseUrl}/api/libraries/${libraryId}/items?sort=media.metadata.title`;
      const res = await this.fetchFn(url, { headers: this.authHeaders });
      if (!res.ok) return [];

      const data = await res.json();
      const results: any[] = data.results || [];

      return results.map((item) => {
        const id = this.makeItemId(libraryId!, item.id);
        const kind = section === 'books' ? 'audiobook' : 'podcast';
        const title = item.media?.metadata?.title || 'Ohne Titel';
        const durationSec = item.media?.duration ? Math.round(item.media.duration) : undefined;
        const updatedAt = item.updatedAt || 1;
        const coverUrl = `/media/cover/${id}?w=640&v=${updatedAt}`;

        return {
          id,
          section,
          kind,
          title,
          coverUrl,
          durationSec
        };
      });
    } catch {
      return [];
    }
  }

  async listTracks(itemId: string): Promise<Track[]> {
    const parsed = this.parseId(itemId);
    if (!parsed) return [];

    try {
      const res = await this.fetchFn(
        `${this.config.baseUrl}/api/items/${parsed.itemId}?expanded=1`,
        { headers: this.authHeaders }
      );
      if (!res.ok) return [];

      const item = await res.json();
      const tracks: Track[] = [];

      if (item.mediaType === 'book') {
        const chapters: any[] = item.media?.chapters || [];
        const audioFiles: any[] = item.media?.audioFiles || [];

        if (chapters.length > 0) {
          // Kapitelbasiert (z. B. Einzeldatei m4b)
          const primaryFileId = audioFiles[0]?.ino || audioFiles[0]?.id || 'audio';
          chapters.forEach((ch, idx) => {
            const start = Math.round(ch.start || 0);
            const end = Math.round(ch.end || 0);
            const durationSec = Math.max(0, end - start);
            const trackId = this.makeTrackId(parsed.libraryId, parsed.itemId, `ch_${ch.id ?? idx}`);
            const streamId = `${parsed.libraryId}:${parsed.itemId}:${primaryFileId}`;

            tracks.push({
              id: trackId,
              title: ch.title || `Kapitel ${idx + 1}`,
              durationSec,
              startOffsetSec: start,
              streamUrl: `/media/stream/abs:${streamId}`
            });
          });
        } else if (audioFiles.length > 0) {
          // Mehrere Audiodateien (z. B. CD1, CD2)
          audioFiles.forEach((af, idx) => {
            const fileId = af.ino || af.id || `${idx}`;
            const trackId = this.makeTrackId(parsed.libraryId, parsed.itemId, `f_${fileId}`);
            const streamId = `${parsed.libraryId}:${parsed.itemId}:${fileId}`;
            const filename = af.metadata?.filename ? af.metadata.filename.replace(/\.[^/.]+$/, '') : `Teil ${idx + 1}`;

            tracks.push({
              id: trackId,
              title: filename,
              durationSec: Math.round(af.duration || 0),
              startOffsetSec: 0,
              streamUrl: `/media/stream/abs:${streamId}`
            });
          });
        }
      } else if (item.mediaType === 'podcast') {
        // Podcast: Episoden nach Veröffentlichung absteigend sortiert, max 30
        const episodes: any[] = [...(item.media?.episodes || [])];
        episodes.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
        const limited = episodes.slice(0, 30);

        limited.forEach((ep) => {
          const fileId = ep.audioFile?.ino || ep.id;
          const trackId = this.makeTrackId(parsed.libraryId, parsed.itemId, `ep_${ep.id}`);
          const streamId = `${parsed.libraryId}:${parsed.itemId}:${fileId}`;

          tracks.push({
            id: trackId,
            title: ep.title || 'Episode',
            durationSec: Math.round(ep.duration || 0),
            startOffsetSec: 0,
            streamUrl: `/media/stream/abs:${streamId}`
          });
        });
      }

      return tracks;
    } catch {
      return [];
    }
  }

  async getProgress(itemId: string): Promise<ItemProgress | null> {
    const parsed = this.parseId(itemId);
    if (!parsed) return null;

    try {
      const res = await this.fetchFn(
        `${this.config.baseUrl}/api/me/progress/${parsed.itemId}`,
        { headers: this.authHeaders }
      );
      if (!res.ok) return null;

      const data = await res.json();
      return {
        positionSec: Math.round(data.currentTime || 0),
        finished: Boolean(data.isFinished),
        updatedAt: data.lastUpdate || Date.now()
      };
    } catch {
      return null;
    }
  }

  async saveProgress(
    itemId: string,
    positionSec: number,
    finished: boolean,
    durationSec?: number
  ): Promise<void> {
    const parsed = this.parseId(itemId);
    if (!parsed) return;

    try {
      await this.fetchFn(
        `${this.config.baseUrl}/api/me/progress/${parsed.itemId}`,
        {
          method: 'PATCH',
          headers: {
            ...this.authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentTime: positionSec,
            duration: durationSec,
            isFinished: finished
          })
        }
      );
    } catch {
      // Fehler stillschweigend behandeln
    }
  }

  async fetchCoverOriginal(rawItemId: string): Promise<Buffer | null> {
    try {
      const res = await this.fetchFn(
        `${this.config.baseUrl}/api/items/${rawItemId}/cover?raw=1`,
        { headers: this.authHeaders }
      );
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  async streamAudio(rawItemId: string, fileId: string, rangeHeader?: string): Promise<Response> {
    const headers: Record<string, string> = {
      ...this.authHeaders
    };
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    return this.fetchFn(
      `${this.config.baseUrl}/api/items/${rawItemId}/file/${fileId}`,
      { headers }
    );
  }
}
