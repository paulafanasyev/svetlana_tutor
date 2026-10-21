import test from 'node:test';
import assert from 'node:assert/strict';
import { priceOf } from './shopCatalog.js';

test('prices come from the catalog, unknown items are not sold', () => {
  assert.equal(priceOf('theme', 'galaxy'), 250);
  assert.equal(priceOf('teacher', 'emma'), 300);
  assert.equal(priceOf('frame', 'none'), 0);
  assert.equal(priceOf('theme', 'hack'), null);
  assert.equal(priceOf('theme', '__proto__'), null);
  assert.equal(priceOf('constructor', 'x'), null);
});
