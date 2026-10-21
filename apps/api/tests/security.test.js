import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';
import { MAX_FAILS, _resetLoginGuard } from '../src/lib/loginGuard.js';
import { _resetRefreshReuse, _setReuseGraceMs } from '../src/lib/refreshReuse.js';

let app;

beforeEach(() => {
  setPrismaForTests(createFakePrisma());
  _resetLoginGuard();
  _resetRefreshReuse();
  app = createApp();
});

// app.js trusts one proxy hop, so X-Forwarded-For sets req.ip in tests.
const login = (body, ip = '10.0.0.1') => request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send(body);

describe('Brute-force protection', () => {
  it('locks this e-mail for the guessing address, even with the right password', async () => {
    const email = 'lock@example.com';
    const password = 'correctPassword1';
    await request(app).post('/api/auth/register').send({ email, password, name: 'Lock' });

    for (let i = 0; i < MAX_FAILS; i += 1) {
      expect((await login({ email, password: 'wrong-password' }, '10.0.0.66')).status).toBe(401);
    }
    const locked = await login({ email, password }, '10.0.0.66');
    expect(locked.status).toBe(429);
    expect(Number(locked.headers['retry-after'])).toBeGreaterThan(0);

    // The real owner from another address is NOT locked out (audit 21.10: no lock-out of a victim).
    expect((await login({ email, password }, '10.0.0.7')).status).toBe(200);
  });

  it('a successful login resets the failure counter', async () => {
    const email = 'reset@example.com';
    const password = 'correctPassword1';
    await request(app).post('/api/auth/register').send({ email, password, name: 'Reset' });
    for (let i = 0; i < MAX_FAILS - 1; i += 1) await login({ email, password: 'wrong-password' });
    expect((await login({ email, password })).status).toBe(200);
    expect((await login({ email, password: 'wrong-password' })).status).toBe(401);
    expect((await login({ email, password })).status).toBe(200);
  });

  it('unknown e-mails get the same 401 as wrong passwords', async () => {
    const r = await login({ email: 'nobody@example.com', password: 'whatever1' });
    expect(r.status).toBe(401);
    expect(r.body.error).toBe('Invalid email or password');
  });

  it('rejects passwords longer than bcrypt can hash (72 bytes)', async () => {
    const r = await request(app).post('/api/auth/register')
      .send({ email: 'long@example.com', password: 'я'.repeat(40), name: 'Long' });
    expect(r.status).toBe(400);
  });
});

describe('Refresh token theft', () => {
  const register = (email) => request(app).post('/api/auth/register').send({ email, password: 'password123', name: 'Victim' });
  const refresh = (refreshToken) => request(app).post('/api/auth/refresh').send({ refreshToken });

  it('a replayed old token (after the grace window) revokes all sessions of that user', async () => {
    _setReuseGraceMs(0);
    const stolen = (await register('thief@example.com')).body.refreshToken;
    const rotated = await refresh(stolen);
    expect(rotated.status).toBe(200);
    await new Promise((r) => setTimeout(r, 5));
    expect((await refresh(stolen)).status).toBe(401);
    expect((await refresh(rotated.body.refreshToken)).status).toBe(401);
  });

  it('two tabs refreshing at once do not log the user out', async () => {
    const first = (await register('tabs@example.com')).body.refreshToken;
    const rotated = await refresh(first);
    expect(rotated.status).toBe(200);
    expect((await refresh(first)).status).toBe(401); // the second tab is refused…
    expect((await refresh(rotated.body.refreshToken)).status).toBe(200); // …but the session lives on
  });
});
