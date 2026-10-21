// Игры по предметам: вопросы есть для каждой клетки учебного плана (часы > 0), формат верный,
// правильный ответ среди вариантов, каждый пакет прошёл трёх критиков (факты, методист, детский редактор).
// Проверяется то, что увидит ребёнок: файл пакета вместе с правками критиков (games/fixes.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { gameCells, SLUGS, ICONS, normalizeGrade } from './games/subjects.js';
import { REVIEW } from './games/review.js';
import { FIXES, applyFixes } from './games/fixes.js';

const dir = new URL('./games/packs/', import.meta.url);
const loaderSrc = readFileSync(new URL('./games/loadPack.js', import.meta.url), 'utf8');
const slugs = [...new Set(Object.values(SLUGS))];
const files = Object.fromEntries(slugs.map((s) => [s, JSON.parse(readFileSync(new URL(`${s}.json`, dir), 'utf8'))]));
const str = (x) => typeof x === 'string' && x.trim().length > 0;

test('для каждого предмета есть файл, загрузчик и значок', () => {
  for (const s of slugs) {
    assert.ok(loaderSrc.includes(`${s}: () => import('./packs/${s}.json')`), `загрузчик ${s}`);
    assert.ok(ICONS[s], `значок ${s}`);
  }
  const extra = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((s) => !slugs.includes(s));
  assert.deepEqual(extra, [], 'лишние файлы');
});

test('каждая клетка плана 1–11 с часами > 0 имеет вопросы и пары', () => {
  const cells = gameCells();
  assert.equal(cells.length, 136);
  for (const c of cells) {
    const g = applyFixes(c.slug, c.grade, files[c.slug].grades?.[String(c.grade)]);
    assert.ok(g, `${c.subject}, ${c.grade} класс`);
    assert.equal(g.subject, c.subject, `${c.slug} ${c.grade}: предмет`);
    assert.ok(g.quiz.length >= 6, `${c.slug} ${c.grade}: вопросов ${g.quiz.length}`);
    assert.ok(g.pairs.length >= 4, `${c.slug} ${c.grade}: пар ${g.pairs.length}`);
  }
  for (const [slug, f] of Object.entries(files)) {
    for (const grade of Object.keys(f.grades)) {
      assert.ok(cells.some((c) => c.slug === slug && String(c.grade) === grade), `${slug}: класса ${grade} нет в плане`);
    }
  }
});

test('вопросы: 4 разных варианта, ответ среди них, есть тема и объяснение', () => {
  for (const [slug, f] of Object.entries(files)) {
    for (const [grade, raw] of Object.entries(f.grades)) {
      const g = applyFixes(slug, grade, raw);
      const qs = new Set();
      const answers = new Set();
      for (const [i, x] of g.quiz.entries()) {
        const at = `${slug}-${grade}-q${i + 1}`;
        assert.ok(str(x.t) && str(x.q) && str(x.e), `${at}: тема, вопрос, объяснение`);
        assert.ok(Array.isArray(x.o) && x.o.length === 4 && x.o.every(str), `${at}: 4 варианта`);
        assert.equal(new Set(x.o.map((o) => o.trim().toLowerCase())).size, 4, `${at}: варианты повторяются`);
        assert.ok(Number.isInteger(x.a) && x.a >= 0 && x.a < 4, `${at}: номер ответа`);
        assert.ok(!qs.has(x.q), `${at}: вопрос повторяется`);
        qs.add(x.q); answers.add(x.a);
      }
      assert.ok(answers.size >= 2, `${slug}-${grade}: правильный ответ всегда на одном месте`);
      const terms = g.pairs.map((p) => p[0]), means = g.pairs.map((p) => p[1]);
      assert.ok(g.pairs.every((p) => Array.isArray(p) && p.length === 2 && p.every(str)), `${slug}-${grade}: пары`);
      assert.equal(new Set(terms).size, terms.length, `${slug}-${grade}: термины повторяются`);
      assert.equal(new Set(means).size, means.length, `${slug}-${grade}: значения повторяются`);
      const n = normalizeGrade(slug, Number(grade), raw);
      assert.equal(new Set([...n.quiz, ...n.pairs].map((x) => x.id)).size, n.quiz.length + n.pairs.length);
    }
  }
});

test('каждая правка критиков указывает на существующий вопрос или пару', () => {
  for (const id of Object.keys(FIXES)) {
    const m = /^(.+)-(\d+)-([qp])(\d+)$/.exec(id);
    assert.ok(m, `${id}: формат ключа`);
    const g = files[m[1]]?.grades?.[m[2]];
    const list = m[3] === 'q' ? g?.quiz : g?.pairs;
    assert.ok(list?.[Number(m[4]) - 1], `${id}: нет такого места в файле`);
  }
});

test('каждый пакет проверили три критика', () => {
  for (const slug of slugs) {
    const r = REVIEW[slug] || {};
    for (const k of ['factcheck', 'methodist', 'editor']) assert.equal(r[k], 'pass', `${slug}: ${k}`);
    assert.match(String(r.date || ''), /^\d{4}-\d{2}-\d{2}$/, `${slug}: дата проверки`);
  }
});
