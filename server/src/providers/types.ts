export type Kind = 'audiobook' | 'podcast' | 'album' | 'playlist' | 'series';
export type Section = 'books' | 'podcasts' | 'music';

export interface ItemProgress {
  positionSec: number;
  finished: boolean;
  updatedAt: number;
}

export interface Item {
  id: string;            // opak, z. B. "abs:<libId>:<itemId>" oder "nd:album:<id>"
  section: Section;
  kind: Kind;
  title: string;
  coverUrl: string;      // IMMER /media/cover/<id>, nie eine Fremd-URL
  durationSec?: number;
  progress?: ItemProgress;
  dominantColor?: string; // Hex, vom BFF berechnet (Abschnitt 5b)
  bookCount?: number;    // Anzahl der Bücher bei Serien
  songCount?: number;    // Anzahl der Lieder bei Playlists/Alben
  sequence?: string;     // Sequenz/Folgennummer innerhalb einer Serie
}

export interface Track {        // spielbare Einheit (Kapitel, Episode, Lied)
  id: string;
  title: string;
  durationSec: number;
  streamUrl: string;     // IMMER /media/stream/<id>
  startOffsetSec?: number; // für ABS-Kapitel in einer Datei
}

export interface ContentProvider {
  listItems(section: Section): Promise<Item[]>;
  listTracks(itemId: string): Promise<Track[]>;       // Podcast: Episoden
  getProgress(itemId: string): Promise<Item['progress'] | null>;
  saveProgress(
    itemId: string,
    positionSec: number,
    finished: boolean,
    durationSec?: number
  ): Promise<void>;
  listSeriesBooks?(seriesId: string): Promise<Item[]>; // Bücher einer Serie
}
