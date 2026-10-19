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
- **Antwort-Format:**
  - Alle JSON-Antworten sind im Wurzelelement `subsonic-response` verpackt:
    `{ "subsonic-response": { "status": "ok", "version": "1.16.1", ... } }`
  - Fehler: `{ "subsonic-response": { "status": "failed", "error": { "code": 10, "message": "Required parameter is missing" } } }`
- **Authentifizierung (Salt + Token):**
  - Parameter: `u=<user>`, `s=<hex-salt>`, `t=<md5(password + salt)>`, `v=1.16.1`, `c=nilsomat`, `f=json`.
  - Pro Request wird ein neuer kryptografischer Salt `s` (z. B. 16 Hex-Zeichen) generiert und `t = MD5(password + s)` berechnet.
  - Niemals Klartextpasswörter im Query-String!
- **Alben (`getAlbumList2.view`):**
  - Parameter: `type=recent` (oder `alphabeticalByArtist`, `random`, `newest`), `size=100`.
  - Liefert: `subsonic-response.albumList2.album: [{ id, name, artist, coverArt, songCount, duration, created }]`.
- **Playlists (`getPlaylists.view`):**
  - Liefert: `subsonic-response.playlists.playlist: [{ id, name, coverArt, songCount, duration }]`.
  - Playlists haben im Kinderbereich Vorrang, wenn welche freigegeben sind.
- **Album-Tracks (`getAlbum.view`):**
  - Parameter: `id=<albumId>`.
  - Liefert: `subsonic-response.album.song: [{ id, title, track, duration, contentType, suffix }]`.
- **Playlist-Tracks (`getPlaylist.view`):**
  - Parameter: `id=<playlistId>`.
  - Liefert: `subsonic-response.playlist.entry: [{ id, title, track, duration, contentType, suffix }]`.
- **Cover (`getCoverArt.view`):**
  - Parameter: `id=<coverArtId>`, `size=<px>`.
  - Liefert Binärbild.
- **Audio-Streaming (`stream.view`):**
  - Parameter: `id=<songId>`, `format=raw`, `estimateContentLength=true`.
  - Wichtig: Ohne `format=raw` transkodiert Navidrome per `ffmpeg` auf dem Server, was zu 3–8 s Startverzögerung und fehlerhaften Range-Headern führt. Mit `format=raw` wird die Originaldatei direkt gestreamt.
  - Unterstützt HTTP-Range-Requests (`Range: bytes=start-end`), liefert 206 Partial Content mit `Content-Range` und `Accept-Ranges: bytes`.
- **Fortschritt & Scrobbling (Abschnitt 4.2):**
  - Für Musik wird kein Fortschritt gespeichert (`getProgress()` liefert `null`, `saveProgress()` ist ein No-Op).
  - Kein Scrobbling (`scrobble.view`), keine Bewertungen.
