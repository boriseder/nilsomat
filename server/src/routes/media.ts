import { Hono } from 'hono';
import { getABSProvider, getNavidromeProvider } from '../providers/index.js';
import type { Section } from '../providers/types.js';
import { coverService, isAllowedCoverWidth } from '../services/cover.js';

export const mediaRoutes = new Hono();

// Cover-Endpunkt gemäß Abschnitt 5b
// /media/cover/<id>?w=<breite>&v=<version>[&f=jpg]
mediaRoutes.get('/cover/:id', async (c) => {
  const id = c.req.param('id');
  const wQuery = c.req.query('w');
  const v = c.req.query('v') || '1';
  const f = c.req.query('f');

  const width = Number(wQuery);
  if (!wQuery || !isAllowedCoverWidth(width)) {
    return c.text('Ungültige Cover-Breite. Erlaubt: 160, 320, 640, 1024, 1280.', 400);
  }

  // Format-Verhandlung
  const accept = c.req.header('Accept') || '';
  const forceJpg = f === 'jpg';
  const format: 'webp' | 'jpeg' = !forceJpg && accept.includes('image/webp') ? 'webp' : 'jpeg';

  let fetchOriginal: () => Promise<Buffer | null> = async () => null;
  let section: Section | undefined = undefined;

  if (id.startsWith('abs:')) {
    const absProvider = getABSProvider();
    const parsed = absProvider.parseId(id);
    if (parsed) {
      fetchOriginal = async () => absProvider.fetchCoverOriginal(parsed.itemId);
      section = 'books';
    }
  } else if (id.startsWith('nd:')) {
    const ndProvider = getNavidromeProvider();
    const parsed = ndProvider.parseId(id);
    if (parsed) {
      // In Navidrome kann v die coverArtId sein oder die Item-ID
      const coverArtId = v && v !== '1' ? v : parsed.id;
      fetchOriginal = async () => ndProvider.fetchCoverOriginal(coverArtId);
      section = 'music';
    }
  } else {
    return c.text('Ungültige Medien-ID', 400);
  }

  try {
    const result = await coverService.getCover(id, fetchOriginal, {
      width,
      format,
      version: v,
      section
    });

    // ETag-Prüfung für 304 Not Modified
    const clientEtag = c.req.header('if-none-match');
    if (
      clientEtag &&
      (clientEtag === result.etag ||
        clientEtag === result.etag.replace(/^"|"$/g, '') ||
        clientEtag === `W/${result.etag}`)
    ) {
      return new Response(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: result.etag
        }
      });
    }

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: result.etag
      }
    });
  } catch {
    return c.text('Fehler bei der Cover-Verarbeitung', 500);
  }
});

// Audio-Stream-Proxy mit Range-Support gemäß Abschnitt 2 & 7
// /media/stream/<id>
mediaRoutes.get('/stream/:id', async (c) => {
  const id = c.req.param('id');
  const rangeHeader = c.req.header('Range');
  let upstreamRes: Response | null = null;

  try {
    if (id.startsWith('abs:')) {
      const absProvider = getABSProvider();
      const parsed = absProvider.parseId(id);
      if (!parsed || !parsed.partId) {
        return c.text('Ungültige Audio-ID', 400);
      }
      upstreamRes = await absProvider.streamAudio(parsed.itemId, parsed.partId, rangeHeader);
    } else if (id.startsWith('nd:')) {
      const ndProvider = getNavidromeProvider();
      const parsed = ndProvider.parseId(id);
      if (!parsed || parsed.kind !== 'track') {
        return c.text('Ungültige Audio-ID', 400);
      }
      upstreamRes = await ndProvider.streamAudio(parsed.id, rangeHeader);
    } else {
      return c.text('Ungültige Audio-ID', 400);
    }

    const headers = new Headers();
    headers.set('Accept-Ranges', 'bytes');

    const copyHeaders = ['content-range', 'content-length', 'content-type'];
    for (const h of copyHeaders) {
      const val = upstreamRes.headers.get(h);
      if (val) {
        headers.set(h, val);
      }
    }

    headers.set('Cache-Control', 'no-cache');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers
    });
  } catch {
    return c.text('Streaming-Fehler', 502);
  }
});
