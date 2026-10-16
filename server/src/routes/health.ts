import { Hono } from 'hono';

export const healthRoutes = new Hono();

// Abschnitt 12: liefert 200 ohne Details (keine Versions- oder Dienstinfos nach außen)
healthRoutes.get('/healthz', (c) => {
  return c.text('OK', 200);
});
