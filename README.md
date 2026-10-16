# Hörbox ("Kinder-Audio-App")

Eine eigenständige Progressive Web App (PWA) für das iPad eines 7-jährigen Kindes zum Abspielen von Hörbüchern, Podcasts (via Audiobookshelf) und Musik (via Navidrome).

---

## 1. Architektur

- **Frontend:** Svelte 5 + TypeScript + Vite (`vite-plugin-pwa`). Reines CSS mit Variablen, keine externen Schriftarten oder UI-Bibliotheken.
- **BFF (Backend for Frontend):** Node 22 LTS + Hono + `sharp` + `better-sqlite3`.
- **Zwei getrennte Bereiche:**
  - **Kinderbereich:** Keine Anmeldung, keine Tastatur, riesige Touch-Elemente (mind. 72×72px), keine technischen Begriffe.
  - **Elternbereich:** Versteckter Zugang (3 Sekunden gedrückt halten auf das App-Logo), geschützt durch PIN, zur Konfiguration von Verbindungen und Limits.

---

## 2. Vorbereitung der Quell-Dienste

### Audiobookshelf (ABS)
- Dedizierten **Kind-Benutzer** (kein Admin) mit minimalen Berechtigungen anlegen.
- Berechtigungen: Nur Lesezugriff auf zwei Bibliotheken:
  1. Eine Bibliothek für Hörbücher
  2. Eine Bibliothek für Podcasts
- Keine Uploads, keine Löschrechte, keine Downloads.

### Navidrome
- Dedizierten **Nicht-Admin-Benutzer** anlegen.
- Nur Zugriff auf Musikinhalte.

---

## 3. Betrieb mit Docker & Caddy

### Caddy Reverse Proxy
In Caddy den bereitgestellten Snippet (`deploy/Caddyfile.snippet`) einbinden:
```caddy
kids.boriseder.com {
    encode zstd gzip
    reverse_proxy hoerbox:8080
}
```

### Docker-Netzwerk
Das Caddy-Netzwerk `proxy` muss existieren:
```bash
docker network create proxy
```

### Starten
```bash
export APP_SECRET="dein-geheimes-zufalls-token"
docker compose up -d
```

---

## 4. Einrichtung auf dem iPad

1. Safari auf dem iPad öffnen und `https://kids.boriseder.com` aufrufen.
2. Teilen-Button (Viereck mit Pfeil nach oben) antippen -> **"Zum Home-Bildschirm"**.
3. PWA vom Home-Bildschirm starten.
4. **Geführter Zugriff:** Unter *Einstellungen -> Bedienungshilfen -> Geführter Zugriff* aktivieren. Beim Start der Hörbox dreimal die Home- bzw. Power-Taste drücken, um das Kind in der App zu halten.
