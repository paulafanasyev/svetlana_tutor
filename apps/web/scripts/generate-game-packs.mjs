// Reproducible game-pack expansion (P0.3) for the mathematics family: math, algebra, geometry, prob.
// Every answer is COMPUTED in code (factually safe), options are 4 distinct values with a varied correct
// position. New questions are appended to more/<slug>.json so the critic-fix slots q1..q6 in packs/ never
// shift. Run: node scripts/generate-game-packs.mjs (from apps/web). buildGamePacks() is pure for tests.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { mergeMore } from '../src/data/games/subjects.js';

const PACKS = new URL('../src/data/games/packs/', import.meta.url);
const MORE = new URL('../src/data/games/more/', import.meta.url);
const TARGET = 100;
const SLUGS = ['math', 'algebra', 'geometry', 'prob'];

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Build a 4-option item from a correct value + distractor candidates; guarantees 4 distinct strings,
// varied answer position. Numeric answers pad with plausible neighbours, never schematic placeholders.
function mc(r, t, q, correct, distractors, e) {
  const c = String(correct);
  const numeric = c.trim() !== '' && Number.isFinite(Number(c));
  const opts = [c];
  const push = (s) => { const v = String(s); if (!opts.includes(v)) opts.push(v); };
  for (const d of distractors) push(d);
  let k = 1;
  while (opts.length < 4 && k < 50) {
    if (numeric) { push(Number(c) + k); const lo = Number(c) - k; if (lo > 0) push(lo); }
    k++;
  }
  const o = shuffle(r, opts.slice(0, 4));
  return { t, q, o, a: o.indexOf(c), e };
}
const near = (x) => [x + 1, x - 1 > 0 ? x - 1 : x + 2, x + 2];

// ---- per-slug template pools: make(r, grade) → item ----
const MATH = [
  (r, g) => { const a = int(r, 2, g <= 2 ? 9 : 50), b = int(r, 2, g <= 2 ? 9 : 50); return mc(r, 'Сложение', `Сколько будет ${a} + ${b}?`, a + b, near(a + b), `${a} + ${b} = ${a + b}.`); },
  (r, g) => { const a = int(r, 10, g <= 2 ? 18 : 99), b = int(r, 1, a - 1); return mc(r, 'Вычитание', `Сколько будет ${a} − ${b}?`, a - b, near(a - b), `${a} − ${b} = ${a - b}.`); },
  (r) => { const a = int(r, 2, 9), b = int(r, 2, 9); return mc(r, 'Табличное умножение', `Сколько будет ${a} × ${b}?`, a * b, [a * b + a, a * b - b > 0 ? a * b - b : a * b + 1, a + b], `${a} × ${b} = ${a * b}.`); },
  (r) => { const b = int(r, 2, 9), q = int(r, 2, 9), a = b * q; return mc(r, 'Табличное деление', `Сколько будет ${a} ÷ ${b}?`, q, near(q), `${a} ÷ ${b} = ${q}.`); },
  (r) => { const a = int(r, 3, 15), b = int(r, 3, 15); return mc(r, 'Периметр', `Прямоугольник ${a} см × ${b} см. Чему равен периметр (см)?`, 2 * (a + b), [a + b, a * b, 2 * (a + b) + 2], `P = 2 · (${a} + ${b}) = ${2 * (a + b)} см.`); },
  (r) => { const a = int(r, 3, 15), b = int(r, 3, 15); return mc(r, 'Площадь', `Прямоугольник ${a} см × ${b} см. Чему равна площадь (см²)?`, a * b, [2 * (a + b), a + b, a * b + a], `S = ${a} · ${b} = ${a * b} см².`); },
  (r) => { const a = int(r, 2, 12), b = int(r, 2, 9), c = int(r, 2, 9); return mc(r, 'Порядок действий', `Вычисли: ${a} + ${b} × ${c}.`, a + b * c, [(a + b) * c, a + b + c, a * b + c], `Сначала умножение: ${b} × ${c} = ${b * c}, затем ${a} + ${b * c} = ${a + b * c}.`); },
  (r) => { const n = int(r, 2, 20) * 2; return mc(r, 'Доли', `Чему равна половина от ${n}?`, n / 2, [n, n / 2 + 1, n * 2], `${n} ÷ 2 = ${n / 2}.`); },
  (r) => { const n = int(r, 2, 30) * 10; return mc(r, 'Проценты', `Найди 10% от ${n}.`, n / 10, [n, n / 10 + 10, n / 5], `10% = ${n} ÷ 10 = ${n / 10}.`); },
];
const ALGEBRA = [
  (r) => { const a = int(r, 2, 5), n = int(r, 2, 4); return mc(r, 'Степень с натуральным показателем', `Чему равно ${a} в степени ${n}?`, a ** n, [a * n, a ** n + a, a ** n - 1 > 0 ? a ** n - 1 : a ** n + 1], `${a}^${n} = ${a ** n}.`); },
  (r) => { const a = int(r, 2, 30), x = int(r, 2, 30), b = a + x; return mc(r, 'Линейные уравнения', `Реши: x + ${a} = ${b}. Чему равен x?`, x, near(x), `x = ${b} − ${a} = ${x}.`); },
  (r) => { const a = int(r, 2, 9), x = int(r, 2, 12), b = a * x; return mc(r, 'Линейные уравнения', `Реши: ${a}x = ${b}. Чему равен x?`, x, [x + 1, b, x - 1 > 0 ? x - 1 : x + 2], `x = ${b} ÷ ${a} = ${x}.`); },
  (r) => { const n = int(r, 2, 4); return mc(r, 'Квадратные корни', `Чему равен √${n * n}?`, n, [n * n, n + 1, n * 2], `√${n * n} = ${n}, так как ${n}² = ${n * n}.`); },
  (r) => { const a1 = int(r, 1, 8), d = int(r, 2, 6), n = int(r, 4, 8), an = a1 + (n - 1) * d; return mc(r, 'Арифметическая прогрессия', `a₁ = ${a1}, d = ${d}. Чему равен ${n}-й член?`, an, [a1 + n * d, an + d, an - d], `aₙ = ${a1} + ${n - 1} · ${d} = ${an}.`); },
  (r) => { const r1 = int(r, 1, 9), r2 = int(r, 1, 9); return mc(r, 'Теорема Виета', `Корни уравнения ${r1} и ${r2}. Чему равна их сумма?`, r1 + r2, [r1 * r2, r1 + r2 + 1, Math.abs(r1 - r2)], `Сумма корней = ${r1} + ${r2} = ${r1 + r2}.`); },
  (r) => { const a = int(r, 2, 6), k = int(r, 2, 6); return mc(r, 'Производная', `f(x) = ${a}x². Чему равна f′(${k})?`, 2 * a * k, [a * k * k, 2 * a * k + 1, a * k], `f′(x) = ${2 * a}x, f′(${k}) = ${2 * a * k}.`); },
  (r) => { const n = int(r, 2, 6); return mc(r, 'Логарифмы', `Чему равен log₂(${2 ** n})?`, n, [2 ** n, n + 1, 2 * n], `log₂(${2 ** n}) = ${n}, так как 2^${n} = ${2 ** n}.`); },
];
const GEOMETRY = [
  (r) => { const a = int(r, 30, 80), b = int(r, 30, 80); return mc(r, 'Треугольники', `Два угла треугольника ${a}° и ${b}°. Чему равен третий угол?`, 180 - a - b, [a + b, 180 - a, 90], `180 − ${a} − ${b} = ${180 - a - b}°.`); },
  (r) => { const a = int(r, 30, 150); return mc(r, 'Смежные углы', `Один из смежных углов ${a}°. Чему равен второй?`, 180 - a, [a, 90, 360 - a], `Смежные углы в сумме 180°: 180 − ${a} = ${180 - a}°.`); },
  (r) => { const a = int(r, 3, 15), b = int(r, 3, 15); return mc(r, 'Площадь треугольника', `Катеты ${a} см и ${b} см. Площадь прямоугольного треугольника (см²)?`, a * b / 2, [a * b, a + b, (a + b) / 2], `S = (${a} · ${b}) ÷ 2 = ${a * b / 2} см².`); },
  (r) => { const [a, b, c] = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]); return mc(r, 'Теорема Пифагора', `Катеты ${a} и ${b}. Чему равна гипотенуза?`, c, [a + b, c + 1, c - 1], `c² = ${a}² + ${b}² = ${c * c}, c = ${c}.`); },
  (r) => { const a = int(r, 2, 8), b = int(r, 2, 8), h = int(r, 2, 8); return mc(r, 'Объёмы тел', `Измерения прямоугольного параллелепипеда ${a}, ${b}, ${h} см. Объём (см³)?`, a * b * h, [2 * (a * b + b * h + a * h), a + b + h, a * b], `V = ${a} · ${b} · ${h} = ${a * b * h} см³.`); },
  (r) => { const a = int(r, 2, 9); return mc(r, 'Объёмы тел', `Ребро куба ${a} см. Чему равен объём куба (см³)?`, a ** 3, [a * a, 6 * a * a, a ** 3 + a], `V = a³ = ${a}³ = ${a ** 3} см³.`); },
];
const PROB = [
  (r) => { const a = int(r, 2, 12), b = int(r, 2, 12), c = int(r, 2, 12); const s = a + b + c; if (s % 3 !== 0) return PROB[0](r); return mc(r, 'Среднее арифметическое', `Среднее арифметическое чисел ${a}, ${b}, ${c}?`, s / 3, [s, Math.max(a, b, c), s / 3 + 1], `(${a} + ${b} + ${c}) ÷ 3 = ${s / 3}.`); },
  (r) => { const w = int(r, 1, 7), b = int(r, 1, 7), tot = w + b; return mc(r, 'Вероятность', `${w} белых и ${b} чёрных шаров. Вероятность достать белый?`, `${w}/${tot}`, [`${b}/${tot}`, `${w}/${tot + 1}`, `${w + 1}/${tot}`, `${w}/${tot + 2}`, `${b + 1}/${tot}`, `${w + 2}/${tot}`], `Белых ${w} из ${tot}: ${w}/${tot}.`); },
  (r) => { const n = int(r, 4, 10); return mc(r, 'Комбинаторика', `Сколькими способами выбрать 2 дежурных из ${n} учеников?`, n * (n - 1) / 2, [n * (n - 1), n, 2 * n], `C(${n},2) = ${n} · ${n - 1} ÷ 2 = ${n * (n - 1) / 2}.`); },
  (r) => { const a = int(r, 2, 15), b = int(r, 2, 15), c = int(r, 2, 15); return mc(r, 'Размах', `Размах ряда ${a}, ${b}, ${c}?`, Math.max(a, b, c) - Math.min(a, b, c), [Math.max(a, b, c), Math.min(a, b, c), a + b + c], `Размах = max − min = ${Math.max(a, b, c)} − ${Math.min(a, b, c)} = ${Math.max(a, b, c) - Math.min(a, b, c)}.`); },
];
const POOLS = { math: MATH, algebra: ALGEBRA, geometry: GEOMETRY, prob: PROB };

// Deterministic sample batch (independent of committed files) so tests can recompute every answer.
export function buildSample(seed = 1, perSlug = 40) {
  const r = rng(seed);
  const gradeFor = { math: 4, algebra: 9, geometry: 8, prob: 9 };
  const items = [];
  for (const slug of SLUGS) {
    for (let i = 0; i < perSlug; i++) {
      const it = POOLS[slug][i % POOLS[slug].length](r, gradeFor[slug]);
      if (it) items.push({ slug, ...it });
    }
  }
  return items;
}

const readPack = (slug) => JSON.parse(readFileSync(new URL(`${slug}.json`, PACKS), 'utf8'));
const readMore = (slug) => existsSync(new URL(`${slug}.json`, MORE)) ? JSON.parse(readFileSync(new URL(`${slug}.json`, MORE), 'utf8')) : { grades: {} };

export function buildGamePacks(seed = 5) {
  const r = rng(seed);
  const files = {};
  const stats = {};
  for (const slug of SLUGS) {
    const pack = readPack(slug);
    const more = readMore(slug);
    const grades = Object.keys(pack.grades);
    const mergedCount = grades.reduce((n, g) => n + (mergeMore(pack.grades[g], more.grades?.[g])?.quiz?.length || 0), 0);
    const need = Math.max(0, TARGET - mergedCount);
    const perCell = Math.ceil(need / grades.length);
    const outMore = { grades: { ...more.grades } };
    let addedTotal = 0;
    for (const g of grades) {
      const baseQuiz = mergeMore(pack.grades[g], more.grades?.[g])?.quiz || [];
      const seen = new Set(baseQuiz.map((q) => q.q.trim().toLowerCase()));
      const existingMoreQuiz = more.grades?.[g]?.quiz || [];
      const added = [];
      let guard = 0;
      while (added.length < perCell && guard < perCell * 120) {
        guard++;
        const item = pick(r, POOLS[slug])(r, Number(g));
        const key = item.q.trim().toLowerCase();
        if (seen.has(key)) continue;
        if (new Set(item.o.map((x) => x.toLowerCase())).size !== 4) continue;
        seen.add(key);
        added.push(item);
      }
      addedTotal += added.length;
      outMore.grades[g] = { ...(more.grades?.[g] || {}), quiz: [...existingMoreQuiz, ...added] };
    }
    files[slug] = outMore;
    stats[slug] = { before: mergedCount, added: addedTotal, after: mergedCount + addedTotal };
  }
  return { files, stats };
}

function main() {
  const { files, stats } = buildGamePacks();
  for (const slug of SLUGS) writeFileSync(new URL(`${slug}.json`, MORE), JSON.stringify(files[slug], null, 1) + '\n');
  console.log('Game packs expanded:', JSON.stringify(stats));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();