// ALLE UI-Texte (Deutsch), keine Strings in Komponenten (AGENTS.md Abschnitt 2 & 9)
// Die Texte im Namensraum `kid` dürfen KEINE verbotenen Wörter enthalten:
// (Server, ABS, Audiobookshelf, Navidrome, Subsonic, API, Token, Login, Fehlercode, URL, Bibliothek)

export const strings = {
  kid: {
    appName: 'Nils-o-mat',
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
      retry: 'Nochmal versuchen',
      tracklistChapters: 'Kapitel',
      tracklistSongs: 'Lieder',
      backToCover: 'Zum Cover',
      loadMoreEpisodes: 'Mehr Folgen zeigen'
    },
    status: {
      loading: 'Lädt...',
      continueListening: 'Weiterhören',
      allListened: 'Alles fertig gehört!',
      sleepTimerActive: 'Schlummermodus an',
      dailyLimitReached: 'Für heute ist genug gehört. Bis morgen!',
      emptyCategory: 'Hier ist noch nichts da.'
    },
    error: {
      general: 'Gerade geht es nicht. Sag Mama oder Papa Bescheid.',
      streamFailed: 'Das Abspielen klappt gerade nicht. Sag Mama oder Papa Bescheid.'
    },
    views: {
      grid: 'Kacheln',
      list: 'Liste'
    },
    musicFilters: {
      all: 'Alles',
      playlists: 'Playlists',
      albums: 'Alben'
    },
    types: {
      series: 'Serie',
      episode: 'Folge',
      episodes: 'Folgen',
      audiobook: 'Hörbuch',
      playlist: 'Playlist',
      album: 'Album',
      song: 'Lied',
      songs: 'Lieder'
    }
  },
  parent: {
    title: 'Einstellungen für Eltern',
    setupTitle: 'Ersteinrichtung',
    setupPrompt: 'Bitte lege eine 4- bis 8-stellige Eltern-PIN fest:',
    pinPrompt: 'Bitte Eltern-PIN eingeben',
    pinSubmit: 'Bestätigen',
    pinCancel: 'Abbrechen',
    pinClear: 'Löschen',
    pinLocked: 'Zu viele Fehlversuche. Bitte 5 Minuten warten.',
    backToKid: 'Zum Kinderbereich',
    tabs: {
      connections: 'Verbindungen',
      assignment: 'Zuordnung',
      items: 'Inhalte verwalten',
      rules: 'Regeln & Limits',
      status: 'Status',
      security: 'Sicherheit'
    },
    connections: {
      absTitle: 'Audiobookshelf (Hörbücher & Podcasts)',
      absUrl: 'Server-Adresse (URL)',
      absUser: 'Benutzername (empfohlen)',
      absPassword: 'Passwort',
      absToken: 'API-Token (optional)',
      absTokenToggle: 'Alternativ mit API-Token verbinden',
      navidromeTitle: 'Navidrome (Musik)',
      navidromeUrl: 'Server-Adresse (URL)',
      navidromeUser: 'Benutzername',
      navidromePassword: 'Passwort',
      test: 'Verbindung testen',
      testing: 'Teste Verbindung...',
      testSuccess: 'Verbindung erfolgreich!',
      testFailed: 'Verbindung fehlgeschlagen',
      savedSet: 'Gesetzt',
      savedNotSet: 'Nicht gesetzt',
      saveAll: 'Einstellungen speichern',
      saving: 'Speichere...',
      savedSuccess: 'Gespeichert!'
    },
    assignment: {
      intro: 'Wähle die passenden Bibliotheken aus Audiobookshelf aus:',
      booksLib: 'Bibliothek für Hörbücher',
      podcastsLib: 'Bibliothek für Podcasts',
      selectPlaceholder: '-- Bitte auswählen --',
      noLibraries: 'Keine Bibliotheken geladen. Bitte zuerst ABS-Verbindung testen.'
    },
    items: {
      intro: 'Titel oder Alben verbergen, damit sie im Kinderbereich nicht sichtbar sind:',
      searchPlaceholder: 'Titel filtern...',
      hide: 'Verbergen',
      show: 'Freigeben',
      statusHidden: 'Verborgen',
      statusVisible: 'Sichtbar',
      empty: 'Keine Medien gefunden.'
    },
    rules: {
      sleepTimerTitle: 'Schlaf-Timer Standard',
      dailyLimitTitle: 'Tageslimit für das Kind',
      dailyLimitDesc: 'Nach Ablauf der Zeit wird der Player gesperrt und die Endeseite angezeigt. Setzt sich um Mitternacht zurück.',
      off: 'Aus',
      minutes: 'Minuten',
      min15: '15 Minuten',
      min30: '30 Minuten',
      min45: '45 Minuten',
      min60: '60 Minuten',
      min90: '90 Minuten',
      min120: '120 Minuten'
    },
    status: {
      title: 'Verbindungs- und Fehlerprotokoll',
      todayListened: 'Heute gehört:',
      dailyLimit: 'Tageslimit:',
      absStatus: 'Audiobookshelf:',
      navidromeStatus: 'Navidrome:',
      configured: 'Konfiguriert',
      notConfigured: 'Nicht konfiguriert',
      limitReached: 'Tageslimit erreicht!',
      limitActive: 'Aktiv',
      noLogs: 'Keine Protokolleinträge vorhanden.'
    },
    security: {
      changePinTitle: 'Eltern-PIN ändern',
      currentPin: 'Aktuelle PIN',
      newPin: 'Neue PIN (4-8 Ziffern)',
      changePinButton: 'PIN ändern',
      pinChangedSuccess: 'PIN erfolgreich geändert!',
      resetTitle: 'App-Daten zurücksetzen',
      resetDesc: 'Löscht alle gespeicherten Zugangsdaten, Zuordnungen, verborge Titel und die PIN unwiderruflich.',
      resetButton: 'Alle App-Daten zurücksetzen',
      resetConfirmPrompt: 'Möchtest du wirklich alle Einstellungen und Daten zurücksetzen?'
    }
  }
} as const;

export type Strings = typeof strings;
