import { Hono } from 'hono';

export const kidRoutes = new Hono();

kidRoutes.get('/sections', (c) => {
  return c.json({
    sections: ['books', 'podcasts', 'music']
  });
});

kidRoutes.get('/items', (c) => {
  return c.json({
    items: []
  });
});
