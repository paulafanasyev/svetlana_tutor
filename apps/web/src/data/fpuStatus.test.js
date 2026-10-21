import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { statusKey, withStatus, activeTextbooks, isExpired, fmtUntil, textbookKey } from './fpuStatus.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fop');
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const books = [...read('textbooks.json'), ...read('textbooks_add.json')];
const status = read('../fpu_status.json');

test('каждая запись статуса находит ровно один учебник', () => {
  const miss = Object.keys(status.items).filter((k) => books.filter((b) => statusKey(b) === k).length !== 1);
  assert.deepEqual(miss, []);
});

test('повторяющиеся номера ФПУ различаются кодом позиции', () => {
  const all = withStatus(books, status), by = {};
  for (const b of all) (by[b.fpu_number] ||= []).push(b);
  const bad = Object.entries(by).filter(([, xs]) => xs.length > 1 && (xs.some((x) => !x.fpu_code) || new Set(xs.map((x) => x.fpu_code)).size !== xs.length)).map(([n]) => n);
  assert.deepEqual(bad, []);
});

test('ключи карточек учебников уникальны', () => {
  const keys = withStatus(books, status).map(textbookKey);
  assert.equal(new Set(keys).size, keys.length);
});

test('просроченные учебники скрываются, срок в день окончания ещё действует', () => {
  const b = { fpu_number: 1, subject: 'x', use_until: '2026-08-31' };
  assert.equal(isExpired(b, '2026-08-31'), false);
  assert.equal(isExpired(b, '2026-09-01'), true);
  assert.equal(isExpired({ fpu_number: 2, subject: 'y' }, '2099-01-01'), false);
  const act = activeTextbooks(books, status, '2026-10-21');
  assert.ok(!act.some((x) => x.fpu_number === 205 && x.subject === 'Литература'));
  assert.ok(act.some((x) => x.fpu_number === 205 && x.subject === 'ОРКСЭ'));
  assert.ok(act.some((x) => x.fpu_number === 206 && x.subject === 'Литература'));
});

test('дата срока по-русски', () => {
  assert.equal(fmtUntil('2027-08-31'), '31 августа 2027 г.');
  assert.equal(fmtUntil(''), '');
});
