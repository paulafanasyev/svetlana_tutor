// Английское ядро (P0.1): генератор воспроизводим, объёмы достигнуты, у каждого элемента есть теги
// класс-сложность-контекст, форматы choose/reorder/findError и диалогов корректны, нет вьетнамских
// полей (приложение только ru/en), и весь контент проходит детский фильтр безопасности.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEnglish } from '../../scripts/generate-english.mjs';
import { checkChildSafety } from '../ai/childSafety.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const TOPICS = ['basics', 'family', 'food', 'travel', 'school', 'hobbies', 'nature', 'city', 'shopping', 'work', 'technology', 'feelings'];
const { vocabulary, grammar, listening, stats } = buildEnglish();
const str = (x) => typeof x === 'string' && x.trim().length > 0;
const distinct = (a) => new Set(a.map((x) => String(x).trim().toLowerCase())).size === a.length;

test('генерация детерминирована: два вызова дают идентичный результат', () => {
  const a = buildEnglish();
  const b = buildEnglish();
  assert.deepEqual(a.stats, b.stats);
  assert.deepEqual(a.vocabulary, b.vocabulary);
  assert.deepEqual(a.grammar, b.grammar);
  assert.deepEqual(a.listening, b.listening);
});

test('объёмы ядра достигнуты: грамматика 500, аудирование 60, словарь расширен', () => {
  assert.equal(stats.grammar, 500);
  assert.equal(stats.listening, 60);
  assert.ok(stats.vocabulary >= 1694, `словарь ${stats.vocabulary}`);
  assert.equal(vocabulary.length, stats.vocabulary);
  assert.equal(grammar.length, stats.grammar);
  assert.equal(listening.length, stats.listening);
});

test('каждый элемент имеет теги класс-сложность-контекст и навык', () => {
  const p = [];
  const check = (x, skill) => {
    if (x.skill !== skill) p.push(`${x.id}: навык ${x.skill}`);
    if (!(Array.isArray(x.grades) && x.grades.length === 2 && x.grades[0] >= 2 && x.grades[1] <= 11 && x.grades[0] <= x.grades[1])) p.push(`${x.id}: классы`);
    if (!(Number.isInteger(x.difficulty) && x.difficulty >= 1 && x.difficulty <= 4)) p.push(`${x.id}: сложность`);
    if (!str(x.context)) p.push(`${x.id}: контекст`);
  };
  for (const w of vocabulary) check(w, 'vocabulary');
  for (const g of grammar) check(g, 'grammar');
  for (const l of listening) check(l, 'listening');
  assert.deepEqual(p, []);
});

test('словарь: текст, уровень/тема, уникальные id, перевод и пример', () => {
  const p = [];
  const ids = new Set();
  for (const w of vocabulary) {
    if (!(str(w.en) && str(w.ru) && str(w.exEn) && str(w.exRu))) p.push(`${w.id}: текст`);
    if (!LEVELS.includes(w.level) || !TOPICS.includes(w.topic)) p.push(`${w.id}: уровень/тема`);
    if (ids.has(w.id)) p.push(`${w.id}: id повторяется`);
    ids.add(w.id);
  }
  assert.deepEqual(p, []);
});

test('грамматика: choose/reorder/findError корректны, ответ на месте', () => {
  const p = [];
  const ids = new Set();
  for (const g of grammar) {
    if (ids.has(g.id)) p.push(`${g.id}: id повторяется`);
    ids.add(g.id);
    if (!LEVELS.includes(g.level) || !str(g.explain?.en) || !str(g.explain?.ru)) p.push(`${g.id}: мета`);
    if (g.type === 'choose') {
      if (!g.sentence.includes('___')) p.push(`${g.id}: нет пропуска`);
      if (!(Array.isArray(g.options) && g.options.length >= 3 && distinct(g.options))) p.push(`${g.id}: варианты`);
      if (!(Number.isInteger(g.answer) && g.answer >= 0 && g.answer < g.options.length)) p.push(`${g.id}: номер ответа`);
    } else if (g.type === 'reorder') {
      if (!(Array.isArray(g.words) && str(g.correct))) p.push(`${g.id}: форма reorder`);
      else if ([...g.words].sort().join('|') !== g.correct.split(' ').sort().join('|')) p.push(`${g.id}: слова не совпадают`);
    } else if (g.type === 'findError') {
      const toks = g.sentence.split(' ');
      if (!(Number.isInteger(g.errorIndex) && g.errorIndex >= 0 && g.errorIndex < toks.length && str(g.correction))) p.push(`${g.id}: форма findError`);
      else if (toks[g.errorIndex] === g.correction) p.push(`${g.id}: правка совпадает с ошибкой`);
    } else p.push(`${g.id}: неизвестный тип ${g.type}`);
  }
  assert.deepEqual(p, []);
});

test('аудирование: диалоги и вопросы корректны, ответ среди вариантов', () => {
  const p = [];
  const ids = new Set();
  for (const l of listening) {
    if (ids.has(l.id)) p.push(`${l.id}: id повторяется`);
    ids.add(l.id);
    if (!(str(l.title?.en) && str(l.title?.ru))) p.push(`${l.id}: заголовок`);
    if (!(Array.isArray(l.lines) && l.lines.length >= 2 && l.lines.every((x) => str(x.en)))) p.push(`${l.id}: реплики`);
    if (!(Array.isArray(l.questions) && l.questions.length)) { p.push(`${l.id}: нет вопросов`); continue; }
    for (const [i, qq] of l.questions.entries()) {
      const at = `${l.id}-q${i + 1}`;
      if (!(str(qq.en) && str(qq.ru))) p.push(`${at}: текст вопроса`);
      if (!(Array.isArray(qq.options) && qq.options.length >= 3 && distinct(qq.options))) p.push(`${at}: варианты`);
      if (!(Number.isInteger(qq.answer) && qq.answer >= 0 && qq.answer < qq.options.length)) p.push(`${at}: номер ответа`);
    }
  }
  assert.deepEqual(p, []);
});

test('нет вьетнамских полей: приложение только ru/en', () => {
  assert.ok(!JSON.stringify({ vocabulary, grammar, listening }).includes('"vi"'));
});

test('детская безопасность: весь контент без опасных и кризисных тем', () => {
  const p = [];
  const scan = (id, text) => {
    if (!str(text)) return;
    for (const locale of ['ru', 'en']) {
      const hit = checkChildSafety(text, locale);
      if (hit) p.push(`${id}: ${hit.kind} (${locale})`);
    }
  };
  for (const w of vocabulary) { scan(w.id, w.en); scan(w.id, w.ru); scan(w.id, w.exEn); scan(w.id, w.exRu); }
  for (const g of grammar) {
    scan(g.id, g.sentence); scan(g.id, g.correct); scan(g.id, g.correction);
    scan(g.id, g.explain?.en); scan(g.id, g.explain?.ru);
    for (const o of g.options || []) scan(g.id, o);
  }
  for (const l of listening) {
    scan(l.id, l.title.en); scan(l.id, l.title.ru);
    for (const ln of l.lines) scan(l.id, ln.en);
    for (const qq of l.questions) { scan(l.id, qq.en); scan(l.id, qq.ru); for (const o of qq.options) scan(l.id, o); }
  }
  assert.deepEqual(p, []);
});