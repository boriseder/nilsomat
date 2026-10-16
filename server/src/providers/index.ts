import { AudiobookshelfProvider, type ABSConfig } from './abs.js';
import { NavidromeProvider } from './navidrome.js';
import type { ContentProvider, Section } from './types.js';

let absProvider = new AudiobookshelfProvider({
  baseUrl: process.env.ABS_URL || 'http://localhost:13378',
  token: process.env.ABS_TOKEN || '',
  booksLibraryId: process.env.ABS_BOOKS_LIB_ID || '',
  podcastsLibraryId: process.env.ABS_PODCASTS_LIB_ID || ''
});

let navidromeProvider = new NavidromeProvider();

export function setABSProvider(provider: AudiobookshelfProvider): void {
  absProvider = provider;
}

export function updateABSConfig(config: ABSConfig): void {
  absProvider = new AudiobookshelfProvider(config);
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
