import { Hono } from 'hono';

export const mediaRoutes = new Hono();

mediaRoutes.get('/cover/:id', (c) => {
  return c.text('Cover placeholder', 200);
});

mediaRoutes.get('/stream/:id', (c) => {
  return c.text('Stream placeholder', 200);
});
