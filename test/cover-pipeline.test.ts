import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import app from '../server/src/index.js';
import { CoverService, isAllowedCoverWidth } from '../server/src/services/cover.js';

describe('Cover-Pipeline gemäß AGENTS.md Abschnitt 5b', () => {
  it('Whitelist für Cover-Breiten validiert exakt {160, 320, 640, 1024, 1280}', () => {
    const validWidths = [160, 320, 640, 1024, 1280];
    for (const w of validWidths) {
      expect(isAllowedCoverWidth(w)).toBe(true);
    }

    const invalidWidths = [50, 200, 500, 800, 1920, 0, -100];
    for (const w of invalidWidths) {
      expect(isAllowedCoverWidth(w)).toBe(false);
    }
  });

  it('GET /media/cover/:id mit ungültiger Breite liefert HTTP 400', async () => {
    const res = await app.request('/media/cover/abs:lib:item1?w=500');
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('Ungültige Cover-Breite');
  });

  it('GET /media/cover/:id mit fehlender Breite liefert HTTP 400', async () => {
    const res = await app.request('/media/cover/abs:lib:item1');
    expect(res.status).toBe(400);
  });

  it('Platzhalter wird erzeugt wenn Dienst 404 liefert und liefert korrekte Cache-Header', async () => {
    const res = await app.request('/media/cover/abs:lib:item404?w=640', {
      headers: {
        Accept: 'image/webp'
      }
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    const etag = res.headers.get('ETag');
    expect(etag).not.toBeNull();

    // Bei If-None-Match mit demselben ETag -> 304 Not Modified
    const cachedRes = await app.request('/media/cover/abs:lib:item404?w=640', {
      headers: {
        Accept: 'image/webp',
        'If-None-Match': etag!
      }
    });
    expect(cachedRes.status).toBe(304);
  });

  it('Parameter f=jpg erzwingt JPEG auch wenn Accept image/webp enthält', async () => {
    const res = await app.request('/media/cover/abs:lib:item404?w=320&f=jpg', {
      headers: {
        Accept: 'image/webp'
      }
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('Kein Upscaling: Bild wird nicht vergrößert wenn Original kleiner als w ist', async () => {
    const coverService = new CoverService('/tmp/test-covers-' + Date.now(), 50);

    // Erzeuge ein kleines 100x100 Bild
    const smallBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 120, g: 150, b: 200 }
      }
    })
      .jpeg()
      .toBuffer();

    const fetchOriginal = async () => smallBuffer;

    const result = await coverService.getCover('test:small:1', fetchOriginal, {
      width: 640,
      format: 'jpeg'
    });

    const meta = await sharp(result.buffer).metadata();
    // width darf maximal 100 sein, nicht auf 640 hochskaliert!
    expect(meta.width).toBeLessThanOrEqual(100);
  });

  it('Berechnung der dominantColor liefert gültigen Hex-Farbcode', async () => {
    const coverService = new CoverService();

    const redBuffer = await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .png()
      .toBuffer();

    const hex = await coverService.computeDominantColor(redBuffer);
    expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeLessThan(20);
    expect(b).toBeLessThan(20);
  });
});
