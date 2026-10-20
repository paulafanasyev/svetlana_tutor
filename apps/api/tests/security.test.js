import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';
import { MAX_FAILS, _resetLoginGuard } from '../src/lib/loginGuard.js';

let app;

beforeEach(() => {
  setPrismaForTests(createFakePrisma());
  _resetLoginGuard();
  app = createApp();
});

describe('Brute-force and token theft protection', () => {
  it('locks the account after repeated wrong passwords, even for the right one', async () => {
    const email = 'lock@example.com';
    const password = 'correctPassword1';
    await request(app).post('/api/auth/register').send({ email, password, name: 'Lock' });

    for (let i = 0; i < MAX_FAILS; i += 1) {
      const r = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
      expect(r.status).toBe(401);
    }
    const locked = await request(app).post('/api/auth/login').send({ email, password });
    expect(locked.status).toBe(429);
    expect(Number(locked.headers['retry-after'])).toBeGreaterThan(0);

    // Other accounts are not affected.
    await request(app).post('/api/auth/register').send({ email: 'other@example.com', password, name: 'Other' });
    const other = await request(app).post('/api/auth/login').send({ email: 'other@example.com', password });
    expect(other.status).toBe(200);
  });

  it('a successful login resets the failure counter', async () => {
    const email = 'reset@example.com';
    const password = 'correctPassword1';
    await request(app).post('/api/auth/register').send({ email, password, name: 'Reset' });
    for (let i = 0; i < MAX_FAILS - 1; i += 1) {
      await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    }
    expect((await request(app).post('/api/auth/login').send({ email, password })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email, password })).status).toBe(200);
  });

  it('unknown e-mails get the same 401 as wrong passwords', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever1' });
    expect(r.status).toBe(401);
    expect(r.body.error).toBe('Invalid email or password');
  });

  it('reusing a rotated refresh token revokes all sessions of that user', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'thief@example.com', password: 'password123', name: 'Victim' });
    const stolen = reg.body.refreshToken;

    const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken: stolen });
    expect(rotated.status).toBe(200);
    const fresh = rotated.body.refreshToken;

    // The old copy shows up again (stolen token replayed).
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: stolen })).status).toBe(401);
    // ...so even the legitimate new token no longer works.
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: fresh })).status).toBe(401);
  });

  it('rejects passwords longer than bcrypt can hash (72 bytes)', async () => {
    const r = await request(app).post('/api/auth/register')
      .send({ email: 'long@example.com', password: 'я'.repeat(40), name: 'Long' });
    expect(r.status).toBe(400);
  });
});
