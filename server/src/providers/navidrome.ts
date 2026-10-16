import type { ContentProvider, Item, Section, Track } from './types.js';

export class NavidromeProvider implements ContentProvider {
  async listItems(_section: Section): Promise<Item[]> {
    return [];
  }

  async listTracks(_itemId: string): Promise<Track[]> {
    return [];
  }

  async getProgress(_itemId: string): Promise<Item['progress'] | null> {
    return null;
  }

  async saveProgress(_itemId: string, _positionSec: number, _finished: boolean): Promise<void> {
    // Navidrome speichert keinen Kind-Fortschritt (Abschnitt 4.2)
  }
}
