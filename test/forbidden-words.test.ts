import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Verbotene Wörter laut AGENTS.md Abschnitt 1 & 9
const FORBIDDEN_WORDS = [
  'server',
  'abs',
  'audiobookshelf',
  'navidrome',
  'subsonic',
  'api',
  'token',
  'login',
  'fehlercode',
  'url',
  'bibliothek'
];

function scanFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...scanFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.svelte') || file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Scan auf verbotene Wörter im Kinderbereich (AGENTS.md Abschnitt 9)', () => {
  it('client/src/kid/** darf keines der verbotenen Wörter enthalten', () => {
    const kidDir = path.resolve(__dirname, '../client/src/kid');
    const files = scanFiles(kidDir);

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Kommentare und Variablen-Namen ausschließen, nur Textinhalt prüfen
      // bzw. strikte Wortsuche (case-insensitive)
      for (const word of FORBIDDEN_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        const match = content.match(regex);
        if (match) {
          throw new Error(
            `Verbotenes Wort "${match[0]}" gefunden in Datei: ${file}`
          );
        }
      }
    }
  });

  it('strings.ts unter dem Namensraum kid.* darf keines der verbotenen Wörter enthalten', async () => {
    const stringsPath = path.resolve(__dirname, '../client/src/strings.ts');
    const content = fs.readFileSync(stringsPath, 'utf-8');

    // Extrahiere kid namespace
    const kidSectionMatch = content.match(/kid:\s*\{([\s\S]*?)\n\s*\},?\s*parent:/);
    expect(kidSectionMatch).not.toBeNull();

    const kidContent = kidSectionMatch![1];

    for (const word of FORBIDDEN_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      const match = kidContent.match(regex);
      if (match) {
        throw new Error(
          `Verbotenes Wort "${match[0]}" im strings.kid Namensraum gefunden: ${match[0]}`
        );
      }
    }
  });
});
