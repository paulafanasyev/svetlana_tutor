// Independent verification of geometry generators: re-derive the answer from the
// numbers stated in the prompt (not from the generator's own answer field), plus
// exact-radical checker edge cases. Run: node --test src/features/math/geometry.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeProblem, TOPICS } from './problems.js';
import { check } from './checker.js';
import { simplifyRadical, GEOMETRY_TOPICS } from './geometry.js';

const num = (s) => Number(s);
const firstInts = (s, n) => (s.match(/-?\d+/g) || []).slice(0, n).map(Number);

test('geometry topics are registered for grades 7-9', () => {
  for (const g of [7, 8, 9]) {
    const ids = TOPICS[g].map((t) => t.id);
    for (const t of GEOMETRY_TOPICS[g]) assert.ok(ids.includes(t.id), `grade ${g} missing ${t.id}`);
  }
});

test('geo_angles: third angle = 180 - a - b (re-derived from prompt)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 7, topic: 'geo_angles', seed });
    const [a, b] = firstInts(p.prompt.ru, 2);
    assert.equal(num(p.answer.value), 180 - a - b, p.prompt.ru);
    assert.ok(180 - a - b > 0, 'third angle must be positive');
  }
});

test('geo_equilateral: perimeter/side relation (re-derived)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 7, topic: 'geo_equilateral', seed });
    const [x] = firstInts(p.prompt.ru, 1);
    const ans = num(p.answer.value);
    // either "side x -> perimeter 3x" or "perimeter x -> side x/3"
    assert.ok(ans === 3 * x || ans === x / 3, p.prompt.ru);
  }
});

test('geo_pythagoras: hypotenuse/leg satisfy a²+b²=c² (re-derived)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 8, topic: 'geo_pythagoras', seed });
    const [a, b] = firstInts(p.prompt.ru, 2);
    const ans = num(p.answer.value);
    // prompt gives two of {leg, leg, hypotenuse}; the answer is the third
    const ok = ans * ans === a * a + b * b || a * a === b * b + ans * ans || b * b === a * a + ans * ans;
    assert.ok(ok, `${p.prompt.ru} -> ${ans}`);
  }
});

test('geo_triangle_area: S = base*height/2 (re-derived)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 8, topic: 'geo_triangle_area', seed });
    const [a, h] = firstInts(p.prompt.ru, 2);
    const expected = (a * h) % 2 === 0 ? String((a * h) / 2) : `${a * h}/2`;
    assert.equal(p.answer.value, expected, p.prompt.ru);
  }
});

test('geo_circle_angles: inscribed = central/2 (re-derived)', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const p = makeProblem({ grade: 9, topic: 'geo_circle_angles', seed });
    const [x] = firstInts(p.prompt.ru, 1);
    const ans = num(p.answer.value);
    // central->inscribed (x/2), inscribed->arc (2x), or diameter (90)
    assert.ok(ans === x / 2 || ans === 2 * x || ans === 90, p.prompt.ru);
  }
});

test('simplifyRadical pulls out the largest square factor', () => {
  assert.deepEqual(simplifyRadical(18), { k: 3n, m: 2n });
  assert.deepEqual(simplifyRadical(72), { k: 6n, m: 2n });
  assert.deepEqual(simplifyRadical(16), { k: 4n, m: 1n });
  assert.deepEqual(simplifyRadical(13), { k: 1n, m: 13n });
  assert.deepEqual(simplifyRadical(200), { k: 10n, m: 2n });
});

test('radical checker: exact equivalence and canonicalisation', () => {
  const a = { kind: 'radical', value: '3√2' };
  assert.equal(check(a, '3√2').status, 'correct');
  assert.equal(check(a, '√18').status, 'correct'); // unsimplified input accepted
  assert.equal(check(a, '3*sqrt(2)').status, 'correct');
  assert.equal(check(a, '√8').status, 'wrong'); // 2√2 != 3√2
  assert.equal(check(a, '2√3').status, 'wrong');
  assert.equal(check(a, '6').status, 'wrong');
  assert.equal(check(a, 'abc').status, 'invalid');
  assert.equal(check(a, '√0').status, 'invalid');
  assert.equal(check({ kind: 'radical', value: '4' }, '√16').status, 'correct');
  assert.equal(check({ kind: 'radical', value: '5√3' }, '√75').status, 'correct');
});

test('radical checker rejects oversized radicand quickly (no hang)', () => {
  const a = { kind: 'radical', value: '3√2' };
  assert.equal(check(a, '√' + '9'.repeat(40)).status, 'invalid');
});

test('every geometry generator: 3 hints, units/keywords, no NaN, own key passes', () => {
  for (const [g, list] of Object.entries(GEOMETRY_TOPICS)) {
    for (const t of list) {
      for (let seed = 1; seed <= 100; seed++) {
        const p = makeProblem({ grade: +g, topic: t.id, seed });
        assert.equal(p.hints.length, 3, p.id);
        assert.ok(p.keywords.length > 0, p.id);
        assert.ok(!/NaN|undefined|Infinity/.test(JSON.stringify(p)), p.id);
        const res = check(p.answer, p.answer.value);
        assert.equal(res.status, 'correct', `${p.id}: ${p.answer.value} -> ${JSON.stringify(res)}`);
      }
    }
  }
});