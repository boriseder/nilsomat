import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { healthRoutes } from './routes/health.js';
import { kidRoutes } from './routes/kid.js';
import { mediaRoutes } from './routes/media.js';
import { parentRoutes } from './routes/parent.js';

// Validierung: APP_SECRET ist Pflicht (Abschnitt 12)
if (!process.env.APP_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: APP_SECRET environment variable is missing.');
  process.exit(1);
}

const app = new Hono();

// Sicherheits-Header & CSP (Abschnitt 8)
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'"
  );
});

// Routen einbinden
app.route('/', healthRoutes);
app.route('/api/kid', kidRoutes);
app.route('/api/parent', parentRoutes);
app.route('/media', mediaRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Statische Client-Dateien ausliefern (Produktion / Container)
const candidatePaths = [
  path.resolve(__dirname, '../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist')
];
const clientDistPath = candidatePaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  const root = path.relative(process.cwd(), clientDistPath);
  app.use('/*', serveStatic({ root }));
  app.get('*', serveStatic({ path: path.join(root, 'index.html') }));
}

const port = Number(process.env.PORT) || 8080;

if (process.env.NODE_ENV !== 'test') {
  console.log(JSON.stringify({ level: 'info', message: `Nilsomat BFF running on port ${port}` }));
  serve({
    fetch: app.fetch,
    port
  });
}

export default app;
