export type Kind = 'audiobook' | 'podcast' | 'album' | 'playlist';
export type Section = 'books' | 'podcasts' | 'music';

export interface ItemProgress {
  positionSec: number;
  finished: boolean;
  updatedAt: number;
}

export interface Item {
  id: string;
  section: Section;
  kind: Kind;
  title: string;
  coverUrl: string;
  durationSec?: number;
  progress?: ItemProgress;
  dominantColor?: string;
}

export interface Track {
  id: string;
  title: string;
  durationSec: number;
  streamUrl: string;
  startOffsetSec?: number;
}
