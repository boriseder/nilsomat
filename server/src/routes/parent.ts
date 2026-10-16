import { Hono } from 'hono';

export const parentRoutes = new Hono();

parentRoutes.get('/status', (c) => {
  return c.json({
    status: 'ok',
    configured: false
  });
});
