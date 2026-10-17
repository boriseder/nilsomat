# Nils-o-mat ("Kinder-Audio-App")

Eine eigenständige Progressive Web App (PWA) für das iPad eines 7-jährigen Kindes zum Abspielen von Hörbüchern, Podcasts (via Audiobookshelf) und Musik (via Navidrome).

---

## 1. Architektur & Kernprinzipien

- **Frontend:** Svelte 5 + TypeScript + Vite (`vite-plugin-pwa`). Reines CSS mit Variablen, keine externen Schriftarten oder UI-Bibliotheken.
- **BFF (Backend for Frontend):** Node 22 LTS + Hono + `sharp` + `better-sqlite3`.
- **Zwei strikt getrennte Bereiche:**
  - **Kinderbereich:** Keine Anmeldung, keine Tastatur, keine URLs oder technische Fehlermeldungen. Riesige Touch-Elemente (mind. 72×72px), Play-Button mind. 120px, Schrift mind. 22px, Buttons immer mit Icon + Wort.
  - **Elternbereich:** Versteckter Zugang (3 Sekunden gedrückt halten auf das App-Logo), geschützt durch PIN (4-8 Ziffern, mit serverseitigem Rate-Limit: 5 Fehlversuche -> 5 Minuten Sperre). Hier werden Verbindungen getestet, Bibliotheken zugeordnet, Titel verborgen und Zeitlimits festgelegt.
- **Einheitliches Datenmodell:** Das Kind sieht nur 3 Kacheln: *Hörbücher*, *Podcasts*, *Musik*.

---

## 2. Vorbereitung der Quell-Dienste

### Cover-Qualität
Damit die großen Cover auf dem iPad Retina-Display gestochen scharf wirken, sollten die Originale in Navidrome und Audiobookshelf mindestens **1000 × 1000 px** groß sein. Kleinere Originale werden serverseitig nicht künstlich hochskaliert (`withoutEnlargement`), um Unschärfe zu vermeiden.

### Audiobookshelf (ABS)
1. Dedizierten **Kind-Benutzer** (kein Admin) mit minimalen Berechtigungen anlegen:
   - Nur Lesezugriff auf zwei Bibliotheken:
     - 1× Bibliothek für Hörbücher
     - 1× Bibliothek für Podcasts
   - Keine Uploads, keine Löschrechte, keine Downloads.
2. API-Token für diesen Benutzer generieren.

### Navidrome
1. Dedizierten **Nicht-Admin-Benutzer** anlegen (z. B. `kind`).
2. Nur Zugriff auf freigegebene Musikinhalte.

---

## 3. Deployment & Betrieb

### Voraussetzungen
- Docker & Docker Compose
- Caddy Reverse Proxy mit DNS-01-Challenge für `kids.boriseder.com`

### Caddy Reverse Proxy
In Caddy den bereitgestellten Snippet (`deploy/Caddyfile.snippet`) einbinden:
```caddy
kids.boriseder.com {
    encode zstd gzip
    reverse_proxy nilsomat:8080
}
```
*Hinweis:* Caddy komprimiert standardmäßig nur Text- und HTML-Dateien; Audio-Streams und Bilddaten laufen unkomprimiert mit intakter Range-Unterstützung durch.

### Docker-Netzwerk
Das Caddy-Netzwerk `proxy` muss existieren:
```bash
docker network create proxy
```

### Umgebungsvariablen (`.env` oder Compose-Environment)
| Variable | Pflicht | Standard | Beschreibung |
|---|---|---|---|
| `APP_SECRET` | **Ja** | - | Mind. 32-stelliger Zufallsschlüssel zur Verschlüsselung von DB-Secrets |
| `TRUSTED_PROXY` | Nein | `true` | Vertraut `X-Forwarded-*` Headern von Caddy |
| `TZ` | Nein | `Europe/Berlin` | Zeitzone für das Zurücksetzen des Tageslimits um Mitternacht |
| `PORT` | Nein | `8080` | Interner Port des BFF |
| `COVER_CACHE_MAX_MB` | Nein | `2048` | Maximale Größe des Cover-Disk-Caches (MB) |

### Starten
```bash
export APP_SECRET="ein-geheimer-zufallsschluessel-mind-32-zeichen-lang"
docker compose up -d
```

### Datensicherung & Backup
- **Sicherungswürdig:** Nur `/data/config.sqlite` enthält die Einstellungen, den PIN-Hash, die Zuordnungen und die verborge-Items-Liste.
- **Cache:** Der Cover-Cache unter `/data/cache/covers/` ist ephemer und wird bei Bedarf automatisch serverseitig neu aufgebaut.

---

## 4. Einrichtung auf dem iPad

1. **PWA installieren:**
   - Safari auf dem iPad öffnen und `https://kids.boriseder.com` aufrufen.
   - Teilen-Button (Viereck mit Pfeil nach oben) antippen.
   - **"Zum Home-Bildschirm"** auswählen.
2. **Ersteinrichtung:**
   - App vom Home-Bildschirm öffnen. Da noch keine PIN vergeben ist, öffnet sich automatisch der Eltern-Einrichtungsassistent.
   - Eine 4- bis 8-stellige Eltern-PIN vergeben.
   - ABS-URL und Kind-Token eintragen -> *"Verbindung testen"*.
   - Navidrome-URL, Benutzer und Passwort eintragen -> *"Verbindung testen"*.
   - Im Tab *"Zuordnung"* die Bibliotheken für Hörbücher und Podcasts wählen -> *"Speichern"*.
   - Optional im Tab *"Regeln"* ein Tageslimit (z. B. 45 Min.) oder einen Schlaf-Timer-Standard festlegen.
3. **Geführten Zugriff aktivieren (Kindersicherung):**
   - Auf dem iPad unter *Einstellungen -> Bedienungshilfen -> Geführter Zugriff* einschalten.
   - Einen Code für den geführten Zugriff festlegen.
   - Die Nils-o-mat-App öffnen.
   - **Dreimal die Home- bzw. Power-Taste drücken**, um den geführten Zugriff zu starten.
   - Dadurch kann das Kind die App nicht durch Wischgesten oder Tastendruck verlassen.
4. **Elternbereich später öffnen:**
   - Auf der Startseite von Nils-o-mat für **3 Sekunden das Logo oben gedrückt halten**.
   - Die Eltern-PIN auf dem Ziffernblock eingeben.

---

## 5. Entwicklung & Qualitätssicherung

```bash
# Abhängigkeiten installieren
pnpm install

# Unit- & Integrations-Tests (inkl. Scan auf verbotene Wörter)
pnpm test

# Typ-Prüfung
pnpm typecheck

# E2E-Tests mit Playwright WebKit auf iPad-Viewports
pnpm test:e2e

# Produktions-Build erstellen
pnpm build
```
