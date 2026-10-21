// Регрессия по всей сетке 1–11: у каждого предмета учебного плана (часы > 0) есть программа
// с непустым содержанием и непустыми предметными результатами. Исключения перечислены явно.
// Тест читает статичные файлы корпуса; то, что плагины подставляют при сборке из КонсультантПлюс,
// здесь не учитывается, поэтому без сети программа тоже должна быть полной (это и есть запасной вариант).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLANS, MAP } from './fopPlan.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.env.FOP_DATA_DIR || path.join(here, '../../data/fop');
const fopSrc = fs.readFileSync(path.join(here, 'fop.js'), 'utf8');
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const isProgram = (x) => x && typeof x === 'object' && typeof x.id === 'string' && typeof x.subject === 'string' && Number.isInteger(x.grade) && Array.isArray(x.sections);
const isResultsMap = (x) => x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length > 0 && Object.values(x).every((v) => Array.isArray(v) && v.every((s) => typeof s === 'string'));

// Как в fop.js: одна программа на несколько классов.
const EXPAND = { 'music_ooo.json': [5, 6, 7, 8].map((g) => [g, `music-ooo-${g}`]), 'obzr_soo.json': [10, 11].map((g) => [g, `obzr-soo-${g}`]) };
// Явно разрешённые пробелы в результатах: «предмет|класс» -> причина.
const NO_RESULTS_OK = {
  'Обществознание|10': 'новая программа (приказ № 729), результаты подставляет плагин virtual:chinese-frp при сборке',
  'Обществознание|11': 'в 2026/27 учебном году 11 класс учится по прежней программе, результатов в ФОП нет',
};

const programFiles = files.filter((f) => { const x = read(f); return Array.isArray(x) && x.length > 0 && x.every(isProgram); });
const imported = (f) => fopSrc.includes(`data/fop/${f}'`);
const maps = Object.assign({}, ...files.filter((f) => imported(f) && isResultsMap(read(f))).map(read));
const nooMusic = files.includes('noo_music_results.json') ? read('noo_music_results.json') : { general: [] };
const programs = programFiles.filter(imported).flatMap((f) => (EXPAND[f] ? EXPAND[f].map(([g, id]) => ({ ...read(f)[0], id, grade: g })) : read(f)));
const resultsOf = (p) => (p.results?.length ? p.results : /^music-[1-4]$/.test(p.id) ? nooMusic.general : maps[p.id] || maps[p.id.replace(/-\d+$/, '')] || []);
const find = (s, g) => { const x = MAP[s]; return x ? programs.filter((p) => p.grade === g && (p.subject === x || p.subject.startsWith(`${x}: `))) : []; };

test('каждый файл программ корпуса подключён в fop.js', () => {
  assert.ok(programFiles.length > 0, `в ${dir} не найдено файлов программ`);
  assert.deepEqual(programFiles.filter((f) => !imported(f)), []);
});

test('сетка 1–11: у каждого предмета плана есть программа с содержанием и результатами', () => {
  const gaps = [];
  let checked = 0;
  for (const [level, plan] of Object.entries(PLANS)) {
    plan.grades.forEach((g, gi) => {
      for (const [s, hours] of plan.rows) {
        if (!(hours[gi] > 0)) continue;
        checked++;
        if (!MAP[s]) { gaps.push(`${level} ${g}: «${s}» нет в MAP`); continue; }
        const found = find(s, g);
        if (!found.length) { gaps.push(`${level} ${g}: «${s}» нет программы`); continue; }
        for (const p of found) {
          const topics = p.sections.reduce((n, x) => n + (x?.topics?.length || 0), 0);
          if (!p.sections.length || !topics) gaps.push(`${level} ${g}: ${p.id} пустое содержание`);
          if (!resultsOf(p).length && !NO_RESULTS_OK[`${s}|${g}`]) gaps.push(`${level} ${g}: ${p.id} нет результатов`);
        }
      }
    });
  }
  assert.ok(checked > 120, `проверено слишком мало ячеек: ${checked}`);
  assert.deepEqual(gaps, []);
});

test('id программ уникальны', () => {
  const seen = new Set(), dup = [];
  for (const p of programs) { if (seen.has(p.id)) dup.push(p.id); seen.add(p.id); }
  assert.deepEqual(dup, []);
});
