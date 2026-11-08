// Игровые паки математического семейства (P0.3): каждый сгенерированный ответ независимо пересчитывается
// из текста вопроса, варианты различны (4), правильный ответ на месте; объём паков ≥100 после расширения.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSample, buildGamePacks } from '../../scripts/generate-game-packs.mjs';

const nums = (s) => (String(s).match(/\d+/g) || []).map(Number);
const VERIFY = {
  'Сложение': (p) => { const [a, b] = nums(p); return String(a + b); },
  'Вычитание': (p) => { const [a, b] = nums(p); return String(a - b); },
  'Табличное умножение': (p) => { const [a, b] = nums(p); return String(a * b); },
  'Табличное деление': (p) => { const [a, b] = nums(p); return String(a / b); },
  'Периметр': (p) => { const [a, b] = nums(p); return String(2 * (a + b)); },
  'Площадь': (p) => { const [a, b] = nums(p); return String(a * b); },
  'Порядок действий': (p) => { const [a, b, c] = nums(p); return String(a + b * c); },
  'Доли': (p) => String(nums(p)[0] / 2),
  'Проценты': (p) => String(Number(p.match(/10% от (\d+)/)[1]) / 10),
  'Степень с натуральным показателем': (p) => { const [a, n] = nums(p); return String(a ** n); },
  'Линейные уравнения': (p) => { const m = p.match(/x \+ (\d+) = (\d+)/); if (m) return String(Number(m[2]) - Number(m[1])); const n = p.match(/(\d+)x = (\d+)/); return String(Number(n[2]) / Number(n[1])); },
  'Квадратные корни': (p) => String(Math.sqrt(nums(p)[0])),
  'Арифметическая прогрессия': (p) => { const m = p.match(/a₁ = (\d+), d = (\d+).*?(\d+)-й/); return String(Number(m[1]) + (Number(m[3]) - 1) * Number(m[2])); },
  'Теорема Виета': (p) => { const m = p.match(/Корни уравнения (\d+) и (\d+)/); return String(Number(m[1]) + Number(m[2])); },
  'Производная': (p) => { const m = p.match(/f\(x\) = (\d+)x².*?f′\((\d+)\)/); return String(2 * Number(m[1]) * Number(m[2])); },
  'Логарифмы': (p) => String(Math.log2(Number(p.match(/log₂\((\d+)\)/)[1]))),
  'Треугольники': (p) => { const m = p.match(/угла треугольника (\d+)° и (\d+)°/); return String(180 - Number(m[1]) - Number(m[2])); },
  'Смежные углы': (p) => String(180 - Number(p.match(/смежных углов (\d+)°/)[1])),
  'Площадь треугольника': (p) => { const m = p.match(/Катеты (\d+) см и (\d+) см/); return String(Number(m[1]) * Number(m[2]) / 2); },
  'Теорема Пифагора': (p) => { const [a, b] = nums(p); return String(Math.sqrt(a * a + b * b)); },
  'Объёмы тел': (p) => { if (/Ребро куба/.test(p)) return String(nums(p)[0] ** 3); const [a, b, h] = nums(p); return String(a * b * h); },
  'Среднее арифметическое': (p) => { const [a, b, c] = nums(p); return String((a + b + c) / 3); },
  'Вероятность': (p) => { const m = p.match(/(\d+) белых и (\d+) чёрных/); const w = Number(m[1]), b = Number(m[2]); return `${w}/${w + b}`; },
  'Комбинаторика': (p) => { const n = Number(p.match(/из (\d+) учеников/)[1]); return String(n * (n - 1) / 2); },
  'Размах': (p) => { const [a, b, c] = nums(p); return String(Math.max(a, b, c) - Math.min(a, b, c)); },
};

test('выборка детерминирована', () => {
  assert.deepEqual(buildSample(1), buildSample(1));
});

test('каждый ответ пересчитывается из текста, 4 различных варианта, ответ на месте', () => {
  const items = buildSample(7, 60);
  assert.ok(items.length >= 200, `выборка ${items.length}`);
  const p = [];
  const seenSlug = new Set();
  for (const it of items) {
    seenSlug.add(it.slug);
    const fn = VERIFY[it.t];
    if (!fn) { p.push(`${it.slug}: нет проверки для «${it.t}»`); continue; }
    if (!(Array.isArray(it.o) && it.o.length === 4 && new Set(it.o.map((x) => x.toLowerCase())).size === 4)) { p.push(`${it.slug}/${it.t}: варианты не 4 различных`); continue; }
    if (!(Number.isInteger(it.a) && it.a >= 0 && it.a < 4)) { p.push(`${it.slug}/${it.t}: номер ответа`); continue; }
    const expected = fn(it.q);
    if (it.o[it.a] !== expected) p.push(`${it.slug}/${it.t}: ответ «${it.o[it.a]}», ожидалось «${expected}» (${it.q})`);
  }
  assert.deepEqual([...seenSlug].sort(), ['algebra', 'geometry', 'math', 'prob']);
  assert.deepEqual(p, []);
});

test('расширение доводит паки до ≥100 и детерминировано', () => {
  const a = buildGamePacks();
  const b = buildGamePacks();
  assert.deepEqual(a.stats, b.stats);
  for (const slug of ['math', 'algebra', 'geometry', 'prob']) assert.ok(a.stats[slug].after >= 100, `${slug}: ${a.stats[slug].after}`);
});