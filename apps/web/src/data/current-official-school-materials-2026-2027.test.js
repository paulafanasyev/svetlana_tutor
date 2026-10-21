import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('./current-official-school-materials-2026-2027.json', import.meta.url), 'utf8'));

test('current official school-material records are unique and dated', () => {
  const ids = catalog.records.map((record) => record.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(catalog.checkedAt, '2026-10-21');
  assert.equal(catalog.records.length, 6);
  for (const record of catalog.records) {
    assert.ok(record.title && record.sourceId && record.subject);
    assert.match(record.url, /^https:\/\//);
    assert.equal(record.checkedAt, catalog.checkedAt);
    assert.equal(record.contentStoredLocally, false);
    assert.match(record.rights, /NOT PROVEN/);
  }
});

test('current official materials include EDSOO letters and FIPI 2027 projects', () => {
  const ids = new Set(catalog.records.map((record) => record.id));
  for (const id of [
    'edsoo-literature-guidance-letter-2026-2027',
    'edsoo-technology-guidance-letter-2026-2027',
    'fipi-oge-project-kim-2027',
    'fipi-ege-project-kim-2027'
  ]) assert.ok(ids.has(id), id);
});
