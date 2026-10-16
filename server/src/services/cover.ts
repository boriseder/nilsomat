import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import type { Section } from '../providers/types.js';

export const ALLOWED_COVER_WIDTHS = [160, 320, 640, 1024, 1280] as const;
export type AllowedCoverWidth = (typeof ALLOWED_COVER_WIDTHS)[number];

export function isAllowedCoverWidth(width: number): width is AllowedCoverWidth {
  return (ALLOWED_COVER_WIDTHS as readonly number[]).includes(width);
}

export interface CoverOptions {
  width: AllowedCoverWidth;
  format: 'webp' | 'jpeg';
  version?: string;
  section?: Section;
  title?: string;
}

export class CoverService {
  private cacheDir: string;
  private maxCacheBytes: number;

  constructor(cacheDir?: string, maxCacheMb?: number) {
    const baseDir = cacheDir || process.env.DATA_DIR || './data';
    this.cacheDir = path.resolve(baseDir, 'cache/covers');
    const mb = maxCacheMb || Number(process.env.COVER_CACHE_MAX_MB) || 2048;
    this.maxCacheBytes = mb * 1024 * 1024;

    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  public async computeDominantColor(buffer: Buffer): Promise<string> {
    try {
      const stats = await sharp(buffer).stats();
      const { r, g, b } = stats.dominant;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch {
      return '#3b82f6';
    }
  }

  public generatePlaceholderSvg(id: string, section: Section = 'books', title: string = ''): Buffer {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const bg = `hsl(${hue}, 60%, 25%)`;
    const fg = `hsl(${hue}, 80%, 85%)`;

    let symbol = '📚';
    if (section === 'podcasts') symbol = '🎙️';
    if (section === 'music') symbol = '🎵';

    const initial = (title.trim()[0] || '').toUpperCase();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
        <rect width="640" height="640" fill="${bg}" rx="48"/>
        <text x="320" y="280" font-size="160" text-anchor="middle" dominant-baseline="central">${symbol}</text>
        <text x="320" y="460" font-size="120" font-family="system-ui, sans-serif" font-weight="bold" fill="${fg}" text-anchor="middle" dominant-baseline="central">${initial}</text>
      </svg>
    `.trim();

    return Buffer.from(svg, 'utf-8');
  }

  private getSafeCacheKey(id: string, width: number, version: string, ext: string): string {
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeVersion = (version || '1').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${safeId}-${width}-${safeVersion}.${ext}`;
  }

  public async getCover(
    id: string,
    fetchOriginal: () => Promise<Buffer | null>,
    options: CoverOptions
  ): Promise<{ buffer: Buffer; contentType: string; etag: string }> {
    const ext = options.format === 'webp' ? 'webp' : 'jpg';
    const version = options.version || '1';
    const cacheFile = path.join(this.cacheDir, this.getSafeCacheKey(id, options.width, version, ext));

    // Disk-Cache prüfen
    if (fs.existsSync(cacheFile)) {
      try {
        const buffer = await fs.promises.readFile(cacheFile);
        const etag = `"${crypto.createHash('md5').update(buffer).digest('hex')}"`;
        return {
          buffer,
          contentType: options.format === 'webp' ? 'image/webp' : 'image/jpeg',
          etag
        };
      } catch {
        // Fallback: neu verarbeiten
      }
    }

    // Original holen
    let original = await fetchOriginal();

    if (!original) {
      // 404 / Kein Cover -> Platzhalter generieren
      original = this.generatePlaceholderSvg(id, options.section, options.title);
    }

    // Mit sharp skalieren und formatieren
    let pipeline = sharp(original).resize(options.width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });

    if (options.format === 'webp') {
      pipeline = pipeline.webp({ quality: 82 });
    } else {
      pipeline = pipeline.jpeg({ quality: 85, progressive: true });
    }

    const outputBuffer = await pipeline.toBuffer();
    const etag = `"${crypto.createHash('md5').update(outputBuffer).digest('hex')}"`;

    // In Cache speichern und bereinigen
    await this.saveToCache(cacheFile, outputBuffer);

    return {
      buffer: outputBuffer,
      contentType: options.format === 'webp' ? 'image/webp' : 'image/jpeg',
      etag
    };
  }

  private async saveToCache(filePath: string, buffer: Buffer): Promise<void> {
    try {
      this.ensureCacheDir();
      await fs.promises.writeFile(filePath, buffer);
      await this.pruneCacheIfNeeded();
    } catch {
      // Disk-Cache-Fehler verhindern nicht die Auslieferung
    }
  }

  private async pruneCacheIfNeeded(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.cacheDir);
      let totalBytes = 0;
      const statsList: { file: string; size: number; mtime: number }[] = [];

      for (const file of files) {
        const fullPath = path.join(this.cacheDir, file);
        const stat = await fs.promises.stat(fullPath);
        totalBytes += stat.size;
        statsList.push({ file: fullPath, size: stat.size, mtime: stat.mtimeMs });
      }

      if (totalBytes > this.maxCacheBytes) {
        // Älteste Dateien löschen bis 80% des Limits
        statsList.sort((a, b) => a.mtime - b.mtime);
        const targetBytes = this.maxCacheBytes * 0.8;
        for (const item of statsList) {
          if (totalBytes <= targetBytes) break;
          await fs.promises.unlink(item.file).catch(() => {});
          totalBytes -= item.size;
        }
      }
    } catch {
      // Ignorieren
    }
  }
}

export const coverService = new CoverService();
