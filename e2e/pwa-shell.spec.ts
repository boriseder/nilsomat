import { expect, test } from '@playwright/test';

test.describe('Hörbox PWA-Shell auf iPad WebKit', () => {
  test('PWA lädt im iPad-Viewport und zeigt drei Startkacheln', async ({ page }) => {
    await page.goto('/');

    // Titel prüfen
    await expect(page).toHaveTitle('Nilsomat');

    // Überschrift
    const title = page.locator('.app-title');
    await expect(title).toHaveText('Nilsomat');

    // 3 Kacheln prüfen
    const booksTile = page.locator('.tile-books');
    const podcastsTile = page.locator('.tile-podcasts');
    const musicTile = page.locator('.tile-music');

    await expect(booksTile).toBeVisible();
    await expect(podcastsTile).toBeVisible();
    await expect(musicTile).toBeVisible();

    await expect(booksTile).toContainText('Hörbücher');
    await expect(podcastsTile).toContainText('Podcasts');
    await expect(musicTile).toContainText('Musik');

    // Mindestgröße der Kacheln prüfen (mind. 72x72 CSS px gemäß AGENTS.md)
    const box = await booksTile.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(72);
    expect(box!.height).toBeGreaterThanOrEqual(72);
  });

  test('Navigation ins Cover-Raster und Mindestgröße der Kacheln >= 300px (Abschnitt 5b)', async ({ page }) => {
    // API mocken mit Beispieldaten
    await page.route('/api/kid/items?section=books', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'abs:lib1:book1',
              section: 'books',
              kind: 'audiobook',
              title: 'Die kleinen Abenteurer',
              coverUrl: '/media/cover/abs:lib1:book1?w=640'
            },
            {
              id: 'abs:lib1:book2',
              section: 'books',
              kind: 'audiobook',
              title: 'Geschichten aus dem Zauberwald',
              coverUrl: '/media/cover/abs:lib1:book2?w=640'
            }
          ]
        })
      });
    });

    await page.goto('/');

    // Klick auf Hörbücher
    const booksTile = page.locator('.tile-books');
    await booksTile.click();

    // Zurück-Button und Überschrift sichtbar
    const backBtn = page.locator('.btn-back');
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toContainText('Zurück');

    // Touch-Größe des Zurück-Buttons >= 72px
    const backBox = await backBtn.boundingBox();
    expect(backBox).not.toBeNull();
    expect(backBox!.height).toBeGreaterThanOrEqual(72);

    // Kacheln im Raster prüfen
    const cards = page.locator('.item-card');
    await expect(cards).toHaveCount(2);

    // Pflicht-Check aus Abschnitt 5b: boundingBox jeder Raster-Kachel >= 300 CSS-px
    const cardBox = await cards.first().boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.width).toBeGreaterThanOrEqual(300);

    // Zurück zur Startseite
    await backBtn.click();
    await expect(booksTile).toBeVisible();
  });

  test('Versteckter Elternbereich-Einstieg per Long-Press auf Logo', async ({ page }) => {
    await page.goto('/');

    const logo = page.locator('.logo-area');
    await expect(logo).toBeVisible();

    // 3 Sekunden gedrückt halten
    const box = await logo.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(3200);
    await page.mouse.up();

    // Eltern-Modal sollte erscheinen
    const parentModal = page.locator('.parent-modal');
    await expect(parentModal).toBeVisible();
    await expect(parentModal).toContainText('Einstellungen für Eltern');

    // Schließen
    const closeBtn = page.locator('.btn-close');
    await closeBtn.click();
    await expect(parentModal).not.toBeVisible();
  });

  test('Player-Bedienelemente: Play/Pause >= 120px, 30s zurück >= 72px (Abschnitt 5.2)', async ({ page }) => {
    // API mocken mit Item und Tracks
    await page.route('**/api/kid/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ configured: true, dailyLimitReached: false, sleepTimerDefault: 0 })
      });
    });

    await page.route('**/api/kid/items?section=books', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'abs:lib1:book1',
              section: 'books',
              kind: 'audiobook',
              title: 'Hörbuch Test',
              coverUrl: '/media/cover/abs:lib1:book1?w=640'
            }
          ]
        })
      });
    });

    await page.route('**/api/kid/tracks/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tracks: [
            {
              id: 'abs:lib1:book1:ch1',
              title: 'Kapitel 1',
              durationSec: 180,
              streamUrl: '/media/stream/abs:lib1:book1:ch1'
            }
          ]
        })
      });
    });

    await page.route('**/media/stream/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: Buffer.from([])
      });
    });

    await page.route('**/media/cover/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"></svg>'
      });
    });

    await page.goto('/');

    // Öffne Hörbücher und klicke auf das Buch
    await page.locator('.tile-books').click();
    await page.locator('.item-card').first().click();

    // Vollbild-Player sollte geöffnet sein
    const player = page.locator('.player-fullscreen');
    await expect(player).toBeVisible();

    // Play/Pause Button Größe >= 120px
    const playPauseBtn = page.locator('.btn-play-pause');
    await expect(playPauseBtn).toBeVisible();
    const playBox = await playPauseBtn.boundingBox();
    expect(playBox).not.toBeNull();
    expect(playBox!.width).toBeGreaterThanOrEqual(120);
    expect(playBox!.height).toBeGreaterThanOrEqual(120);

    // 30s Zurück Button >= 72px
    const rewindBtn = page.locator('.btn-rewind');
    await expect(rewindBtn).toBeVisible();
    const rewindBox = await rewindBtn.boundingBox();
    expect(rewindBox).not.toBeNull();
    expect(rewindBox!.width).toBeGreaterThanOrEqual(72);
    expect(rewindBox!.height).toBeGreaterThanOrEqual(72);

    // Schließen Button oben links >= 72px
    const closeBtn = page.locator('.btn-close-player');
    await expect(closeBtn).toBeVisible();
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.width).toBeGreaterThanOrEqual(72);
    expect(closeBox!.height).toBeGreaterThanOrEqual(72);

    // Schließen -> Mini-Player sichtbar
    await closeBtn.click();
    await expect(player).not.toBeVisible();
    const miniPlayer = page.locator('.mini-player');
    await expect(miniPlayer).toBeVisible();
  });

  test('Tageslimit erreicht: Ruhige Endeseite sperrt den Kinderbereich (Abschnitt 6)', async ({ page }) => {
    await page.route('/api/kid/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          dailyLimitReached: true,
          sleepTimerDefault: 0
        })
      });
    });

    await page.goto('/');

    // Endeseite sollte sichtbar sein
    const limitMsg = page.locator('.limit-message');
    await expect(limitMsg).toBeVisible();
    await expect(limitMsg).toContainText('Für heute ist genug gehört. Bis morgen!');

    // Kacheln dürfen nicht sichtbar sein
    await expect(page.locator('.tile-books')).not.toBeVisible();
  });
});
