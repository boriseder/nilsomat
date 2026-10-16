// ALLE UI-Texte (Deutsch), keine Strings in Komponenten (AGENTS.md Abschnitt 2 & 9)
// Die Texte im Namensraum `kid` dürfen KEINE verbotenen Wörter enthalten:
// (Server, ABS, Audiobookshelf, Navidrome, Subsonic, API, Token, Login, Fehlercode, URL, Bibliothek)

export const strings = {
  kid: {
    appName: 'Hörbox',
    sections: {
      books: 'Hörbücher',
      podcasts: 'Podcasts',
      music: 'Musik'
    },
    actions: {
      back: 'Zurück',
      play: 'Abspielen',
      pause: 'Pause',
      rewind30: '30 Sekunden zurück',
      next: 'Weiter',
      previous: 'Zurück',
      sleepTimer: 'Schlummern',
      close: 'Schließen',
      retry: 'Nochmal versuchen'
    },
    status: {
      loading: 'Lädt...',
      continueListening: 'Weiterhören',
      allListened: 'Alles fertig gehört!',
      sleepTimerActive: 'Schlummermodus an',
      dailyLimitReached: 'Für heute ist genug gehört. Bis morgen!'
    },
    error: {
      general: 'Gerade geht es nicht. Sag Mama oder Papa Bescheid.',
      streamFailed: 'Das Abspielen klappt gerade nicht. Sag Mama oder Papa Bescheid.'
    }
  },
  parent: {
    title: 'Einstellungen für Eltern',
    pinPrompt: 'Bitte PIN eingeben',
    pinSubmit: 'Bestätigen',
    pinLocked: 'Zu viele Fehlversuche. Bitte 5 Minuten warten.',
    sections: {
      connections: 'Verbindungen',
      assignment: 'Bibliotheks-Zuordnung',
      selection: 'Inhalte verwalten',
      limits: 'Schlaf-Timer & Tageslimit',
      status: 'System-Status',
      security: 'Sicherheit'
    },
    labels: {
      absUrl: 'Audiobookshelf-Adresse',
      absToken: 'Audiobookshelf-Token',
      navidromeUrl: 'Navidrome-Adresse',
      navidromeUser: 'Navidrome-Benutzername',
      testConnection: 'Verbindung testen',
      save: 'Speichern'
    }
  }
} as const;

export type Strings = typeof strings;
