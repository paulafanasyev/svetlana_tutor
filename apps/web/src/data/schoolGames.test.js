// Игры по предметам: вопросы есть для каждой клетки учебного плана (часы > 0), формат верный,
// правильный ответ среди вариантов, каждый пакет прошёл трёх критиков (факты, методист, детский редактор).
// Проверяется то, что увидит ребёнок: packs/ + more/ (вторая дюжина) вместе с правками критиков (games/fixes.js).
// Замечания по содержимому собираются списком: в CI видно сразу все (в сводке запуска), а не только первое.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { gameCells, SLUGS, ICONS, normalizeGrade, mergeMore } from './games/subjects.js';
import { REVIEW } from './games/review.js';
import { FIXES, applyFixes } from './games/fixes.js';

const MIN_QUIZ = 6;
const dir = new URL('./games/packs/', import.meta.url);
const moreDir = new URL('./games/more/', import.meta.url);
const loaderSrc = readFileSync(new URL('./games/loadPack.js', import.meta.url), 'utf8');
const slugs = [...new Set(Object.values(SLUGS))];
const loadErrors = [];
const json = (u) => {
  try { return JSON.parse(readFileSync(u, 'utf8')); } catch (e) { loadErrors.push(`${u.pathname.split('/').slice(-2).join('/')}: ${e.message}`); return { grades: {} }; }
};
const files = Object.fromEntries(slugs.map((s) => [s, json(new URL(`${s}.json`, dir))]));
const moreNames = existsSync(moreDir) ? readdirSync(moreDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
const more = Object.fromEntries(moreNames.filter((s) => slugs.includes(s)).map((s) => [s, json(new URL(`${s}.json`, moreDir))]));
const merged = (slug, grade) => mergeMore(files[slug]?.grades?.[String(grade)], more[slug]?.grades?.[String(grade)]);
const str = (x) => typeof x === 'string' && x.trim().length > 0;

// В CI итог каждой проверки пишется в сводку запуска (видна на странице Actions без входа в логи).
function report(name, problems) {
  const out = process.env.GITHUB_STEP_SUMMARY;
  if (out) appendFileSync(out, `\n**schoolGames: ${name}**: ${problems.length ? `${problems.length} замечаний\n\n${problems.slice(0, 80).map((x) => `- ${x}`).join('\n')}` : 'ok'}\n`);
  // Аннотация на странице запуска: пишем в stdout запускающего node --test (вывод самого теста он прячет).
  if (problems.length && process.env.GITHUB_ACTIONS) {
    try { appendFileSync(`/proc/${process.ppid}/fd/1`, `\n::error title=schoolGames: ${name} (${problems.length})::${problems.slice(0, 40).join(' | ')}\n`); } catch { /* не Linux */ }
  }
  assert.deepEqual(problems, []);
}

test('для каждого предмета есть файл, загрузчик и значок', () => {
  const p = [...loadErrors];
  for (const s of slugs) {
    if (!loaderSrc.includes(`${s}: () => import('./packs/${s}.json')`)) p.push(`загрузчик ${s}`);
    if (!ICONS[s]) p.push(`значок ${s}`);
  }
  if (!loaderSrc.includes("import.meta.glob('./more/*.json')")) p.push('загрузчик more/');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).map((x) => x.slice(0, -5))) if (!slugs.includes(f)) p.push(`лишний файл packs/${f}`);
  for (const f of moreNames) if (!slugs.includes(f)) p.push(`лишний файл more/${f}`);
  for (const [s, f] of Object.entries(more)) for (const grade of Object.keys(f.grades || {})) if (!files[s].grades?.[grade]) p.push(`more/${s}: класса ${grade} нет в packs/`);
  report('файлы', p);
});

test('каждая клетка плана 1–11 с часами > 0 имеет вопросы и пары', () => {
  const p = [];
  const cells = gameCells();
  if (cells.length !== 136) p.push(`клеток ${cells.length}`);
  for (const c of cells) {
    const g = applyFixes(c.slug, c.grade, merged(c.slug, c.grade));
    if (!g) { p.push(`${c.subject}, ${c.grade} класс: нет`); continue; }
    if (g.subject !== c.subject) p.push(`${c.slug}-${c.grade}: предмет «${g.subject}»`);
    if (!(g.quiz?.length >= MIN_QUIZ)) p.push(`${c.slug}-${c.grade}: вопросов ${g.quiz?.length}`);
    if (!(g.pairs?.length >= 4)) p.push(`${c.slug}-${c.grade}: пар ${g.pairs?.length}`);
  }
  for (const [slug, f] of Object.entries(files)) {
    for (const grade of Object.keys(f.grades)) if (!cells.some((c) => c.slug === slug && String(c.grade) === grade)) p.push(`${slug}: класса ${grade} нет в плане`);
  }
  report('клетки', p);
});

test('вопросы: 4 разных варианта, ответ среди них, есть тема и объяснение', () => {
  const p = [];
  for (const [slug, f] of Object.entries(files)) {
    for (const grade of Object.keys(f.grades)) {
      const raw = merged(slug, grade);
      const g = applyFixes(slug, grade, raw);
      const qs = new Set();
      const answers = new Set();
      for (const [i, x] of (g.quiz || []).entries()) {
        const at = `${slug}-${grade}-q${i + 1}`;
        if (!(x && str(x.t) && str(x.q) && str(x.e))) p.push(`${at}: тема, вопрос, объяснение`);
        if (!(Array.isArray(x?.o) && x.o.length === 4 && x.o.every(str))) p.push(`${at}: 4 варианта`);
        else if (new Set(x.o.map((o) => o.trim().toLowerCase())).size !== 4) p.push(`${at}: варианты повторяются`);
        if (!(Number.isInteger(x?.a) && x.a >= 0 && x.a < 4)) p.push(`${at}: номер ответа`);
        const key = String(x?.q || '').trim().toLowerCase();
        if (qs.has(key)) p.push(`${at}: вопрос повторяется`);
        qs.add(key); answers.add(x?.a);
      }
      if (answers.size < 2) p.push(`${slug}-${grade}: правильный ответ всегда на одном месте`);
      const pairs = g.pairs || [];
      if (!pairs.every((x) => Array.isArray(x) && x.length === 2 && x.every(str))) { p.push(`${slug}-${grade}: пары`); continue; }
      const terms = pairs.map((x) => x[0].trim().toLowerCase()), means = pairs.map((x) => x[1].trim().toLowerCase());
      if (new Set(terms).size !== terms.length) p.push(`${slug}-${grade}: термины повторяются`);
      if (new Set(means).size !== means.length) p.push(`${slug}-${grade}: значения повторяются`);
      const n = normalizeGrade(slug, Number(grade), raw);
      if (new Set([...n.quiz, ...n.pairs].map((x) => x.id)).size !== n.quiz.length + n.pairs.length) p.push(`${slug}-${grade}: id повторяются`);
    }
  }
  report('вопросы', p);
});

test('каждая правка критиков указывает на существующий вопрос или пару', () => {
  const p = [];
  for (const id of Object.keys(FIXES)) {
    const m = /^(.+)-(\d+)-([qp])(\d+)$/.exec(id);
    if (!m) { p.push(`${id}: формат ключа`); continue; }
    const g = merged(m[1], m[2]);
    const list = m[3] === 'q' ? g?.quiz : g?.pairs;
    if (!list?.[Number(m[4]) - 1]) p.push(`${id}: нет такого места`);
  }
  report('правки', p);
});

test('каждый пакет проверили три критика', () => {
  const p = [];
  for (const slug of slugs) {
    const r = REVIEW[slug] || {};
    for (const k of ['factcheck', 'methodist', 'editor']) if (r[k] !== 'pass') p.push(`${slug}: ${k}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.date || ''))) p.push(`${slug}: дата проверки`);
  }
  report('критики', p);
});
