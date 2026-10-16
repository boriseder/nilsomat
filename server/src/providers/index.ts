import { AudiobookshelfProvider, type ABSConfig } from './abs.js';
import { NavidromeProvider, type NavidromeConfig } from './navidrome.js';
import type { ContentProvider, Section } from './types.js';

import { getDB } from '../db.js';

export function reloadProvidersFromDB(): void {
  try {
    const db = getDB();
    const config = db.getConfig();

    absProvider = new AudiobookshelfProvider({
      baseUrl: config.absUrl || process.env.ABS_URL || 'http://localhost:13378',
      token: config.absToken || process.env.ABS_TOKEN || '',
      booksLibraryId: config.absBooksLibId || process.env.ABS_BOOKS_LIB_ID || '',
      podcastsLibraryId: config.absPodcastsLibId || process.env.ABS_PODCASTS_LIB_ID || ''
    });

    navidromeProvider = new NavidromeProvider({
      baseUrl: config.navidromeUrl || process.env.NAVIDROME_URL || 'http://localhost:4533',
      user: config.navidromeUser || process.env.NAVIDROME_USER || '',
      password: config.navidromePassword || process.env.NAVIDROME_PASSWORD || ''
    });
  } catch {
    // Falls DB noch nicht initialisiert ist
  }
}

let absProvider = new AudiobookshelfProvider({
  baseUrl: process.env.ABS_URL || 'http://localhost:13378',
  token: process.env.ABS_TOKEN || '',
  booksLibraryId: process.env.ABS_BOOKS_LIB_ID || '',
  podcastsLibraryId: process.env.ABS_PODCASTS_LIB_ID || ''
});

let navidromeProvider = new NavidromeProvider({
  baseUrl: process.env.NAVIDROME_URL || 'http://localhost:4533',
  user: process.env.NAVIDROME_USER || '',
  password: process.env.NAVIDROME_PASSWORD || ''
});

// Direkt beim Laden versuchen aus DB zu laden
reloadProvidersFromDB();

export function setABSProvider(provider: AudiobookshelfProvider): void {
  absProvider = provider;
}

export function updateABSConfig(config: ABSConfig): void {
  absProvider = new AudiobookshelfProvider(config);
}

export function setNavidromeProvider(provider: NavidromeProvider): void {
  navidromeProvider = provider;
}

export function updateNavidromeConfig(config: Partial<NavidromeConfig>): void {
  navidromeProvider = new NavidromeProvider(config);
}

export function getABSProvider(): AudiobookshelfProvider {
  return absProvider;
}

export function getNavidromeProvider(): NavidromeProvider {
  return navidromeProvider;
}

export function getProviderForId(id: string): ContentProvider | null {
  if (id.startsWith('abs:')) {
    return absProvider;
  }
  if (id.startsWith('nd:')) {
    return navidromeProvider;
  }
  return null;
}

export function getProviderForSection(section: Section): ContentProvider | null {
  if (section === 'books' || section === 'podcasts') {
    return absProvider;
  }
  if (section === 'music') {
    return navidromeProvider;
  }
  return null;
}
