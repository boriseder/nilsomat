# Nils-o-mat ("Kinder-Audio-App")

Eine eigenständige, werbefreie Progressive Web App (PWA) für das iPad eines Kindes (ca. 6 bis 10 Jahre) zum Abspielen von Hörbüchern, Podcasts und Musik aus eigenen Server-Diensten.

---

## 📖 Für Eltern: Überblick & Bedienungsanleitung

### 1. Was ist Nils-o-mat?
Nils-o-mat ist eine moderne, digitale **„Hörbox“ auf dem iPad**. Es vereint das haptische, einfache Erlebnis klassischer Kinder-Musikboxen mit moderner Web-Technologie: riesige Cover-Bilder, extra große Touch-Tasten, kinderleichte Bedienung und absolute Sicherheit vor ungeeigneten Inhalten oder Ablenkungen.

### 2. Die Quellen hinter den Kulissen
Die App greift auf zwei selbst betriebene Heim-Dienste zu:
* **Hörbücher & Kinder-Hörspiele:** Aus deiner Audiobookshelf-Bibliothek.
* **Kinder-Podcasts:** Aus deiner Audiobookshelf-Podcast-Bibliothek.
* **Musik & Playlists:** Aus deinem Navidrome-Musikserver.

**Das Kernprinzip:** Dein Kind merkt zu keinem Zeitpunkt, dass es zwei verschiedene Server gibt. Es sieht beim Öffnen der App lediglich **drei große, bunte Kacheln**: *Hörbücher*, *Podcasts* und *Musik*. Wörter wie Server, Token, Login, API, URL oder Fehlermeldungen tauchen im Kinderbereich **nirgends** auf.

### 3. Pädagogischer Schutzraum: Warum kein Spotify oder kommerzielles Streaming?
* **Keine Aufmerksamkeits-Ökonomie:** Kommerzielle Streaming-Apps sind darauf optimiert, die Aufmerksamkeit von Kindern durch endlose Empfehlungs-Algorithmen, bunten Autoplay-Sog und Song-Skipping zu fesseln. Nils-o-mat setzt auf **„Calm Technology“**: Wenn ein Album oder Hörbuch zu Ende ist, stoppt die Wiedergabe ruhig.
* **100% Eltern-Kontrolle:** Es gibt keine offene Suchfunktion im Kinderbereich. Dein Kind kann ausschließlich das hören, was du im Elternbereich explizit freigegeben hast.
* **Absolut werbe- und datenfrei:** Keine Werbung, keine In-App-Käufe, kein Tracking des kindlichen Hörverhaltens und keine Weitergabe von Daten.
* **Geführter Zugriff:** In Verbindung mit Apples „Geführtem Zugriff“ verwandelt sich das iPad in eine reine, ablenkungsfreie Hörbox – das Kind kann die App weder versehentlich verlassen noch ins Internet wechseln.

### 4. Das Kinder-Erlebnis im Alltag
* **Bilder vor Text:** Kinder im Grundschulalter sind Erstleser. Text entziffern bindet Energie. Deshalb sind die Cover riesig (mindestens $300\text{ px}$ in der Auswahl, bis zu $720\text{ px}$ im Player).
* **Frustfreie Haptik:** Alle Buttons sind mindestens $72\times 72\text{ px}$ groß, der zentrale Play-Button misst stolze $120\text{ px}$. Ein Vertippen mit kleinen Kinderhänden ist nahezu ausgeschlossen.
* **Kaugummi-Fortschritt:** Kinder können abstrakte Zahlen wie `14:28` noch nicht deuten. Der dicke, visuelle Fortschrittsbalken veranschaulicht spielerisch „Anfang, Mitte und Ende“.
* **30-Sekunden-Zurück-Taste:** War das Kind kurz abgelenkt, kann es mit einem Fingertipp 30 Sekunden zurückspringen, ohne den Faden der Geschichte zu verlieren.
* **Grünes Häkchen bei Fertig:** Bei Hörspielserien (z. B. *Pumuckl* oder *Die drei ??? Kids*) und Podcasts signalisiert ein klares grünes Häkchen, welche Folgen bereits fertig gehört wurden.
* **Sanfte Nachtansicht:** Läuft der Schlaf-Timer ab, stoppt der Ton sanft und ein ruhiger schlafender Mond mit Sternen signalisiert: *„Gute Nacht! Zeit zum Schlafen.“*

---

### 5. Schritt-für-Schritt Bedienungsanleitung für Eltern

#### A. In den Elternbereich gelangen
Der Zugang für Eltern ist vor neugierigen Kinderfingern versteckt:
1. Halte auf der Startseite das **Logo oben für 3 Sekunden gedrückt**.
2. Es öffnet sich ein Nummernfeld: Gib deine persönliche **Eltern-PIN** ein.
3. Nach 10 Minuten Inaktivität schließt sich der Elternbereich automatisch wieder.

#### B. Schutz vor Reizüberflutung (Kategorie-Limits & Kuratieren)
Wenn Kinder vor 200 Alben sitzen, tritt der sogenannte *Choice Overload* ein (sie wissen nicht, was sie wählen sollen, und scrollen frustriert hin und her):
* Im Tab **„Regeln & Limits“** kannst du unter **„Schutz vor Reizüberflutung“** festlegen, wie viele Titel pro Bereich maximal angezeigt werden (z. B. **10, 15 oder 20 Titel**).
* Im Tab **„Inhalte verwalten“** kannst du einzelne Titel mit einem Klick verbergen oder freischalten.
* *Tipp für den Alltag:* Wie im echten Bücherregal empfiehlt es sich, dem Kind eine feine Auswahl von 10–20 Titeln bereitzustellen und ältere Alben regelmäßig gegen neue auszutauschen.

#### C. Podcast-Folgen pro Sendung einstellen
Viele Podcasts haben hunderte Folgen. Unter **„Regeln & Limits“** kannst du einstellen, wie viele Folgen initial geladen werden (z. B. 20 oder 30). Am Ende der Episodenliste kann das Kind mit einem großen Button (*„➕ Mehr Folgen zeigen“*) bei Bedarf weitere Folgen nachladen.

#### D. Hörgesundheit schützen (Gehörschutz)
In Nils-o-mat gibt es **bewusst keinen Lautstärkeregler auf dem Display**, da Kinder auf Touchscreens dazu neigen, Regler spielerisch auf 100% zu wischen.
* Die Lautstärke wird ausschließlich über die **physischen Tasten an der Kante des iPads** geregelt.
* **Empfohlene iPad-Einstellung:** Öffne auf dem iPad *Einstellungen → Töne → Kopfhörersicherheit*, aktiviere *„Laute Töne reduzieren“* und stelle den Schieber auf **75 dB** ein. Damit ist das Gehör deines Kindes dauerhaft geschützt.

#### E. Schlaf-Timer & Einschlafbegleitung
* Im Player kann das Kind oben rechts mit dem **Mond-Symbol** selbstständig einen Timer wählen (15, 30, 45, 60 Min.).
* Im Elternbereich kannst du unter **„Regeln & Limits“** einen Standard-Wert festlegen, der beim Öffnen des Players automatisch vorgeschlagen wird.
* Nach Ablauf schläft die Musik ein und das Vollbild-Nachtoverlay mit Mond und Sternen erscheint ruhig auf dem Display.

#### F. Tageslimit einstellen (Grenzen setzen ohne Tränen)
* Unter **„Regeln & Limits“** kannst du ein tägliches Hörlimit in Minuten festlegen (z. B. 60 Min.).
* Wird das Limit erreicht, zeigt die Box eine ruhige Nachricht (*„Für heute ist genug gehört. Bis morgen!“*) und sperrt die Wiedergabe bis zum nächsten Morgen um 0:00 Uhr.
* Der psychologische Vorteil: Die Box setzt die neutrale Grenze („Die Hörbox schläft auch“), was den typischen elterlichen Konflikt deeskaliert.

#### G. iPad absichern mit „Geführtem Zugriff“
Damit das iPad eine geschlossene Hörbox bleibt und dein Kind die App nicht verlassen kann:
1. Auf dem iPad unter *Einstellungen → Bedienungshilfen → Geführter Zugriff* einschalten.
2. Code für den geführten Zugriff festlegen.
3. Die Nils-o-mat-App öffnen.
4. **Dreimal schnell die Power- bzw. Home-Taste drücken**, um den geführten Zugriff zu starten.
5. Zum Beenden: Erneut dreimal drücken und deinen Code eingeben.

---

## 6. Technische Architektur & Systemaufbau

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
