# Architektur- und Technologieentscheidungen

Dieses Dokument erfasst alle maßgeblichen technischen Entscheidungen, Begründungen, evaluierte Alternativen und neu hinzugefügte Abhängigkeiten gemäß Abschnitt 2 von `AGENTS.md`.

---

## 1. BFF-Framework: Hono

- **Entscheidung:** Hono (`hono` + `@hono/node-server`) als Server-Framework auf Node 22 LTS.
- **Datum:** Meilenstein 0 (Initial)
- **Zweck:** Bereitstellung des Backends-for-Frontend (BFF), API-Routen (`/api/kid/*`, `/api/parent/*`), Medien-Streaming (`/media/*`) mit HTTP-Range-Unterstützung sowie Auslieferung der PWA-Dateien.
- **Alternativen:** Fastify, Express.
- **Begründung:**
  - Hono basiert nativ auf den modernen Web-Standard-APIs (`Request`, `Response`, `ReadableStream`).
  - Sehr geringer Speicher- und Dependency-Footprint im Vergleich zu Fastify.
  - Exzellente und typsichere TypeScript-Unterstützung "out of the box".
  - Natives Streaming und HTTP-Range-Handling für Audio-Dateien und Cover-Pipelines ohne sperrige Plugin-Architektur.

---

## 2. Client-Technologien: Svelte 5 + Vite + TypeScript

- **Entscheidung:** Svelte 5 mit TypeScript (strict), gebündelt mit Vite.
- **Datum:** Meilenstein 0
- **Zweck:** Schlanke, hochperformante Progressive Web App ohne Virtual DOM.
- **Alternativen:** Svelte 4.
- **Begründung:** Svelte 5 bietet mit Runes ein klares, explizites Reaktivitätsmodell und extrem geringe Bundle-Größen. Gemäß `AGENTS.md` wird kein UI-Framework (wie Tailwind oder Bootstrap) und kein CSS-/Icon-Font verwendet; alle Styles basieren auf CSS-Variablen.

---

## 3. Datenbank & Zustand: better-sqlite3

- **Entscheidung:** `better-sqlite3` zur lokalen Speicherung in `/data/config.sqlite`.
- **Datum:** Meilenstein 0
- **Zweck:** Speicherung von verschlüsselten Verbindungsdaten (ABS, Navidrome), Eltern-PIN (Hash), Bibliothekszuordnung, Whitelist/Blacklist von Titeln.
- **Alternativen:** sqlite3 (asynchron, C++ Bindings veraltet), reines JSON-File (keine Transaktionssicherheit).
- **Begründung:** In `AGENTS.md` ausdrücklich vorgegeben; synchron, schnell, transaktionssicher und wartungsarm.

---

## 4. Bildverarbeitung: sharp

- **Entscheidung:** `sharp` für die serverseitige Skalierung von Cover-Grafiken.
- **Datum:** Meilenstein 0
- **Zweck:** Erzeugung von WebP/JPEG-Covern in den Whitelist-Größen (160, 320, 640, 1024, 1280 px) und Ermittlung von `dominantColor`.
- **Alternativen:** jimp (langsam, kein nativer WebP-Support).
- **Begründung:** In `AGENTS.md` ausdrücklich vorgegeben und erlaubt; extrem performant mit libvips.

---

## 5. Test-Stack: Vitest & Playwright (WebKit)

- **Entscheidung:** Vitest für Unit-/Integrations-Tests, Playwright mit WebKit-Engine für E2E-Tests.
- **Datum:** Meilenstein 0
- **Zweck:** Schnelle Unit-Tests (u.a. für Scan auf verbotene Wörter und Provider-Fixtures), realitätsnahe E2E-Prüfung auf iOS/iPadOS-WebKit im Viewport 820 × 1180 (hoch) und 1180 × 820 (quer).
- **Begründung:** Verbindliche Vorgabe aus `AGENTS.md`.

---

## 6. Audiobookshelf: Fortschrittsspeicherung via `me/progress`

- **Entscheidung:** Direkte Fortschrittsspeicherung über `PATCH /api/me/progress/:libraryItemId` anstelle von stateful Playback-Sessions (`/api/session/local`).
- **Datum:** Meilenstein 1
- **Zweck:** Speichern und Abrufen des Hörfortschritts für Hörbücher und Podcasts.
- **Alternativen:** Permanente ABS-Playback-Sessions (`/api/session/local` + regelmäßiges Session-Sync).
- **Begründung:**
  - `PATCH /api/me/progress/:id` ist zustandslos, idempotent und robust gegen Netzwerkunterbrechungen (z. B. WLAN-Verlust auf dem iPad oder Suspendieren der PWA).
  - Playback-Sessions auf dem ABS-Server verfallen nach Inaktivität und führen bei verspätetem Sync zu 404-Fehlern.
  - Das Speichern alle 10 s sowie bei `pause`, `pagehide` und `visibilitychange` (via `fetch` mit `keepalive`) funktioniert mit dem zustandslosen Endpunkt ohne Session-Lifecycle-Overhead zuverlässig.

