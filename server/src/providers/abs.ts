import type { ContentProvider, Item, ItemProgress, Section, Track } from './types.js';

export interface ABSConfig {
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
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

  public async login(user?: string, pass?: string): Promise<{ ok: boolean; token?: string; error?: string }> {
    const u = user || this.config.username;
    const p = pass || this.config.password;
    if (!u || !p) {
      return { ok: false, error: 'Kein Benutzername oder Passwort angegeben' };
    }

    try {
      const res = await this.fetchFn(`${this.config.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson.error) msg = errJson.error;
        } catch {}
        return { ok: false, error: msg };
      }

      const data = await res.json();
      const token = data.user?.token;
      if (!token) {
        return { ok: false, error: 'Kein Token in der Antwort erhalten' };
      }

      this.config.token = token;
      if (user) this.config.username = user;
      if (pass) this.config.password = pass;
      return { ok: true, token };
    } catch (err: any) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  public async ensureToken(): Promise<string | undefined> {
    if (!this.config.token && this.config.username && this.config.password) {
      await this.login();
    }
    return this.config.token;
  }

  public async authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
    await this.ensureToken();

    let headers: Record<string, string> = {
      ...this.authHeaders,
      ...((init?.headers as Record<string, string>) || {})
    };

    let res = await this.fetchFn(url, { ...init, headers });

    // Falls 401 Unauthorized und User/Passwort konfiguriert: Token erneuern und einmal wiederholen
    if (res.status === 401 && this.config.username && this.config.password) {
      const loginRes = await this.login();
      if (loginRes.ok) {
        headers = {
          ...this.authHeaders,
          ...((init?.headers as Record<string, string>) || {})
        };
        res = await this.fetchFn(url, { ...init, headers });
      }
    }

    return res;
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
      const res = await this.authenticatedFetch(`${this.config.baseUrl}/api/libraries`);
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

    if (section === 'books') {
      try {
        // 1. Versuche Serien aus der Hörbücher-Bibliothek zu laden (wie in ABS)
        const seriesUrl = `${this.config.baseUrl}/api/libraries/${libraryId}/series?include=books&limit=200`;
        const seriesRes = await this.authenticatedFetch(seriesUrl);
        let seriesList: any[] = [];
        if (seriesRes.ok) {
          const seriesData = await seriesRes.json();
          seriesList = seriesData.results || [];
        }

        // 2. Alle Bücher abrufen
        const itemsUrl = `${this.config.baseUrl}/api/libraries/${libraryId}/items?sort=media.metadata.title&limit=2000`;
        const itemsRes = await this.authenticatedFetch(itemsUrl);
        let allBooks: any[] = [];
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          allBooks = itemsData.results || [];
        }

        // Falls Serien existieren: Zeige Serien als Kacheln + einzelne Bücher außerhalb von Serien
        if (seriesList.length > 0) {
          const items: Item[] = [];
          const booksInSeriesIds = new Set<string>();

          for (const s of seriesList) {
            let seriesBooks: any[] = s.books || [];

            // Falls s.books im ABS-Aufruf nicht enthalten oder leer war, suche passende Bücher in allBooks
            if (seriesBooks.length === 0 && allBooks.length > 0) {
              seriesBooks = allBooks.filter((b) => {
                const bSeries = b.media?.metadata?.series || b.series || [];
                return bSeries.some(
                  (ser: any) =>
                    ser.id === s.id ||
                    (ser.name && s.name && ser.name.toLowerCase() === s.name.toLowerCase())
                );
              });
            }

            seriesBooks.forEach((b) => booksInSeriesIds.add(b.id));

            // Erstes Buch als Cover der Serie verwenden
            const firstBook = seriesBooks[0];
            const coverItemId = firstBook ? firstBook.id : s.id;
            const updatedAt = firstBook?.updatedAt || s.updatedAt || 1;
            const coverUrl = `/media/cover/${this.makeItemId(libraryId!, coverItemId)}?w=640&v=${updatedAt}`;
            const count = s.numBooks || seriesBooks.length || undefined;

            items.push({
              id: this.makeItemId(libraryId!, `series_${s.id}`),
              section: 'books',
              kind: 'series',
              title: s.name || 'Serie',
              coverUrl,
              bookCount: count
            });
          }

          // Auch Bücher erfassen, die in allBooks eine Serie haben, aber deren Serie vielleicht nicht in seriesList war
          for (const b of allBooks) {
            const bSeries = b.media?.metadata?.series || b.series || [];
            if (bSeries.length > 0) {
              booksInSeriesIds.add(b.id);
            }
          }

          // Eigenständige Hörbücher hinzufügen, die keiner Serie angehören
          for (const b of allBooks) {
            if (!booksInSeriesIds.has(b.id)) {
              const id = this.makeItemId(libraryId!, b.id);
              const title = b.media?.metadata?.title || 'Ohne Titel';
              const durationSec = b.media?.duration ? Math.round(b.media.duration) : undefined;
              const updatedAt = b.updatedAt || 1;
              const coverUrl = `/media/cover/${id}?w=640&v=${updatedAt}`;

              items.push({
                id,
                section: 'books',
                kind: 'audiobook',
                title,
                coverUrl,
                durationSec
              });
            }
          }

          return items;
        }

        // Fallback: Wenn keine Serien vorhanden sind, alle Bücher normal auflisten
        return allBooks.map((item) => {
          const id = this.makeItemId(libraryId!, item.id);
          const title = item.media?.metadata?.title || 'Ohne Titel';
          const durationSec = item.media?.duration ? Math.round(item.media.duration) : undefined;
          const updatedAt = item.updatedAt || 1;
          const coverUrl = `/media/cover/${id}?w=640&v=${updatedAt}`;

          return {
            id,
            section: 'books',
            kind: 'audiobook',
            title,
            coverUrl,
            durationSec
          };
        });
      } catch {
        return [];
      }
    }

    // Podcasts auflisten
    try {
      const url = `${this.config.baseUrl}/api/libraries/${libraryId}/items?sort=media.metadata.title`;
      const res = await this.authenticatedFetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      const results: any[] = data.results || [];

      return results.map((item) => {
        const id = this.makeItemId(libraryId!, item.id);
        const title = item.media?.metadata?.title || 'Ohne Titel';
        const durationSec = item.media?.duration ? Math.round(item.media.duration) : undefined;
        const updatedAt = item.updatedAt || 1;
        const coverUrl = `/media/cover/${id}?w=640&v=${updatedAt}`;

        return {
          id,
          section: 'podcasts',
          kind: 'podcast',
          title,
          coverUrl,
          durationSec
        };
      });
    } catch {
      return [];
    }
  }

  async listSeriesBooks(seriesItemId: string): Promise<Item[]> {
    const parsed = this.parseId(seriesItemId);
    if (!parsed) return [];
    const cleanSeriesId = parsed.itemId.replace(/^series_/, '');
    const libraryId = parsed.libraryId;

    try {
      // 1. Versuche die Serie mit Büchern zu laden
      let books: any[] = [];
      let seriesName = '';

      const res = await this.authenticatedFetch(
        `${this.config.baseUrl}/api/libraries/${libraryId}/series?include=books&limit=200`
      );
      if (res.ok) {
        const data = await res.json();
        const seriesList: any[] = data.results || [];
        const series = seriesList.find((s) => s.id === cleanSeriesId);
        if (series) {
          seriesName = series.name || '';
          books = series.books || [];
        }
      }

      // 2. Falls keine Bücher im Series-Endpoint enthalten waren: Versuche dedizierten Endpunkt
      if (books.length === 0) {
        const directRes = await this.authenticatedFetch(
          `${this.config.baseUrl}/api/libraries/${libraryId}/series/${cleanSeriesId}`
        );
        if (directRes.ok) {
          const directData = await directRes.json();
          seriesName = directData.name || seriesName;
          books = directData.books || [];
        }
      }

      // 3. Fallback: Lade alle Bücher der Bibliothek und filtere nach der Serie
      if (books.length === 0) {
        const itemsRes = await this.authenticatedFetch(
          `${this.config.baseUrl}/api/libraries/${libraryId}/items?limit=2000`
        );
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          const allItems = itemsData.results || [];
          books = allItems.filter((b: any) => {
            const bSeries = b.media?.metadata?.series || b.series || [];
            return bSeries.some(
              (s: any) =>
                s.id === cleanSeriesId ||
                (seriesName && s.name && s.name.toLowerCase() === seriesName.toLowerCase())
            );
          });
        }
      }

      if (books.length === 0) return [];

      // Sortiere Bücher nach Serien-Sequenz (Folge 1, 2, 3...)
      books.sort((a, b) => {
        const getSeq = (item: any) => {
          const seriesObj =
            item.media?.metadata?.series?.find((s: any) => s.id === cleanSeriesId) ||
            item.series?.find((s: any) => s.id === cleanSeriesId) ||
            item.media?.metadata?.series?.[0];
          const seq = seriesObj?.sequence;
          const num = parseFloat(seq);
          return isNaN(num) ? 9999 : num;
        };
        const seqDiff = getSeq(a) - getSeq(b);
        if (seqDiff !== 0) return seqDiff;
        const titleA = a.media?.metadata?.title || a.title || '';
        const titleB = b.media?.metadata?.title || b.title || '';
        return titleA.localeCompare(titleB, 'de', { numeric: true });
      });

      return books.map((book) => {
        const id = this.makeItemId(parsed.libraryId, book.id);
        const title = book.media?.metadata?.title || book.title || 'Buch';
        const durationSec = book.media?.duration ? Math.round(book.media.duration) : undefined;
        const updatedAt = book.updatedAt || 1;
        const coverUrl = `/media/cover/${id}?w=640&v=${updatedAt}`;

        const seriesObj =
          book.media?.metadata?.series?.find((s: any) => s.id === cleanSeriesId) ||
          book.series?.find((s: any) => s.id === cleanSeriesId) ||
          book.media?.metadata?.series?.[0];
        const sequence = seriesObj?.sequence ? String(seriesObj.sequence) : undefined;

        return {
          id,
          section: 'books',
          kind: 'audiobook',
          title,
          coverUrl,
          durationSec,
          sequence
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
      const res = await this.authenticatedFetch(
        `${this.config.baseUrl}/api/items/${parsed.itemId}?expanded=1`
      );
      if (!res.ok) return [];

      const item = await res.json();
      const tracks: Track[] = [];

      // Podcast-Episoden robust extrahieren (Array oder Object/Map)
      let rawEpisodes: any[] = [];
      if (Array.isArray(item.media?.episodes)) {
        rawEpisodes = item.media.episodes;
      } else if (item.media?.episodes && typeof item.media.episodes === 'object') {
        rawEpisodes = Object.values(item.media.episodes);
      } else if (Array.isArray(item.episodes)) {
        rawEpisodes = item.episodes;
      } else if (item.episodes && typeof item.episodes === 'object') {
        rawEpisodes = Object.values(item.episodes);
      }

      const isPodcast =
        item.mediaType === 'podcast' ||
        item.media?.mediaType === 'podcast' ||
        rawEpisodes.length > 0;

      if (isPodcast) {
        // Podcast: Episoden nach Veröffentlichung absteigend sortiert, max 30
        const parseTimestamp = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          const parsedTime = new Date(val).getTime();
          return isNaN(parsedTime) ? 0 : parsedTime;
        };

        rawEpisodes.sort((a, b) => {
          const timeB = parseTimestamp(b.publishedAt || b.pubDate || b.date);
          const timeA = parseTimestamp(a.publishedAt || a.pubDate || a.date);
          return timeB - timeA;
        });

        const limited = rawEpisodes.slice(0, 30);
        limited.forEach((ep) => {
          const fileId = ep.audioFile?.ino || ep.audioFile?.id || ep.id;
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
      } else {
        // Buch: Kapitel oder Audiodateien normalisieren (AGENTS.md Abschnitt 4.1)
        const chapters: any[] = item.media?.chapters || [];
        const audioFiles: any[] = item.media?.audioFiles || [];

        if (audioFiles.length > 1) {
          // Mehrdatei-Hörbuch: Jede Audiodatei ist eine spielbare Einheit (Track)
          audioFiles.forEach((af, idx) => {
            const fileId = af.ino || af.id || `${idx}`;
            const trackId = this.makeTrackId(parsed.libraryId, parsed.itemId, `f_${fileId}`);
            const streamId = `${parsed.libraryId}:${parsed.itemId}:${fileId}`;

            // Titel: Bevorzuge Kapitel-Titel (falls vorhanden), Metadaten-Titel oder Dateinamen
            const chTitle = chapters[idx]?.title;
            const metaTitle = af.metaTags?.tagTitle;
            const filename = af.metadata?.filename ? af.metadata.filename.replace(/\.[^/.]+$/, '') : `Teil ${idx + 1}`;
            const title = chTitle || metaTitle || filename;

            tracks.push({
              id: trackId,
              title,
              durationSec: Math.round(af.duration || 0),
              startOffsetSec: 0,
              streamUrl: `/media/stream/abs:${streamId}`
            });
          });
        } else if (chapters.length > 0) {
          // Einzeldatei-Hörbuch mit mehreren Kapiteln
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
        } else if (audioFiles.length === 1) {
          // Einzeldatei ohne Kapitel
          const af = audioFiles[0];
          const fileId = af.ino || af.id || '0';
          const trackId = this.makeTrackId(parsed.libraryId, parsed.itemId, `f_${fileId}`);
          const streamId = `${parsed.libraryId}:${parsed.itemId}:${fileId}`;
          const title = item.media?.metadata?.title || item.title || 'Hörbuch';

          tracks.push({
            id: trackId,
            title,
            durationSec: Math.round(af.duration || item.media?.duration || 0),
            startOffsetSec: 0,
            streamUrl: `/media/stream/abs:${streamId}`
          });
        }
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
      const res = await this.authenticatedFetch(
        `${this.config.baseUrl}/api/me/progress/${parsed.itemId}`
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
      await this.authenticatedFetch(
        `${this.config.baseUrl}/api/me/progress/${parsed.itemId}`,
        {
          method: 'PATCH',
          headers: {
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
      const res = await this.authenticatedFetch(
        `${this.config.baseUrl}/api/items/${rawItemId}/cover?raw=1`
      );
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  async streamAudio(rawItemId: string, fileId: string, rangeHeader?: string): Promise<Response> {
    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    return this.authenticatedFetch(
      `${this.config.baseUrl}/api/items/${rawItemId}/file/${fileId}`,
      { headers }
    );
  }
}
