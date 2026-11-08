// Банк упражнений (P0.3): генерация детерминирована, объём 600+, ответы независимо пересчитываются
// из текста задания, матрица покрытия синхронизирована с банком (построчные счётчики и сумма индекса).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPracticeBank } from '../../scripts/generate-practice-bank.mjs';

const { bank, coverage, stats } = buildPracticeBank();
const gen = bank.exercises.filter((e) => e.id.includes('-gen-'));
const nums = (s) => (String(s).match(/\d+/g) || []).map(Number);

// Independent recomputation of the expected answer from the prompt text, keyed by topic.
const VERIFY = {
  'Сложение': (p) => { const [a, b] = nums(p); return String(a + b); },
  'Вычитание': (p) => { const [a, b] = nums(p); return String(a - b); },
  'Умножение': (p) => { const [a, b] = nums(p); return String(a * b); },
  'Деление': (p) => { const [a, b] = nums(p); return String(a / b); },
  'Порядок действий': (p) => { const [a, b, c] = nums(p); return String(a + b * c); },
  'Периметр': (p) => { const [a, b] = nums(p); return String(2 * (a + b)); },
  'Площадь': (p) => { const [a, b] = nums(p); return String(a * b); },
  'Доли': (p) => String(nums(p)[0] / 2),
  'Проценты': (p) => String(Number(p.match(/10% от (\d+)/)[1]) / 10),
  'Линейные уравнения': (p) => {
    const m = p.match(/x \+ (\d+) = (\d+)/);
    if (m) return String(Number(m[2]) - Number(m[1]));
    const n = p.match(/(\d+)x = (\d+)/);
    return String(Number(n[2]) / Number(n[1]));
  },
  'Выражения': (p) => { const m = p.match(/3a \+ (\d+) при a = (\d+)/); return String(3 * Number(m[2]) + Number(m[1])); },
  'Прогрессии': (p) => { const m = p.match(/a₁ = (\d+), разность d = (\d+). Найди (\d+)-й/); return String(Number(m[1]) + (Number(m[3]) - 1) * Number(m[2])); },
  'Квадратные уравнения': (p) => { const m = p.match(/корни (\d+) и (\d+)/); return String(Number(m[1]) + Number(m[2])); },
  'Площадь треугольника': (p) => { const m = p.match(/катетами (\d+) см и (\d+) см/); return String(Number(m[1]) * Number(m[2]) / 2); },
  'Теорема Пифагора': (p) => { const [a, b] = nums(p); return String(Math.sqrt(a * a + b * b)); },
  'Объём': (p) => String(nums(p)[0] ** 3),
  'Углы треугольника': (p) => { const m = p.match(/равны (\d+)° и (\d+)°/); return String(180 - Number(m[1]) - Number(m[2])); },
  'Вероятность': (p) => { const m = p.match(/(\d+) белых и (\d+) чёрных/); const w = Number(m[1]), b = Number(m[2]); return `${w}/${w + b}`; },
  'Комбинаторика': (p) => { const n = Number(p.match(/из (\d+) учеников/)[1]); return String(n * (n - 1) / 2); },
  'Среднее арифметическое': (p) => { const [a, b, c] = nums(p); return String((a + b + c) / 3); },
};

test('генерация детерминирована', () => {
  assert.deepEqual(buildPracticeBank().stats, stats);
  assert.deepEqual(buildPracticeBank().bank.exercises, bank.exercises);
});

test('объём 600+, классы 1–11, уникальные id, есть текст/ответ/объяснение', () => {
  assert.ok(stats.total >= 600, `всего ${stats.total}`);
  assert.equal(bank.exerciseCount, bank.exercises.length);
  assert.deepEqual([...new Set(bank.exercises.map((e) => e.grade))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const ids = new Set();
  for (const e of bank.exercises) {
    assert.ok(e.prompt && e.answer && e.explanation, e.id);
    assert.ok(!ids.has(e.id), `дубль ${e.id}`);
    ids.add(e.id);
  }
});

test('каждый сгенерированный ответ независимо пересчитывается из текста', () => {
  assert.ok(gen.length > 400, `сгенерировано ${gen.length}`);
  const p = [];
  for (const e of gen) {
    const fn = VERIFY[e.topic];
    if (!fn) { p.push(`${e.id}: нет проверки для темы «${e.topic}»`); continue; }
    const expected = fn(e.prompt);
    if (expected !== e.answer) p.push(`${e.id}: ответ ${e.answer}, ожидалось ${expected}`);
  }
  assert.deepEqual(p, []);
});

test('матрица покрытия синхронизирована с банком', () => {
  const foreign = new Set(['english-language', 'german-language', 'french-language', 'spanish-language', 'chinese-language']);
  const countFor = (grade, subject) => bank.exercises.filter((e) => e.grade === grade && (e.subject === subject || (subject === 'foreign-language' && foreign.has(e.subject)))).length;
  const fields = ['federalBibliographyRecordCount', 'verifiedOfficialLessonIndexCount', 'officialWorkingProgramCount', 'officialExtracurricularProgramCount', 'locallyStoredOriginalTaskCount', 'openReferenceResourceCount', 'officialExamResourceCount', 'publicLessonPlatformResourceCount', 'additionalOfficialSubjectResourceCount', 'officialPlatformEntryPointCount'];
  for (const row of coverage.rows) {
    assert.equal(row.locallyStoredOriginalTaskCount, countFor(row.grade, row.subject), `${row.grade}/${row.subject}`);
    assert.equal(row.indexedResourceCount, fields.reduce((t, f) => t + (row[f] || 0), 0), `${row.grade}/${row.subject}: сумма`);
    assert.equal(row.completeCoverage, 'NOT_PROVEN');
  }
  assert.equal(coverage.summary.originalPracticeTaskCount, bank.exercises.length);
});