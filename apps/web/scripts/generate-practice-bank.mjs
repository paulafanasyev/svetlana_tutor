// Reproducible practice-bank expansion (P0.3). Adds verified, grade-appropriate exercises whose answers
// are COMPUTED in code (mathematics is factually safe by construction), then synchronizes the coverage
// matrix so locallyStoredOriginalTaskCount and indexedResourceCount stay consistent with the bank.
// Run: node scripts/generate-practice-bank.mjs   (from apps/web)
// buildPracticeBank() is pure (no writes) so tests can verify integrity and determinism.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DIR = new URL('../../../data/school-materials/', import.meta.url);
const readJson = (name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8'));
const TARGET = 600;
const TODAY = '2026-11-08';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// Subjects that already have indexedResourceCount > 0 in the matrix (adding tasks keeps status stable).
const SAFE_SUBJECTS = {
  1: ['mathematics'], 2: ['mathematics'], 3: ['mathematics'], 4: ['mathematics'],
  5: ['mathematics'], 6: ['mathematics'],
  7: ['algebra', 'geometry', 'probability-statistics'],
  8: ['algebra', 'geometry', 'probability-statistics'],
  9: ['algebra', 'geometry', 'probability-statistics'],
  10: ['algebra', 'geometry'],
  11: ['algebra', 'geometry', 'probability-statistics'],
};

// ---- Templates: each make(r, grade) computes the answer in code. difficulty: basic/advanced. ----
const MATH = [
  (r, g) => { // addition word problem
    const a = int(r, g <= 2 ? 2 : 10, g <= 2 ? 9 : 99), b = int(r, 2, g <= 2 ? 9 : 99);
    return { topic: 'Сложение', prompt: `В первой корзине ${a} яблок, во второй ${b}. Сколько яблок в двух корзинах вместе?`, answer: String(a + b), explanation: `Складываем: ${a} + ${b} = ${a + b}.`, difficulty: 'basic' };
  },
  (r, g) => { // subtraction
    const a = int(r, g <= 2 ? 10 : 30, g <= 2 ? 18 : 150), b = int(r, 1, a - 1);
    return { topic: 'Вычитание', prompt: `У Маши было ${a} рублей. Она потратила ${b} рублей. Сколько рублей осталось?`, answer: String(a - b), explanation: `Вычитаем: ${a} − ${b} = ${a - b}.`, difficulty: 'basic' };
  },
  (r, g) => { // multiplication table
    const a = int(r, 2, 9), b = int(r, 2, 9);
    return { topic: 'Умножение', prompt: `Вычисли: ${a} × ${b}.`, answer: String(a * b), explanation: `Табличное умножение: ${a} × ${b} = ${a * b}.`, difficulty: 'basic' };
  },
  (r) => { // exact division
    const b = int(r, 2, 9), q = int(r, 2, 9), a = b * q;
    return { topic: 'Деление', prompt: `Вычисли: ${a} ÷ ${b}.`, answer: String(q), explanation: `${a} ÷ ${b} = ${q}, потому что ${b} × ${q} = ${a}.`, difficulty: 'basic' };
  },
  (r) => { // order of operations
    const a = int(r, 2, 20), b = int(r, 2, 9), c = int(r, 2, 9);
    return { topic: 'Порядок действий', prompt: `Вычисли: ${a} + ${b} × ${c}.`, answer: String(a + b * c), explanation: `Сначала умножение: ${b} × ${c} = ${b * c}, затем ${a} + ${b * c} = ${a + b * c}.`, difficulty: 'basic' };
  },
  (r) => { // rectangle perimeter
    const a = int(r, 3, 20), b = int(r, 3, 20);
    return { topic: 'Периметр', prompt: `Прямоугольник со сторонами ${a} см и ${b} см. Найди его периметр в сантиметрах.`, answer: String(2 * (a + b)), explanation: `Периметр = 2 × (${a} + ${b}) = ${2 * (a + b)} см.`, difficulty: 'basic' };
  },
  (r) => { // rectangle area
    const a = int(r, 3, 20), b = int(r, 3, 20);
    return { topic: 'Площадь', prompt: `Прямоугольник со сторонами ${a} см и ${b} см. Найди его площадь в квадратных сантиметрах.`, answer: String(a * b), explanation: `Площадь = ${a} × ${b} = ${a * b} см².`, difficulty: 'basic' };
  },
  (r) => { // fraction of a number
    const n = int(r, 2, 20) * 2;
    return { topic: 'Доли', prompt: `Сколько будет половина от ${n}?`, answer: String(n / 2), explanation: `Половина — это ${n} ÷ 2 = ${n / 2}.`, difficulty: 'basic' };
  },
  (r) => { // ten percent
    const n = int(r, 2, 50) * 10;
    return { topic: 'Проценты', prompt: `Найди 10% от ${n}.`, answer: String(n / 10), explanation: `10% — это десятая часть: ${n} ÷ 10 = ${n / 10}.`, difficulty: 'advanced' };
  },
];

const ALGEBRA = [
  (r) => { // x + a = b
    const a = int(r, 2, 40), x = int(r, 2, 40), b = a + x;
    return { topic: 'Линейные уравнения', prompt: `Реши уравнение: x + ${a} = ${b}. Чему равен x?`, answer: String(x), explanation: `x = ${b} − ${a} = ${x}.`, difficulty: 'basic' };
  },
  (r) => { // a*x = b
    const a = int(r, 2, 9), x = int(r, 2, 12), b = a * x;
    return { topic: 'Линейные уравнения', prompt: `Реши уравнение: ${a}x = ${b}. Чему равен x?`, answer: String(x), explanation: `x = ${b} ÷ ${a} = ${x}.`, difficulty: 'basic' };
  },
  (r) => { // evaluate expression
    const a = int(r, 2, 9), n = int(r, 2, 12), val = 3 * n + a;
    return { topic: 'Выражения', prompt: `Вычисли значение выражения 3a + ${a} при a = ${n}.`, answer: String(val), explanation: `3 × ${n} + ${a} = ${3 * n} + ${a} = ${val}.`, difficulty: 'basic' };
  },
  (r) => { // arithmetic progression term
    const a1 = int(r, 1, 10), d = int(r, 2, 7), n = int(r, 4, 10), an = a1 + (n - 1) * d;
    return { topic: 'Прогрессии', prompt: `Арифметическая прогрессия: a₁ = ${a1}, разность d = ${d}. Найди ${n}-й член.`, answer: String(an), explanation: `aₙ = a₁ + (n−1)d = ${a1} + ${n - 1} × ${d} = ${an}.`, difficulty: 'advanced' };
  },
  (r) => { // quadratic roots sum (Vieta)
    const r1 = int(r, 1, 9), r2 = int(r, 1, 9), p = r1 + r2, q = r1 * r2;
    return { topic: 'Квадратные уравнения', prompt: `Уравнение x² − ${p}x + ${q} = 0 имеет корни ${r1} и ${r2}. Чему равна сумма корней?`, answer: String(p), explanation: `По теореме Виета сумма корней равна ${p} (коэффициент при x с противоположным знаком).`, difficulty: 'advanced' };
  },
];

const GEOMETRY = [
  (r) => { // right triangle area
    const a = int(r, 3, 20), b = int(r, 3, 20), area = a * b / 2;
    return { topic: 'Площадь треугольника', prompt: `Прямоугольный треугольник с катетами ${a} см и ${b} см. Найди его площадь в см².`, answer: String(area), explanation: `Площадь = (${a} × ${b}) ÷ 2 = ${area} см².`, difficulty: 'basic' };
  },
  (r) => { // Pythagoras with known triples
    const [a, b, c] = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
    return { topic: 'Теорема Пифагора', prompt: `Катеты прямоугольного треугольника ${a} и ${b}. Найди гипотенузу.`, answer: String(c), explanation: `c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, значит c = ${c}.`, difficulty: 'advanced' };
  },
  (r) => { // cube volume
    const a = int(r, 2, 10);
    return { topic: 'Объём', prompt: `Ребро куба равно ${a} см. Найди объём куба в см³.`, answer: String(a ** 3), explanation: `Объём куба = a³ = ${a}³ = ${a ** 3} см³.`, difficulty: 'advanced' };
  },
  (r) => { // triangle angle sum
    const a = int(r, 30, 80), b = int(r, 30, 80), c = 180 - a - b;
    return { topic: 'Углы треугольника', prompt: `В треугольнике два угла равны ${a}° и ${b}°. Найди третий угол в градусах.`, answer: String(c), explanation: `Сумма углов треугольника 180°: 180 − ${a} − ${b} = ${c}°.`, difficulty: 'basic' };
  },
];

const PROB = [
  (r) => { // classical probability
    const w = int(r, 1, 8), b = int(r, 1, 8), total = w + b;
    return { topic: 'Вероятность', prompt: `В мешке ${w} белых и ${b} чёрных шаров. Найди вероятность достать белый шар (в виде дроби).`, answer: `${w}/${total}`, explanation: `Белых ${w} из ${total} шаров, вероятность = ${w}/${total}.`, difficulty: 'advanced' };
  },
  (r) => { // combinations C(n,2)
    const n = int(r, 4, 12), c = n * (n - 1) / 2;
    return { topic: 'Комбинаторика', prompt: `Сколькими способами можно выбрать 2 дежурных из ${n} учеников?`, answer: String(c), explanation: `C(${n},2) = ${n} × ${n - 1} ÷ 2 = ${c}.`, difficulty: 'advanced' };
  },
  (r) => { // mean
    const a = int(r, 2, 10), b = int(r, 2, 10), c = int(r, 2, 10);
    const sum = a + b + c;
    if (sum % 3 !== 0) return PROB[0](r); // keep integer mean
    return { topic: 'Среднее арифметическое', prompt: `Найди среднее арифметическое чисел ${a}, ${b} и ${c}.`, answer: String(sum / 3), explanation: `(${a} + ${b} + ${c}) ÷ 3 = ${sum} ÷ 3 = ${sum / 3}.`, difficulty: 'basic' };
  },
];

const POOLS = { mathematics: MATH, algebra: ALGEBRA, geometry: GEOMETRY, 'probability-statistics': PROB };

// Generate `count` unique exercises, cycling grades 1–11 and safe subjects, computing every answer.
export function generateExercises(count, seed = 23) {
  const r = rng(seed);
  const out = [];
  const seen = new Set();
  const seq = {};
  let guard = 0;
  let gradeIdx = 0;
  while (out.length < count && guard < count * 80) {
    guard++;
    const grade = (gradeIdx % 11) + 1;
    gradeIdx++;
    const subject = pick(r, SAFE_SUBJECTS[grade]);
    const t = pick(r, POOLS[subject])(r, grade);
    if (!t || !t.answer) continue;
    const key = `${grade}|${subject}|${t.prompt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    seq[grade] = (seq[grade] || 0) + 1;
    out.push({ grade, subject, topic: t.topic, prompt: t.prompt, answer: t.answer, explanation: t.explanation, difficulty: t.difficulty, id: `g${grade}-gen-${String(seq[grade]).padStart(3, '0')}` });
  }
  return out;
}

const foreignLanguages = new Set(['english-language', 'german-language', 'french-language', 'spanish-language', 'chinese-language']);
const taskCountFor = (exercises, grade, subject) => exercises.filter((e) => e.grade === grade && (e.subject === subject || (subject === 'foreign-language' && foreignLanguages.has(e.subject)))).length;

export function buildPracticeBank() {
  const bank = readJson('original-school-practice-bank.json');
  const coverage = readJson('school-curriculum-coverage.json');
  const need = Math.max(0, TARGET - bank.exercises.length);
  const added = generateExercises(need * 3 + 30, 23);
  const existingIds = new Set(bank.exercises.map((e) => e.id));
  const existingPrompts = new Set(bank.exercises.map((e) => `${e.grade}|${e.subject}|${e.prompt}`));
  const exercises = [...bank.exercises];
  for (const e of added) {
    if (exercises.length >= TARGET) break;
    if (existingIds.has(e.id) || existingPrompts.has(`${e.grade}|${e.subject}|${e.prompt}`)) continue;
    existingIds.add(e.id);
    existingPrompts.add(`${e.grade}|${e.subject}|${e.prompt}`);
    exercises.push(e);
  }
  const newBank = { ...bank, exercises, exerciseCount: exercises.length, lastExpandedAt: TODAY };

  // Synchronize the coverage matrix: per-row task count and the indexed-resource sum that includes it.
  const rows = coverage.rows.map((row) => {
    const count = taskCountFor(exercises, row.grade, row.subject);
    const delta = count - (row.locallyStoredOriginalTaskCount || 0);
    return { ...row, locallyStoredOriginalTaskCount: count, indexedResourceCount: (row.indexedResourceCount || 0) + delta };
  });
  const summary = {
    ...coverage.summary,
    originalPracticeTaskCount: exercises.length,
    rowsWithAtLeastOneOriginalPracticeTask: rows.filter((row) => row.locallyStoredOriginalTaskCount > 0).length,
  };
  const newCoverage = { ...coverage, rows, summary };
  validate(newBank, newCoverage);
  return { bank: newBank, coverage: newCoverage, stats: { total: exercises.length, added: exercises.length - bank.exercises.length } };
}

function validate(bank, coverage) {
  const fail = (m) => { throw new Error(`practice-bank validation: ${m}`); };
  const ids = new Set();
  for (const e of bank.exercises) {
    if (!(e.prompt && e.answer && e.explanation)) fail(`${e.id}: missing text`);
    if (ids.has(e.id)) fail(`${e.id}: duplicate id`);
    ids.add(e.id);
    if (!(e.grade >= 1 && e.grade <= 11)) fail(`${e.id}: grade`);
  }
  if (bank.exerciseCount !== bank.exercises.length) fail('exerciseCount mismatch');
  const grades = [...new Set(bank.exercises.map((e) => e.grade))].sort((a, b) => a - b);
  if (JSON.stringify(grades) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])) fail('grades not 1-11');
  const fields = ['federalBibliographyRecordCount', 'verifiedOfficialLessonIndexCount', 'officialWorkingProgramCount', 'officialExtracurricularProgramCount', 'locallyStoredOriginalTaskCount', 'openReferenceResourceCount', 'officialExamResourceCount', 'publicLessonPlatformResourceCount', 'additionalOfficialSubjectResourceCount', 'officialPlatformEntryPointCount'];
  for (const row of coverage.rows) {
    const count = taskCountFor(bank.exercises, row.grade, row.subject);
    if (row.locallyStoredOriginalTaskCount !== count) fail(`${row.grade}/${row.subject}: task count desync`);
    const sum = fields.reduce((total, f) => total + (row[f] || 0), 0);
    if (row.indexedResourceCount !== sum) fail(`${row.grade}/${row.subject}: indexed sum desync`);
  }
}

function main() {
  const { bank, coverage, stats } = buildPracticeBank();
  writeFileSync(new URL('original-school-practice-bank.json', DIR), JSON.stringify(bank, null, 2) + '\n');
  writeFileSync(new URL('school-curriculum-coverage.json', DIR), JSON.stringify(coverage, null, 2) + '\n');
  console.log('Practice bank expanded:', JSON.stringify(stats));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();