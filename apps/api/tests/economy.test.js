import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';
import { _resetEarnBudgets } from '../src/routes/economy.js';

let app;
let fakePrisma;

beforeEach(() => {
  fakePrisma = createFakePrisma();
  setPrismaForTests(fakePrisma);
  _resetEarnBudgets();
  app = createApp();
});

async function registerAndLogin(email = 'econ@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Econ User' });
  return { accessToken: res.body.accessToken, user: res.body.user };
}

const earn = (token, coins) => request(app).post('/api/economy/earn').set('Authorization', `Bearer ${token}`).send({ xp: 0, coins });
const spend = (token, body) => request(app).post('/api/economy/spend').set('Authorization', `Bearer ${token}`).send(body);

describe('Economy', () => {
  it('rejects spend with insufficient coins with 400', async () => {
    const { accessToken } = await registerAndLogin();
    // User starts with 0 coins by default; the gold frame costs 100.
    const res = await spend(accessToken, { itemType: 'frame', itemId: 'gold' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it('allows spend when the user has enough coins, decrementing balance and recording an Unlock', async () => {
    const { accessToken } = await registerAndLogin('econ2@example.com');

    const earnRes = await earn(accessToken, 100);
    expect(earnRes.status).toBe(200);
    expect(earnRes.body.coins).toBe(100);

    const spendRes = await spend(accessToken, { itemType: 'frame', itemId: 'gold' });
    expect(spendRes.status).toBe(200);
    expect(spendRes.body.coins).toBe(0);

    const unlocksRes = await request(app)
      .get('/api/economy/unlocks')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(unlocksRes.status).toBe(200);
    expect(unlocksRes.body.unlocks).toHaveLength(1);
    expect(unlocksRes.body.unlocks[0].itemId).toBe('gold');
  });

  it('ignores the price sent by the client (audit 21.10: no more buying anything for 1 coin)', async () => {
    const { accessToken } = await registerAndLogin('econ4@example.com');
    await earn(accessToken, 100);
    const res = await spend(accessToken, { itemType: 'theme', itemId: 'galaxy', price: 1 });
    expect(res.status).toBe(400); // galaxy costs 250 on the server
    const me = await request(app).get('/api/economy/unlocks').set('Authorization', `Bearer ${accessToken}`);
    expect(me.body.unlocks).toHaveLength(0);
  });

  it('refuses items that are not in the catalog', async () => {
    const { accessToken } = await registerAndLogin('econ5@example.com');
    await earn(accessToken, 100);
    expect((await spend(accessToken, { itemType: 'avatar', itemId: 'wizard-hat', price: 1 })).status).toBe(404);
    expect((await spend(accessToken, { itemType: 'theme', itemId: '__proto__' })).status).toBe(404);
  });

  it('enforces server-side caps on earn (max 200 xp / 100 coins per call)', async () => {
    const { accessToken } = await registerAndLogin('econ3@example.com');

    const res = await request(app)
      .post('/api/economy/earn')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ xp: 999, coins: 999 });

    expect(res.status).toBe(400);
  });
});
