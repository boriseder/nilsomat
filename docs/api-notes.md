# API-Notizen: Audiobookshelf & Navidrome (Subsonic)

Dieses Dokument sammelt verbindliche Erkenntnisse, Endpunkt-Spezifikationen und Felddefinitionen zu den Quell-Systemen gemäß Abschnitt 4 von `AGENTS.md`.

---

## 1. Audiobookshelf (ABS)

- **Dokumentation:** https://api.audiobookshelf.org
- **Authentifizierung:** Dedizierter Kind-Benutzer (kein Admin) mit Bearer-Token (`Authorization: Bearer <token>`) oder Login via `/login` mit Benutzername und Passwort.
- **Bibliotheken:**
  - GET `/api/libraries` liefert alle Bibliotheken mit `id`, `name`, `mediaType` (`book` oder `podcast`).
  - Zuordnung: Eine Bibliothek für Hörbücher (`mediaType: book`), eine für Podcasts (`mediaType: podcast`).
- **Hörbücher & Podcasts:**
  - GET `/api/libraries/:id/items`
  - GET `/api/items/:id`
  - Cover: `/api/items/:id/cover` (mit Parametern wie `width`, `height`, `format`)
  - Streaming: `/api/items/:id/file/:fileId`
- **Fortschritt:**
  - Playback-Session (`/api/session/local`) und/oder `PATCH /api/me/progress/:id` (Details werden in M1 final gegen Doku/Instanz verifiziert).

---

## 2. Navidrome (Subsonic / OpenSubsonic API)

- **Dokumentation:** https://www.navidrome.org/docs/developers/subsonic-api/ & OpenSubsonic-Spezifikation
- **Authentifizierung:**
  - Parameter: `u` (Benutzername), `t` (Token = MD5(Passwort + Salt)), `s` (Zufallssalt), `v=1.16.1`, `c=hoerbox`, `f=json`.
  - Jeder Request erzeugt ein neues Salt `s` und berechnet `t` neu. Kein Klartext-Passwort im Query-String!
- **Alben & Playlists:**
  - GET `/rest/getAlbumList2.view` (Typen: `recent`, `alphabeticalByArtist`, `random`)
  - GET `/rest/getPlaylists.view` & GET `/rest/getPlaylist.view`
  - GET `/rest/getAlbum.view` (Tracks eines Albums)
- **Cover:**
  - GET `/rest/getCoverArt.view?id=<id>&size=<size>`
- **Stream:**
  - GET `/rest/stream.view?id=<id>` (unterstützt HTTP-Range für Seek/iOS)
