import { Hono } from 'hono';
import { getABSProvider } from '../providers/index.js';
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

  const absProvider = getABSProvider();
  const parsed = absProvider.parseId(id);

  // Original-Abruf-Funktion
  const fetchOriginal = async (): Promise<Buffer | null> => {
    if (parsed) {
      return absProvider.fetchCoverOriginal(parsed.itemId);
    }
    return null;
  };

  try {
    const result = await coverService.getCover(id, fetchOriginal, {
      width,
      format,
      version: v,
      section: parsed?.libraryId ? 'books' : undefined
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
  const absProvider = getABSProvider();
  const parsed = absProvider.parseId(id);

  if (!parsed || !parsed.partId) {
    return c.text('Ungültige Audio-ID', 400);
  }

  const rangeHeader = c.req.header('Range');

  try {
    const upstreamRes = await absProvider.streamAudio(parsed.itemId, parsed.partId, rangeHeader);

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
