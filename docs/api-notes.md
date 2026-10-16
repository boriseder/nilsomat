# API-Notizen: Audiobookshelf & Navidrome (Subsonic)

Dieses Dokument sammelt verbindliche Erkenntnisse, Endpunkt-Spezifikationen und Felddefinitionen zu den Quell-Systemen gemäß Abschnitt 4 von `AGENTS.md`.

---

## 1. Audiobookshelf (ABS)

- **Dokumentation:** https://api.audiobookshelf.org
- **Authentifizierung:** Dedizierter Kind-Benutzer (kein Admin) mit Bearer-Token (`Authorization: Bearer <token>`) oder Login via `/login` mit Benutzername und Passwort.
- **Bibliotheken:**
  - GET `/api/libraries` liefert `{ libraries: [{ id, name, mediaType: "book" | "podcast", icon, ... }] }`.
  - Zuordnung: Eine Bibliothek für Hörbücher (`mediaType: book`), eine für Podcasts (`mediaType: podcast`).
- **Hörbücher (Items & Tracks):**
  - GET `/api/libraries/:libraryId/items?sort=media.metadata.title`
  - Item-Detail: GET `/api/items/:id?expanded=1`
  - Einzeldatei-Hörbuch mit Kapiteln: `media.chapters` (`[{ id, start, end, title }]`) und eine Audiodatei `media.audioFiles[0]`.
    Wird normalisiert zu `Track[]`, wobei jeder Track `startOffsetSec = chapter.start` und `durationSec = chapter.end - chapter.start` erhält.
  - Mehrdatei-Hörbuch (z. B. CD1, CD2...): `media.audioFiles` (`[{ ino, index, duration, metadata: { filename } }]`).
    Wird normalisiert zu `Track[]`, wobei jede Audiodatei ein Track mit eigenem Stream-Link ist.
- **Podcasts (Sendung & Episoden):**
  - GET `/api/libraries/:libraryId/items` liefert Sendungen als Items.
  - Item-Detail: GET `/api/items/:id?expanded=1` enthält `media.episodes` (`[{ id, title, duration, publishedAt, audioFile: { ino } }]`).
  - Sortierung: Neueste zuerst (`publishedAt` absteigend), maximal 30 Episoden anzeigen.
- **Cover:**
  - GET `/api/items/:id/cover`
  - Unterstützt Query-Parameter `raw=1` für Originalbild in maximaler Auflösung.
- **Audio-Streaming:**
  - GET `/api/items/:id/file/:fileId`
  - Unterstützt HTTP-Range-Requests (`Range: bytes=start-end`), liefert 206 Partial Content mit `Content-Range` und `Accept-Ranges: bytes`.
- **Fortschritt:**
  - GET `/api/me/progress/:libraryItemId`
  - PATCH `/api/me/progress/:libraryItemId` mit Body: `{ currentTime: number, duration?: number, isFinished?: boolean }`
  - Für Podcast-Episoden: PATCH `/api/me/progress/:libraryItemId/:episodeId`


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
