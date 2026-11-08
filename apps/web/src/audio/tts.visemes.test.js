import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visemeSpec } from './tts.js';

const { VISEME_Q, VISEME_W, visemeFor, speechUnits } = visemeSpec;

test('viseme aperture: labials closed, wide vowels widest', () => {
  assert.equal(VISEME_Q.M, 0);
  assert.equal(VISEME_Q.A, 1);
  assert.ok(VISEME_Q.F < VISEME_Q.L);
  assert.ok(VISEME_Q.L < VISEME_Q.I);
  assert.ok(VISEME_Q.I < VISEME_Q.E);
  assert.ok(VISEME_Q.E < VISEME_Q.U);
  assert.ok(VISEME_Q.U < VISEME_Q.O);
  assert.ok(VISEME_Q.O < VISEME_Q.A);
});

test('viseme hold: vowels outlast consonants', () => {
  assert.ok(VISEME_W.A > VISEME_W.E);
  assert.ok(VISEME_W.E > VISEME_W.L);
  assert.ok(VISEME_W.L > VISEME_W.M);
  assert.ok(VISEME_W.M > 0);
});

test('visemeFor treats Cyrillic and Latin letters alike', () => {
  assert.equal(visemeFor('п'), 'M');
  assert.equal(visemeFor('p'), 'M');
  assert.equal(visemeFor('а'), 'A');
  assert.equal(visemeFor('a'), 'A');
  assert.equal(visemeFor('о'), 'O');
  assert.equal(visemeFor('ы'), 'I');
  assert.equal(visemeFor('й'), 'I');
  assert.equal(visemeFor('ё'), 'E');
  assert.equal(visemeFor('ф'), 'F');
  assert.equal(visemeFor('в'), 'F');
  assert.equal(visemeFor('л'), 'L');
  assert.equal(visemeFor('н'), 'L');
});

test('speechUnits: lip closure between words, pause at sentence ends', () => {
  const units = speechUnits('Привет, кадет. Приступай!');
  const vs = units.map((u) => u.v);
  assert.equal(vs[6], 'M');     // gap after «Привет,»
  assert.equal(vs[12], 'rest'); // full stop after «кадет»
  assert.equal(vs[13], 'M');    // gap after «кадет.»
  assert.equal(vs[23], 'rest'); // exclamation end
  assert.ok(vs.slice(0, 6).every((v) => v !== 'rest')); // no pause inside a word
});

test('speechUnits: every unit is timed (positive weight) and has an aperture', () => {
  const units = speechUnits('Кадет, приветствую тебя! Здесь ценятся дисциплина, знания и уважение.');
  assert.ok(units.length > 20);
  units.forEach((u) => {
    assert.ok(u.w > 0, `weight for ${u.v}`);
    assert.ok(Number.isFinite(VISEME_Q[u.v]), `aperture for ${u.v}`);
  });
});

test('cadet greeting schedules visible mouth variety', () => {
  const units = speechUnits('Кадет, приветствую тебя! Здесь ценятся дисциплина, знания и уважение. Будь настойчив, думай самостоятельно и каждый день становись сильнее. Приступай к занятиям!');
  const kinds = new Set(units.map((u) => u.v));
  for (const v of ['A', 'O', 'E', 'I', 'L', 'M', 'rest']) assert.ok(kinds.has(v), `missing ${v}`);
});
