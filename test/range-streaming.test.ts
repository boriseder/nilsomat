import { describe, expect, it } from 'vitest';
import app from '../server/src/index.js';
import { AudiobookshelfProvider } from '../server/src/providers/abs.js';
import { setABSProvider } from '../server/src/providers/index.js';

describe('HTTP Range Streaming Proxy (AGENTS.md Abschnitt 2 & 7)', () => {
  it('ungültige Stream-ID liefert HTTP 400', async () => {
    const res = await app.request('/media/stream/invalid-id');
    expect(res.status).toBe(400);
  });

  it('leitet Range-Requests korrekt durch und liefert 206 mit Range-Headern', async () => {
    let capturedRangeHeader: string | undefined;

    const mockFetch = async (_url: string, init?: RequestInit) => {
      capturedRangeHeader = (init?.headers as any)?.['Range'];
      const headers = new Headers();
      headers.set('Content-Range', 'bytes 0-499/10000');
      headers.set('Content-Length', '500');
      headers.set('Content-Type', 'audio/mp4');

      return new Response(new Uint8Array(500), {
        status: 206,
        headers
      });
    };

    const mockProvider = new AudiobookshelfProvider(
      { baseUrl: 'http://abs.test' },
      mockFetch as any
    );
    setABSProvider(mockProvider);

    const res = await app.request('/media/stream/abs:lib1:book1:file1', {
      headers: {
        Range: 'bytes=0-499'
      }
    });

    expect(capturedRangeHeader).toBe('bytes=0-499');
    expect(res.status).toBe(206);
    expect(res.headers.get('Accept-Ranges')).toBe('bytes');
    expect(res.headers.get('Content-Range')).toBe('bytes 0-499/10000');
    expect(res.headers.get('Content-Length')).toBe('500');
    expect(res.headers.get('Content-Type')).toBe('audio/mp4');
  });

  it('unterstützt HEAD-Requests für Metadaten-Probes von Safari mit leerem Body', async () => {
    const mockFetch = async () => {
      const headers = new Headers();
      headers.set('Content-Length', '10000');
      headers.set('Content-Type', 'audio/mp4');
      return new Response(null, { status: 200, headers });
    };

    const mockProvider = new AudiobookshelfProvider(
      { baseUrl: 'http://abs.test' },
      mockFetch as any
    );
    setABSProvider(mockProvider);

    const res = await app.request('/media/stream/abs:lib1:book1:file1', {
      method: 'HEAD'
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Accept-Ranges')).toBe('bytes');
    expect(res.headers.get('Content-Length')).toBe('10000');
    expect(res.headers.get('Content-Type')).toBe('audio/mp4');
    const bodyText = await res.text();
    expect(bodyText).toBe('');
  });
});
