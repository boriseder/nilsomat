import { describe, expect, it } from 'vitest';
import app from '../server/src/index.js';

describe('Server Healthz Endpunkt (AGENTS.md Abschnitt 12)', () => {
  it('GET /healthz liefert 200 OK ohne technische Details', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe('OK');
  });
});
