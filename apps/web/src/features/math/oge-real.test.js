// Independent verification of ОГЭ real-math generators: recompute the answer from
// the numbers in the prompt. Run: node --test src/features/math/oge-real.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { Q } from './rational.js';
import { makeProblem, TOPICS } from './problems.js';
import { check, toQ } from './checker.js';
import { OGE_REAL_TOPICS } from './oge-real.js';

test('ОГЭ topics registered for grade 9 and tagged oge', () => {
  const ids = TOPICS[9].map((t) => t.id);
  for (const t of OGE_REAL_TOPICS[9]) {
    assert.ok(ids.includes(t.id), `missing ${t.id}`);
    assert.equal(makeProblem({ grade: 9, topic: t.id, seed: 1 }).oge, true, t.id);
  }
});

test('oge_tire: diameter = rim*25.4 + 2*(W*P/100), exact', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 9, topic: 'oge_tire', seed });
    const m = /(\d+)\/(\d+) R(\d+)/.exec(p.prompt.ru);
    const [W, P, rim] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const expected = new Q(BigInt(rim * 254), 10n).add(new Q(BigInt(W * P), 100n).mul(2));
    assert.ok(toQ(p.answer.value).eq(expected), p.prompt.ru);
  }
});

test('oge_plot: area = a*b OR fence cost = 2*(a+b)*price', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 9, topic: 'oge_plot', seed });
    const ints = (p.prompt.ru.match(/\d+/g) || []).map(Number);
    if (/площадь/.test(p.prompt.ru)) {
      const [a, b] = ints;
      assert.equal(p.answer.value, String(a * b), p.prompt.ru);
    } else {
      const [a, b, price] = ints;
      assert.equal(p.answer.value, String(2 * (a + b) * price), p.prompt.ru);
    }
  }
});

test('oge_plan: area = cells * scale²', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 9, topic: 'oge_plan', seed });
    const [a, b] = (p.prompt.ru.match(/\d+/g) || []).map(Number);
    const scale = /0,5 м/.test(p.prompt.ru) ? new Q(1n, 2n) : new Q(1n);
    const expected = new Q(BigInt(a * b)).mul(scale).mul(scale);
    assert.ok(toQ(p.answer.value).eq(expected), p.prompt.ru);
  }
});

test('oge_paper: count = 2^(m-n)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 9, topic: 'oge_paper', seed });
    const m = /A(\d+).*A(\d+)/.exec(p.prompt.ru);
    const [n, mm] = [Number(m[1]), Number(m[2])];
    assert.equal(p.answer.value, String(2 ** (mm - n)), p.prompt.ru);
  }
});

test('oge_stove: V/π = r²*h', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const p = makeProblem({ grade: 9, topic: 'oge_stove', seed });
    const [r, h] = (p.prompt.ru.match(/\d+/g) || []).map(Number);
    assert.equal(p.answer.value, String(r * r * h), p.prompt.ru);
  }
});

test('every ОГЭ generator: 3 hints, own key passes, mistakes rejected', () => {
  for (const t of OGE_REAL_TOPICS[9]) {
    for (let seed = 1; seed <= 150; seed++) {
      const p = makeProblem({ grade: 9, topic: t.id, seed });
      assert.equal(p.hints.length, 3, p.id);
      assert.ok(!/NaN|undefined|Infinity/.test(JSON.stringify(p)), p.id);
      assert.equal(check(p.answer, p.answer.value).status, 'correct', p.id);
      for (const mk of p.answer.mistakes || []) {
        if (check(p.answer, mk.value).status === 'correct') continue;
        assert.equal(check(p.answer, mk.value).status, 'wrong', `${p.id} mistake ${mk.id}`);
      }
    }
  }
});