// Run: node --test src/data/exams-ru.test.js  (also picked up by `npm test` via src/data/*.test.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMS_RU, BANKS_RU, RU_IDS, objectiveItemsRu, buildMockRu, ogeMark, egeScore, estimateRu, cefrLevel } from './exams-ru.js';
import { checkChildSafety } from '../ai/childSafety.js';

test('registry: oge and ege with all five sections and a practice disclaimer', () => {
  assert.deepEqual(RU_IDS, ['oge', 'ege']);
  for (const id of RU_IDS) {
    const e = EXAMS_RU[id];
    assert.equal(e.id, id);
    assert.ok(e.name && e.scale && e.color, id);
    assert.deepEqual(e.sections, ['listening', 'reading', 'use', 'writing', 'speaking']);
    assert.match(e.note, /не официальн|not official|ФИПИ|FIPI/i);
  }
  assert.equal(EXAMS_RU.oge.scale, 'Оценка 2–5');
  assert.equal(EXAMS_RU.ege.scale, 'Балл 0–100');
});

test('every objective item is well-formed and its answer is a unique listed option', () => {
  for (const id of RU_IDS) {
    for (const section of ['reading', 'listening', 'use']) {
      const items = objectiveItemsRu(id, section);
      assert.ok(items.length >= 6, `${id}/${section} too small: ${items.length}`);
      for (const it of items) {
        assert.ok(it.q && it.q.length > 5, `${id}/${section}: ${it.q}`);
        assert.ok(Array.isArray(it.options) && it.options.length >= 3, it.q);
        assert.equal(new Set(it.options).size, it.options.length, `duplicate option: ${it.q}`);
        assert.ok(it.options.includes(it.answer), `answer not in options: ${it.q} → ${it.answer}`);
        assert.equal(it.options.filter((o) => o === it.answer).length, 1, it.q);
        assert.ok(['reading', 'listening', 'grammar', 'vocab'].includes(it.skill), it.skill);
      }
    }
  }
});

test('reading items carry a passage; listening items carry a transcript', () => {
  for (const id of RU_IDS) {
    for (const it of objectiveItemsRu(id, 'reading')) assert.ok(it.passage && it.passage.length > 80, it.q);
    for (const it of objectiveItemsRu(id, 'listening')) assert.ok(it.transcript && it.transcript.length > 40, it.q);
    for (const it of objectiveItemsRu(id, 'use')) { assert.equal(it.passage, undefined); assert.equal(it.transcript, undefined); }
  }
});

test('content is child-safe (no crisis/danger trigger in any bank text)', () => {
  const texts = [];
  for (const id of RU_IDS) {
    for (const p of BANKS_RU.READING[id]) texts.push(p.passage, ...p.items.map((i) => i.q));
    for (const p of BANKS_RU.LISTENING[id]) texts.push(p.transcript, ...p.items.map((i) => i.q));
    texts.push(...BANKS_RU.USE[id].map((i) => i.q), ...BANKS_RU.WRITING[id].map((p) => p.task), ...BANKS_RU.SPEAKING[id]);
  }
  for (const s of texts) assert.equal(checkChildSafety(s, 'en'), null, `unsafe content: ${s}`);
});

test('buildMockRu: bounded length, only pool items, no writing/speaking', () => {
  for (const id of RU_IDS) {
    const pool = [...objectiveItemsRu(id, 'reading'), ...objectiveItemsRu(id, 'listening'), ...objectiveItemsRu(id, 'use')];
    const mock = buildMockRu(id, 20);
    assert.equal(mock.length, Math.min(20, pool.length));
    assert.equal(buildMockRu(id, 1000).length, pool.length, 'cannot exceed pool');
    assert.equal(buildMockRu(id, 0).length, 0);
    for (const it of mock) assert.ok(pool.some((p) => p.q === it.q && p.answer === it.answer), `stray item: ${it.q}`);
  }
});

test('writing prompts use FIPI-2026 word ranges', () => {
  for (const p of BANKS_RU.WRITING.oge) { assert.equal(p.minWords, 100); assert.equal(p.maxWords, 120); assert.ok(p.task.length > 40); }
  const ege = BANKS_RU.WRITING.ege;
  assert.equal(ege[0].minWords, 100); assert.equal(ege[0].maxWords, 140); // task 37 email
  assert.equal(ege[1].minWords, 200); assert.equal(ege[1].maxWords, 250); // task 38 chart
  assert.equal(ege[2].minWords, 200); assert.equal(ege[2].maxWords, 250); // task 38 diagram
  assert.match(ege[1].task + ege[2].task, /200–250|проект/i);
  for (const id of RU_IDS) for (const p of BANKS_RU.WRITING[id]) assert.ok(p.minWords <= p.maxWords);
});

test('speaking banks cover the FIPI task types', () => {
  assert.equal(BANKS_RU.SPEAKING.oge.length, 3); // read aloud / dialogue / monologue
  assert.equal(BANKS_RU.SPEAKING.ege.length, 4); // read aloud / questions / interview / project monologue
  for (const id of RU_IDS) for (const s of BANKS_RU.SPEAKING[id]) assert.ok(s.length > 40);
});

test('answer keys are linguistically correct (independent spot checks)', () => {
  const oge = objectiveItemsRu('oge', 'use');
  const find = (frag) => oge.find((i) => i.q.includes(frag)).answer;
  assert.equal(find('If it rains tomorrow'), 'will stay'); // first conditional
  assert.equal(find('when she was a child'), 'went'); // past habit
  assert.equal(find('the ___ book I have ever read'), 'most interesting'); // superlative
  assert.equal(find('The letter ___ by post'), 'was sent'); // passive past
  assert.equal(find('I have lived here ___ 2015'), 'since');
  const ege = objectiveItemsRu('ege', 'use');
  const fe = (frag) => ege.find((i) => i.q.includes(frag)).answer;
  assert.equal(fe('By next June'), 'will have finished'); // future perfect
  assert.equal(fe('If I ___ you'), 'were'); // second conditional subjunctive
  assert.equal(fe('Not only ___ the exam'), 'did she pass'); // inversion
  assert.equal(fe('He denied ___ the money'), 'taking'); // deny + gerund
  assert.equal(fe('It is high time we'), 'went'); // unreal past
});

test('scoring: oge mark thresholds, ege clamp, estimate shape', () => {
  assert.equal(ogeMark(1), 5); assert.equal(ogeMark(0.85), 5);
  assert.equal(ogeMark(0.84), 4); assert.equal(ogeMark(0.65), 4);
  assert.equal(ogeMark(0.64), 3); assert.equal(ogeMark(0.45), 3);
  assert.equal(ogeMark(0.44), 2); assert.equal(ogeMark(0), 2);
  assert.equal(egeScore(0), 0); assert.equal(egeScore(1), 100); assert.equal(egeScore(0.78), 78);
  assert.equal(egeScore(2), 100); assert.equal(egeScore(-1), 0); // clamped
  assert.equal(cefrLevel(0.95), 'B2–C1'); assert.equal(cefrLevel(0.2), 'A1');
  const o = estimateRu('oge', 0.9); assert.equal(o.headline, 'Оценка: 5'); assert.ok(o.cefr);
  const e = estimateRu('ege', 0.78); assert.equal(e.headline, 'Балл: ~78 / 100'); assert.ok(e.cefr);
});