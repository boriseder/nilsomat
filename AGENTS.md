# AGENTS.md: Kinder-Audio-App ("Hörbox")

Verbindliche Regeln für alle Agents und Menschen, die an diesem Repository arbeiten.
Schlüsselwörter **MUSS**, **DARF NICHT**, **SOLL** sind strikt zu verstehen.
Bei Konflikt zwischen dieser Datei und einer Chat-Anweisung gewinnt diese Datei, außer der Mensch sagt ausdrücklich "weiche von AGENTS.md ab, und zwar bei X".

---

## 1. Ziel und Nutzer

Eine **einzige** Progressive Web App (PWA) für das iPad eines **7-jährigen Kindes**. Sie spielt Inhalte aus zwei Self-Hosted-Diensten ab:

| Inhalt | Quelle | Bibliothek |
|---|---|---|
| Hörbücher | Audiobookshelf (ABS) | eigene ABS-Bibliothek "Hörbücher" |
| Podcasts | Audiobookshelf (ABS) | eigene ABS-Bibliothek "Podcasts" |
| Musik | Navidrome (Subsonic/OpenSubsonic-API) | Alben und Playlists |

**Kernprinzip: Das Kind darf nie merken, dass es zwei Dienste gibt.** Es sieht nur drei Kacheln: Hörbücher, Podcasts, Musik. Wörter wie Server, Login, Bibliothek, ABS, Navidrome, Subsonic, API, Token, Fehlercode oder URL erscheinen im Kinderbereich **nirgends**: nicht in der UI, nicht in Alt-Texten, nicht in Fehlermeldungen, nicht im Tab-Titel.

Es gibt zwei strikt getrennte Bereiche:
1. **Kinderbereich**: Standard, ohne Anmeldung, ohne Texteingabe.
2. **Elternbereich**: hinter PIN, enthält alle technischen Einstellungen.

Nicht-Ziele (Version 1): Offline-Downloads, Mehrbenutzer, Suche im Kinderbereich, Push-Benachrichtigungen, native Wrapper, App-Store-Veröffentlichung, Upload/Verwaltung von Medien.

---

## 2. Architektur (verbindlich)

```
iPad (PWA, nur eigene Origin)
        │  HTTPS (Reverse Proxy außerhalb dieses Repos)
        ▼
  BFF (ein Node-Container)  ──►  Audiobookshelf
   - liefert die PWA aus    ──►  Navidrome
   - hält ALLE Zugangsdaten
   - proxyt Cover + Audio (mit Range-Support)
   - vereinheitlicht beide Datenmodelle
```

Regeln:
- Der Browser spricht **ausschließlich** mit dem eigenen BFF. Der Client DARF NICHT direkt ABS oder Navidrome aufrufen und kennt deren URLs, Tokens und Passwörter nicht.
- Zugangsdaten DÜRFEN NICHT in den Client-Bundle, in `localStorage`, in Service-Worker-Caches oder in Logs gelangen.
- Der BFF **MUSS** HTTP-Range-Requests für Audio korrekt durchreichen (206, `Accept-Ranges`, `Content-Range`). Ohne Range funktioniert Seeking und iOS-Wiedergabe nicht zuverlässig.
- Ein Container, ein Port, ein Volume für Konfiguration (`/data`). Bereitstellung per `docker-compose.yml`.
- TLS terminiert der Reverse Proxy. Der BFF vertraut `X-Forwarded-Proto` nur, wenn `TRUSTED_PROXY=true` gesetzt ist.

### Tech-Stack (nicht ändern ohne Rückfrage)
- **Client:** Vite + TypeScript (strict) + Svelte, `vite-plugin-pwa`. Kein UI-Framework, kein CSS-Framework, kein Icon-Font. Eigene CSS-Variablen.
- **BFF:** Node 22 LTS, TypeScript (strict), Hono oder Fastify (einen wählen, in `docs/decisions.md` begründen), `better-sqlite3` für Konfiguration/Zustand.
- **Bilder:** `sharp` für Cover-Skalierung (ausdrücklich erlaubt).
- **Tests:** Vitest (Unit), Playwright (E2E, **WebKit** als Pflicht-Engine).
- **Neue Abhängigkeiten:** nur mit Begründung in `docs/decisions.md` (Zweck, Größe, Alternativen). Im Zweifel nicht hinzufügen.

### Repo-Struktur
```
/client            Svelte-PWA
  /src/kid         Kinderbereich (keine Texteingabe, keine Technikbegriffe)
  /src/parent      Elternbereich (hinter PIN)
  /src/player      Audio-Engine, lebt außerhalb des Routers
  /src/strings.ts  ALLE UI-Texte (Deutsch), keine Strings in Komponenten
/server
  /src/providers   abs.ts, navidrome.ts, types.ts (gemeinsames Interface)
  /src/routes      /api/kid/*, /api/parent/*, /media/*
  /src/auth        PIN, Session, Rate-Limit
/docs              decisions.md, api-notes.md
/e2e               Playwright
```

---

## 3. Einheitliches Datenmodell

Beide Dienste werden hinter einem Interface versteckt. Der Client kennt nur dieses Modell.

```ts
type Kind = 'audiobook' | 'podcast' | 'album' | 'playlist';
type Section = 'books' | 'podcasts' | 'music';

interface Item {
  id: string;            // opak, z. B. "abs:<libId>:<itemId>" oder "nd:album:<id>"
  section: Section;
  kind: Kind;
  title: string;
  coverUrl: string;      // IMMER /media/cover/<id>, nie eine Fremd-URL
  durationSec?: number;
  progress?: { positionSec: number; finished: boolean; updatedAt: number };
}

interface Track {        // spielbare Einheit (Kapitel, Episode, Lied)
  id: string;
  title: string;
  durationSec: number;
  streamUrl: string;     // IMMER /media/stream/<id>
  startOffsetSec?: number; // für ABS-Kapitel in einer Datei
}

interface ContentProvider {
  listItems(section: Section): Promise<Item[]>;
  listTracks(itemId: string): Promise<Track[]>;       // Podcast: Episoden
  getProgress(itemId: string): Promise<Item['progress'] | null>;
  saveProgress(itemId: string, positionSec: number, finished: boolean): Promise<void>;
}
```

- IDs sind für den Client opak. Der Client DARF NICHT versuchen, sie zu parsen.
- Neue Quelle später = neuer Provider, **ohne** Änderung am Kinder-UI.

---

## 4. Provider-Details

**Wichtig:** Endpunkte und Felder NICHT aus dem Gedächtnis raten. Vor der Implementierung die offizielle Doku lesen (ABS: api.audiobookshelf.org; Navidrome/Subsonic: Navidrome-Doku und OpenSubsonic-Spec) und Erkenntnisse in `docs/api-notes.md` festhalten. Unklarheiten gegen die echte Instanz mit einem Testaufruf prüfen, im Zweifel den Menschen fragen.

### 4.1 Audiobookshelf
- Zwei konfigurierbare Bibliotheken: eine für Hörbücher (`section: books`), eine für Podcasts (`section: podcasts`). Die Zuordnung wird im Elternbereich per Dropdown gewählt (die Bibliotheken werden vom BFF live abgefragt), nie per Freitext-ID.
- Authentifizierung mit dediziertem **Kind-Benutzer** (kein Admin) oder API-Key. Der Mensch legt den Benutzer an; die App verlangt in der Doku (`README.md`) minimale Rechte: nur diese zwei Bibliotheken, kein Download, kein Löschen, keine Uploads.
- Hörbücher: Wiedergabe über eine ABS-Playback-Session. Kapitel und Mehrdatei-Bücher werden zu `Track[]` normalisiert. Fortschritt über Session-Sync und/oder `me/progress`; beide Wege gegen die Doku abwägen und den gewählten in `docs/decisions.md` festhalten.
- Podcasts: Item = Podcast (Sendung), Tracks = Episoden. Neueste zuerst, maximal 30 anzeigen. Gehört/Ungehört-Status aus ABS-Fortschritt.
- Cover: Abruf über BFF, serverseitig auf eine sinnvolle Größe skaliert (Parameter der ABS-Cover-Route nutzen, wenn vorhanden), mit `Cache-Control`.

### 4.2 Navidrome
- Subsonic-API mit Salt+Token-Authentifizierung (`u`, `t`, `s`, `v`, `c`, `f=json`). Kein Klartext-Passwort in Query-Strings. Salt pro Request neu.
- Dedizierter **Nicht-Admin-Benutzer**.
- Anzeige: Alben (zufällig/neueste/alphabetisch konfigurierbar) und Playlists. Playlists haben Vorrang, wenn der Elternbereich welche markiert hat ("Für das Kind freigegeben").
- Kein Fortschritt für Musik. Kein Scrobbling. Kein Bewerten ("Sternchen", "Gefällt mir") im Kinderbereich.

---

## 5. Kinderbereich: UX-Regeln (strikt)

### 5.1 Grundsätze
- **Kein Login, kein Textfeld, keine Tastatur** im Kinderbereich. Niemals.
- Maximal **3 Ebenen** tief: Start → Auswahl → Player. Podcasts ausnahmsweise 4 (Sendung → Episoden).
- Jede Aktion ist mit **einem Tipp** erreichbar. **Keine** Gesten als einziger Weg (kein Swipe-to-delete, kein Long-Press, kein Pinch, kein Doppeltipp).
- Mindestgröße aller tippbaren Elemente: **72 × 72 px** (CSS-Pixel). Abstand dazwischen mindestens 16 px.
- Schrift mindestens **22 px**, kurze Wörter, jeder Button hat **Icon + Wort** (das Kind liest noch nicht perfekt; Icons müssen allein verständlich sein).
- Kontrast mindestens WCAG AA. Keine Information nur über Farbe.
- Keine Animationen, die blinken oder schnell flackern. Bewegung respektiert `prefers-reduced-motion`.
- Keine Werbung, keine Tracker, keine Analytics, keine externen Requests (Fonts und Icons lokal ausliefern), keine Links nach außen.
- Keine Dark Patterns: kein Autoplay-Endlosstrom, keine Belohnungsmechaniken, keine Streaks.

### 5.2 Screens
1. **Start:** drei große Kacheln (Hörbücher, Podcasts, Musik). Kachel ausblenden, wenn die Quelle nicht konfiguriert oder leer ist. Darüber optional eine Reihe "Weiterhören" (zuletzt gehörte, nicht beendete Hörbücher und Podcasts, max. 4).
2. **Auswahl (Raster):** Cover-Raster mit **großen Covern** (Abschnitt 5b): 2 Spalten im Hochformat, 3 im Querformat. Titel unter dem Cover, max. 2 Zeilen. Tipp auf Cover:
   - Hörbuch: Player öffnet, Wiedergabe setzt an der gespeicherten Stelle fort.
   - Podcast: Episodenliste (große Zeilen: Cover, Titel, Dauer, Häkchen bei gehört), Tipp spielt ab.
   - Album/Playlist: Player öffnet, Wiedergabe beginnt beim ersten Lied.
3. **Player (Vollbild):**
   - Cover so groß wie möglich (Abschnitt 5b), Titel.
   - Play/Pause mindestens **120 px**, farblich eindeutig.
   - Hörbuch/Podcast: "30 Sekunden zurück"-Button. Musik und Kapitel: Vor/Zurück.
   - Fortschrittsbalken mit großem Griff (mind. 44 px Touch-Höhe), keine Zeitangaben nötig.
   - Schlaf-Timer (Mond-Symbol): Auswahl 15 / 30 / 45 / 60 Min / Aus, große Buttons.
   - Zurück-Button oben links, groß. Kein Wisch-Zurück als einziger Weg.
   - **Kein Lautstärkeregler** (iOS ignoriert `audio.volume`; Lautstärke läuft über die Hardware-Tasten).
4. **Mini-Player:** Wird ein Titel abgespielt und das Kind navigiert weg, bleibt unten eine Leiste (Cover, Play/Pause), Tipp öffnet den Player. Die Wiedergabe bricht beim Navigieren **nie** ab.

### 5.3 Fehler und Leerzustände (Pflichtwortlaut-Stil)
- Jeder Fehler wird freundlich, ohne Technikbegriffe und mit einer Handlungsanweisung für das Kind dargestellt, z. B. Symbol + "Gerade geht es nicht. Sag Mama oder Papa Bescheid."
- Die Fehlerursache (Server nicht erreichbar, Token abgelaufen, 5xx) wird **nur** im Elternbereich unter "Status" angezeigt.
- Kein Spinner länger als 10 s ohne Fehlerbild. Kein leerer weißer Bildschirm, nie.
- Während der Wiedergabe: kurzer Netzwerkabbruch (< 30 s) wird automatisch überbrückt (Retry mit Backoff, Position erhalten), ohne dass das Kind etwas tun muss.

---

## 5b. Cover-Art (höchste Priorität)

Cover sind das Hauptbedienelement der App. Gewünscht sind **große, scharfe Bilder**. Alles andere im Kinderbereich ordnet sich dem unter. Das Item-Modell (Abschnitt 3) wird um `dominantColor?: string` (Hex, vom BFF berechnet) erweitert.

### Größen
- Cover-Kacheln im Raster sind **quadratisch, mindestens 300 CSS-px** Kantenlänge auf dem iPad (2 Spalten hoch, 3 quer). Nicht verkleinern, um mehr Titel auf den Schirm zu bekommen; stattdessen scrollen.
- Player-Cover: `min(86vw, 62vh)`, maximal 720 CSS-px, zentriert.
- Das iPad hat 2× Pixeldichte. Geladen werden deshalb: Raster **640 px**, Player **1280 px**, Mini-Player **320 px** (`srcset` + `sizes`).

### Endpunkt `/media/cover/<id>?w=<breite>&v=<version>[&f=jpg]`
- `w` nur aus der Whitelist **{160, 320, 640, 1024, 1280}**, sonst HTTP 400 (verhindert Cache-Fluten).
- BFF holt das Original vom Dienst (ABS-Cover-Route bzw. Subsonic `getCoverArt` in größtmöglicher Auflösung) und skaliert mit `sharp`. **Nie hochskalieren** (`withoutEnlargement`): ist das Original kleiner, wird das Original ausgeliefert.
- Format: WebP (Qualität ca. 82), wenn `Accept` es enthält, sonst JPEG (Qualität ca. 85, progressive). `f=jpg` erzwingt JPEG (für Media Session).
- Disk-Cache unter `/data/cache/covers/<id>-<w>-<v>.<ext>` mit Obergrenze (`COVER_CACHE_MAX_MB`, Standard 2048) und LRU-Aufräumen.
- Header: `Cache-Control: public, max-age=31536000, immutable` und `ETag`. `v` ist ein Hash bzw. Änderungsstempel des Originals, damit neue Cover sich durchsetzen.
- **Seitenverhältnis nie verzerren.** Nicht quadratische Cover (z. B. Buchcover aus ABS) werden in der quadratischen Kachel mit `object-fit: contain` über einem unscharfen, abgedunkelten Hintergrund aus demselben Bild gezeigt. Texte im Cover dürfen nicht abgeschnitten werden.
- **Kein Cover vorhanden oder Dienst liefert 404:** serverseitig erzeugter Platzhalter (SVG: Farbe aus Hash der ID, großes Symbol der Sektion, Anfangsbuchstabe des Titels). Nie ein kaputtes Bildsymbol, nie ein graues Rechteck.

### Laden und Darstellung
- Feste Boxgröße via `aspect-ratio`, kein Layout-Sprung.
- Platzhalterfarbe = `dominantColor`, Einblenden per Opacity (≤ 150 ms, respektiert `prefers-reduced-motion`).
- `decoding="async"`. `loading="lazy"` unterhalb des ersten Bildschirms, die sichtbaren Cover mit `fetchpriority="high"`.
- Beim Öffnen des Players: sofort die bereits geladene 640er-Version zeigen, die 1280er nachladen und überblenden.
- **Vorwärmen:** Nach erfolgreichem Verbindungstest und beim Start erzeugt der BFF im Hintergrund (1 parallel, niedrige Priorität) alle 640er-Cover, damit der erste Aufruf nicht wartet.
- **Media Session:** Artwork in 256, 512 und 1024 px (JPEG), damit der Sperrbildschirm ein großes, scharfes Bild zeigt.

### Client-Cache (Service Worker)
- `/media/cover/*`: CacheFirst. Größen 320/640: max. 400 Einträge. Größe 1280: max. 30 Einträge (iOS-Speicherlimits).

### Pflichttests
- Whitelist greift (400 bei anderer Breite).
- Kein Upscaling, korrektes Format je nach `Accept`, Cache-Header gesetzt.
- Platzhalter bei 404 vom Dienst.
- Nicht quadratisches Cover wird nicht verzerrt (Bilddimensionen und Screenshot).
- Playwright (WebKit, 820 × 1180): `boundingBox` jeder Raster-Kachel ≥ 300 px.
- Keine Cover-Requests an fremde Hosts.
- Performance: erstes Raster mit 12 Covern bei warmem Cache in < 1 s im LAN.

---

## 6. Elternbereich

- Zugang: **versteckter Einstieg** (z. B. 3 Sekunden gedrückt halten auf einem Zahnrad-freien Bereich, wie dem Logo auf der Startseite) **plus PIN** (4–8 Ziffern). Der Einstieg DARF NICHT sichtbar beschriftet sein.
- PIN wird mit scrypt oder argon2 gehasht gespeichert, serverseitig geprüft. Rate-Limit: 5 Fehlversuche, dann 5 Minuten Sperre (serverseitig, nicht umgehbar durch Reload). Session-Cookie `HttpOnly; Secure; SameSite=Strict`, läuft nach 10 Minuten Inaktivität ab.
- Erstkonfiguration: Ist noch keine PIN gesetzt, zeigt die App **nur** den Einrichtungsassistenten für Eltern (Kind-Bereich bleibt gesperrt), nicht umgekehrt.
- Inhalte des Elternbereichs:
  1. **Verbindungen:** ABS-URL + Zugang, Navidrome-URL + Zugang, jeweils mit Button "Verbindung testen".
  2. **Zuordnung:** ABS-Bibliothek für Hörbücher, ABS-Bibliothek für Podcasts (Dropdown).
  3. **Auswahl:** einzelne Titel/Alben/Playlists verbergen oder freigeben (Server-seitig gespeichert, wirkt sofort).
  4. **Schlaf-Timer-Standard** und optional **Tageslimit** (Minuten, Standard: aus). Bei Erreichen zeigt das Kind eine ruhige Endseite ("Für heute ist genug gehört. Bis morgen!"), Player gesperrt bis Mitternacht.
  5. **Status:** Verbindungs- und Fehlerprotokoll (ohne Secrets).
  6. **PIN ändern**, **App-Daten zurücksetzen**.
- Secrets werden im Elternbereich nach dem Speichern nie wieder angezeigt (nur "gesetzt" / "nicht gesetzt").

---

## 7. Audio und iOS-Besonderheiten (Pflicht)

- Es gibt **genau ein** `HTMLAudioElement` für die gesamte App. Es wird beim ersten Nutzertipp erzeugt/gestartet und **nie** zerstört, auch nicht bei Navigation. Der Player lebt außerhalb des Routers.
- Wiedergabe startet **nur** nach Nutzerinteraktion (iOS-Autoplay-Regel). Kein Versuch, Audio ohne Tipp zu starten.
- **Media Session API** vollständig umsetzen: Metadaten (Titel, Cover in mehreren Größen), `play`, `pause`, `seekbackward` (30 s), `seekforward`, `previoustrack`, `nexttrack`, `seekto`, Positionsstatus. Sperrbildschirm und Control Center müssen sinnvoll funktionieren.
- Position speichern: alle 10 s, bei `pause`, `ended`, `visibilitychange` (hidden) und `pagehide`. Beim BFF über `navigator.sendBeacon` oder `fetch` mit `keepalive`.
- Nach Unterbrechungen (Anruf, Siri, Wechsel des Audioausgangs, App im Hintergrund) **MUSS** die App Zustand prüfen (`visibilitychange`, `pause`/`play`-Events) und den UI-Zustand korrekt nachziehen. Nie "Play" zeigen, wenn Audio läuft und umgekehrt.
- Kein Web-Audio-Graph, keine `audio.volume`-Fades (iOS ignoriert sie). Timer-Ende = hartes Pausieren.
- Nur Formate streamen, die iOS-Safari spielt (MP3, AAC/M4A/M4B, ggf. FLAC). Andere Formate transkodiert der Server-Dienst; der BFF DARF NICHT selbst transkodieren (Aufwand und Risiko). Nicht abspielbare Titel werden im Kinderbereich ausgeblendet und im Elternbereich-Status gemeldet.

### PWA / Viewport
- `manifest.webmanifest`: `display: standalone`, `orientation: any`, Icons 192/512 + maskable, Apple-Touch-Icon 180, `theme_color` und `background_color` gesetzt.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, Zoom nicht per Meta sperren, stattdessen `touch-action: manipulation`, kein Doppeltipp-Zoom.
- Safe-Area-Insets (`env(safe-area-inset-*)`) beachten.
- `-webkit-user-select: none`, `-webkit-touch-callout: none` im Kinderbereich, `overscroll-behavior: none`, keine Pull-to-Refresh-Auslöser.
- Service Worker: Precache nur für die App-Shell. Cover **SOLLEN** gecacht werden (Cache-First, begrenzt auf z. B. 300 Einträge). Audio wird **nicht** gecacht (iOS-Speicherlimits).
- Update-Strategie: neue Version stillschweigend laden, beim nächsten Start aktivieren. **Keine** Update-Dialoge im Kinderbereich.
- HTTPS ist Voraussetzung; der Server liefert korrekte Header (`Cache-Control`, `Content-Type`, CSP).

---

## 8. Sicherheit

- Strikte **CSP**: `default-src 'self'`, kein `unsafe-inline` (Nonces/Hashes), `img-src 'self' data:`, `media-src 'self'`, `connect-src 'self'`. Keine Drittanbieter-Skripte.
- `/api/parent/*` ausschließlich mit gültiger Eltern-Session. `/api/kid/*` ohne Auth, **aber** nur Lesezugriff auf freigegebene Inhalte plus Fortschritt schreiben.
- Der BFF ist **kein offener Proxy**: `/media/*` nimmt nur eigene opake IDs an, **nie** frei übergebene URLs (SSRF-Schutz).
- Secrets nur in `/data/config.sqlite`, verschlüsselt mit einem Schlüssel aus `APP_SECRET` (Umgebungsvariable). Kein Secret in Git, Logs oder Fehlermeldungen.
- Eingaben im Elternbereich validieren (URL-Format, nur http/https).
- Im Kinderbereich existiert **keine** Funktion zum Löschen, Ändern oder Hochladen von Inhalten.

---

## 9. Qualität, Tests, "Fertig"-Definition

Ein Meilenstein gilt erst als fertig, wenn **alles** zutrifft:
1. `pnpm lint`, `pnpm typecheck`, `pnpm test` laufen grün.
2. E2E-Tests (Playwright, **WebKit**, Viewport iPad 820 × 1180 hoch und 1180 × 820 quer) laufen grün.
3. Provider-Tests nutzen **aufgezeichnete Fixtures** (anonymisiert), keine Live-Dienste in CI.
4. Die Checkliste aus Abschnitt 5 und 7 ist für die betroffenen Screens abgehakt (im PR/Bericht aufgeführt).
5. Ein Textscan bestätigt: **Keines** der verbotenen Wörter (Server, ABS, Audiobookshelf, Navidrome, Subsonic, API, Token, Login, Fehlercode, URL) steht in `client/src/kid/**` oder in `strings.ts` unter dem Namensraum `kid.*` (automatisierter Test).
6. Dokumentation aktualisiert (`README.md`, `docs/decisions.md`, `docs/api-notes.md`).

Pflichttests (mindestens):
- Range-Request-Durchleitung (206-Antworten, korrekte Header).
- Fortschritt wird gespeichert und nach Neustart wiederhergestellt.
- Kind-Endpunkte liefern keine Secrets (Snapshot-Test auf Antworten).
- PIN-Rate-Limit greift serverseitig.
- Verborgene Items erscheinen nie im Kinderbereich.
- Ausfall eines Dienstes: der andere Bereich funktioniert weiter, Kind sieht nur freundliche Fehlerkachel.

---

## 10. Meilensteine (in dieser Reihenfolge, nach jedem stoppen und berichten)

| # | Inhalt |
|---|---|
| M0 | Scaffold, Tooling, CI, Docker-Compose, leere PWA lädt im iPad-Viewport |
| M1 | BFF + ABS-Provider (Hörbücher + Podcasts), `/media/*` mit Range-Support, **Cover-Pipeline (Abschnitt 5b)**, Fixtures-Tests |
| M2 | Navidrome-Provider (Alben, Playlists, Stream, Cover) |
| M3 | Kinder-UI: Start, Raster, Episodenliste (noch ohne finalen Player) |
| M4 | Player: Audio-Engine, Media Session, Fortschritt, Mini-Player, Schlaf-Timer |
| M5 | Elternbereich: PIN, Verbindungen, Zuordnung, Verbergen, Status, optionales Tageslimit |
| M6 | PWA-Feinschliff (Manifest, Icons, Service Worker, Safe Areas), Härtung, E2E komplett |
| M7 | Doku, Betriebsanleitung (inkl. Hinweis auf "Geführter Zugriff" am iPad), Release |

**Nach jedem Meilenstein:** kurzer Bericht (was gebaut, was getestet, offene Punkte, Abweichungen von dieser Datei) und **auf Freigabe warten**. Nicht selbstständig zum nächsten Meilenstein übergehen.

---

## 11. Arbeitsweise der Agents

- **Zuerst planen.** Vor Code ein kurzer Plan mit Dateien, Risiken, Annahmen. Bei Unklarheiten **fragen**, nicht raten.
- Kleine, überprüfbare Schritte. Ein Commit pro logischer Änderung (Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- API-Verhalten nie erfinden. Wenn ein Endpunkt unklar ist: Doku lesen, Testaufruf gegen die Instanz mit dem Menschen abstimmen, Ergebnis in `docs/api-notes.md` notieren.
- Keine Secrets, echten Hostnamen oder privaten Cover/Titel in Commits, Fixtures oder Logs. Fixtures anonymisieren.
- Kein "Scope Creep": Nichts bauen, was nicht in dieser Datei steht (kein Suchfeld, keine Favoriten, keine Statistik, keine Konten). Ideen in `docs/ideas.md` sammeln statt umsetzen.
- Keine großen Refactorings oder Technologiewechsel ohne ausdrückliche Zustimmung.
- Wo diese Datei etwas offen lässt, entscheidet das Kind-Wohl: **weniger Funktionen, größere Elemente, einfachere Sprache**.
- Bei Widerspruch zwischen "schick" und "kindgerecht" gewinnt kindgerecht.

---

## 12. Deployment (verbindlich)

- **Domain:** `kids.boriseder.com` (Split-DNS), davor läuft Caddy. Die Domain ist von außen nicht erreichbar, ein Zertifikat funktioniert daher nur über die **DNS-01-Challenge** (liegt in der Verantwortung des Menschen, nicht dieses Repos).
- **Dockerfile:** Multi-Stage (Build → schlankes Runtime-Image), `sharp` muss im Zielimage funktionieren (testen), **non-root User**, `HEALTHCHECK` auf `/healthz`.
- **docker-compose.yml:**
  - Service und Container-Name `nilsomat`, interner Port `8080`.
  - **Kein `ports:`-Mapping.** Der Container hängt nur im Docker-Netzwerk von Caddy (externes Netzwerk, Name als Platzhalter `proxy`, im README dokumentiert).
  - Volume `./data:/data`, `restart: unless-stopped`, `read_only: true` mit Schreibzugriff nur auf `/data` und `/tmp`.
  - Umgebungsvariablen: `APP_SECRET` (Pflicht, Start bricht ohne ab), `TRUSTED_PROXY=true`, `TZ=Europe/Berlin` (wichtig für das Tageslimit um Mitternacht), `PORT=8080`, `COVER_CACHE_MAX_MB=2048`.
- **Caddy:** Das Repo enthält `deploy/Caddyfile.snippet` mit dem Eintrag:
  ```
  kids.boriseder.com {
  	encode zstd gzip
  	reverse_proxy nilsomat:8080
  }
  ```
  Kein `encode` auf Audio erzwingen. Das Caddy-Default verhält sich hier korrekt (komprimiert nur textbasierte Typen). Range-Requests laufen unverändert durch.
- **Endpunkt `/healthz`:** liefert 200 ohne Details (keine Versions- oder Dienstinfos nach außen).
- **Backup:** nur `/data/config.sqlite` ist sicherungswürdig. Der Cover-Cache ist regenerierbar.
- **Logging:** JSON auf stdout, ohne Secrets.
- **Releases:** versionierte Images (`nilsomat:<semver>`), kein Auto-Update.

---

## 13. Betriebs-Hinweise für den Menschen (nicht für den Agent)

- **Cover-Qualität der Quellen:** Damit die großen Cover scharf wirken, sollten die Originale in Navidrome und ABS mindestens **1000 × 1000 px** haben. Zu kleine Originale werden nicht hochskaliert und sehen auf dem iPad weich aus.

- Am iPad: Safari → Teilen → "Zum Home-Bildschirm". Danach in Einstellungen → Bedienungshilfen → **Geführter Zugriff** aktivieren, damit das Kind die App nicht verlässt (das kann keine Web-App selbst).
- Eigene Benutzer mit minimalen Rechten in ABS und Navidrome anlegen (siehe Abschnitt 4).
- HTTPS über Reverse Proxy (Caddy/Traefik/NPM) oder Tailscale/Cloudflare Tunnel bereitstellen.
