// Geometry generators, grades 7-9 (planimetry per ФОП). Plug into the problems.js
// registry; every answer is checked exactly (rational or canonical k√m radical).
import { Q } from './rational.js';

// Local copies of the small display/random helpers (kept independent of problems.js
// to avoid a circular module dependency).
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const L = (ru, en) => ({ ru, en });
const H = (q) => q.toHuman();

// Extract the largest square factor: n = k²·m with m squarefree. BigInt only.
export function simplifyRadical(n) {
  n = BigInt(n);
  if (n <= 0n) throw new Error('radicand');
  let k = 1n, m = n, i = 2n;
  while (i * i <= m) {
    while (m % (i * i) === 0n) { m /= i * i; k *= i; }
    i += 1n;
  }
  return { k, m };
}

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [11, 60, 61]];

export const GEOMETRY_TOPICS = {
  7: [
    { id: 'geo_angles', title: L('Углы треугольника', 'Triangle angles') },
    { id: 'geo_isosceles', title: L('Равнобедренный треугольник', 'Isosceles triangle') },
    { id: 'geo_equilateral', title: L('Равносторонний треугольник', 'Equilateral triangle') },
  ],
  8: [
    { id: 'geo_pythagoras', title: L('Теорема Пифагора', 'Pythagorean theorem') },
    { id: 'geo_pythagoras_rad', title: L('Пифагор: точный корень', 'Pythagoras: exact radical') },
    { id: 'geo_triangle_area', title: L('Площадь треугольника', 'Triangle area') },
    { id: 'geo_parallelogram', title: L('Параллелограмм', 'Parallelogram') },
    { id: 'geo_trapezoid', title: L('Трапеция', 'Trapezoid') },
    { id: 'geo_quadrilateral', title: L('Четырёхугольники', 'Quadrilaterals') },
    { id: 'geo_similar', title: L('Подобие треугольников', 'Similar triangles') },
  ],
  9: [
    { id: 'geo_circle', title: L('Окружность и круг (ОГЭ)', 'Circle and disk') },
    { id: 'geo_circle_angles', title: L('Центральные и вписанные углы', 'Central and inscribed angles') },
  ],
};

export const GEOMETRY_GEN = {
  geo_angles(r) {
    const a = int(r, 20, 100), b = int(r, 20, 150 - a), c = 180 - a - b;
    return {
      prompt: L(`В треугольнике два угла равны ${a}° и ${b}°. Найди третий угол (в градусах).`, `Two angles of a triangle are ${a}° and ${b}°. Find the third angle in degrees.`),
      answer: { kind: 'number', value: String(c), unit: '°',
        mistakes: [
          { id: 'sum360', value: String(360 - a - b), note: L('Сумма углов треугольника — 180°, а не 360°.', 'Triangle angles sum to 180°, not 360°.') },
          { id: 'added', value: String(a + b), note: L('Это сумма двух данных углов. А третий — сколько?', 'That is the sum of the two given angles. What is the third?') },
        ] },
      hints: [
        L('Чему равна сумма всех углов любого треугольника?', 'What do all three angles of any triangle add up to?'),
        L('Сумма углов треугольника равна 180°.', 'The angles of a triangle sum to 180°.'),
        L(`Третий угол = 180 − ${a} − ${b}.`, `Third angle = 180 − ${a} − ${b}.`),
      ],
      solution: L(`180 − ${a} − ${b} = ${c}°`, `180 − ${a} − ${b} = ${c}°`),
      keywords: ['сумма', '180', 'угол', 'sum', 'angle'],
    };
  },
  geo_isosceles(r) {
    if (int(r, 0, 1) === 0) {
      const apex = int(r, 20, 140), base = new Q(BigInt(180 - apex), 2n);
      return {
        prompt: L(`В равнобедренном треугольнике угол при вершине равен ${apex}°. Найди угол при основании (в градусах).`, `The apex angle of an isosceles triangle is ${apex}°. Find a base angle in degrees.`),
        answer: { kind: 'number', value: base.toString(), unit: '°',
          mistakes: [{ id: 'no_halve', value: String(180 - apex), note: L('Углов при основании два, и они равны. Раздели остаток на 2.', 'There are two equal base angles. Divide the remainder by 2.') }] },
        hints: [
          L('Что ты знаешь про углы при основании равнобедренного треугольника?', 'What do you know about the base angles of an isosceles triangle?'),
          L('Углы при основании равны, а сумма всех углов — 180°.', 'The base angles are equal and all angles sum to 180°.'),
          L(`Один угол при основании = (180 − ${apex}) / 2.`, `One base angle = (180 − ${apex}) / 2.`),
        ],
        solution: L(`(180 − ${apex}) / 2 = ${H(base)}°`, `(180 − ${apex}) / 2 = ${H(base)}°`),
        keywords: ['основан', 'равны', '180', 'base', 'equal'],
      };
    }
    const base = int(r, 25, 80), apex = 180 - 2 * base;
    return {
      prompt: L(`В равнобедренном треугольнике угол при основании равен ${base}°. Найди угол при вершине (в градусах).`, `A base angle of an isosceles triangle is ${base}°. Find the apex angle in degrees.`),
      answer: { kind: 'number', value: String(apex), unit: '°',
        mistakes: [{ id: 'one_base', value: String(180 - base), note: L('Углов при основании два: вычти оба.', 'There are two base angles: subtract both.') }] },
      hints: [
        L('Сколько углов при основании и чему они равны?', 'How many base angles are there and what are they equal to?'),
        L('Оба угла при основании равны ${base}°.'.replace('${base}', String(base)), `Both base angles are ${base}°.`),
        L(`Угол при вершине = 180 − 2 · ${base}.`, `Apex angle = 180 − 2 × ${base}.`),
      ],
      solution: L(`180 − 2 · ${base} = ${apex}°`, `180 − 2 × ${base} = ${apex}°`),
      keywords: ['основан', 'вершин', 'равны', 'base', 'apex'],
    };
  },
  geo_equilateral(r) {
    const a = int(r, 3, 30);
    if (int(r, 0, 1) === 0) {
      return {
        prompt: L(`Сторона равностороннего треугольника равна ${a} см. Найди его периметр (в см).`, `A side of an equilateral triangle is ${a} cm. Find its perimeter in cm.`),
        answer: { kind: 'number', value: String(3 * a), unit: 'см',
          mistakes: [{ id: 'two_sides', value: String(2 * a), note: L('У треугольника три стороны, и все равны.', 'A triangle has three sides, all equal.') }] },
        hints: [
          L('Сколько сторон у равностороннего треугольника и что про них известно?', 'How many sides does an equilateral triangle have and what is true about them?'),
          L('Все три стороны равны.', 'All three sides are equal.'),
          L(`Периметр = ${a} · 3.`, `Perimeter = ${a} × 3.`),
        ],
        solution: L(`${a} · 3 = ${3 * a} см`, `${a} × 3 = ${3 * a} cm`),
        keywords: ['три', 'равны', 'периметр', 'three', 'equal', 'perimeter'],
      };
    }
    const p = 3 * a;
    return {
      prompt: L(`Периметр равностороннего треугольника равен ${p} см. Найди его сторону (в см).`, `The perimeter of an equilateral triangle is ${p} cm. Find its side in cm.`),
      answer: { kind: 'number', value: String(a), unit: 'см',
        mistakes: [{ id: 'halve', value: new Q(BigInt(p), 2n).toString(), note: L('Сторон три, а не две. Дели на 3.', 'There are three sides, not two. Divide by 3.') }] },
      hints: [
        L('Как связаны периметр и сторона равностороннего треугольника?', 'How are the perimeter and the side of an equilateral triangle related?'),
        L('Периметр — это три одинаковые стороны.', 'The perimeter is three identical sides.'),
        L(`Сторона = ${p} / 3.`, `Side = ${p} / 3.`),
      ],
      solution: L(`${p} / 3 = ${a} см`, `${p} / 3 = ${a} cm`),
      keywords: ['периметр', 'три', 'дел', 'perimeter', 'three', 'divide'],
    };
  },
  geo_pythagoras(r) {
    const [x, y, z] = pick(r, TRIPLES), k = int(r, 1, 4);
    const a = x * k, b = y * k, c = z * k;
    if (int(r, 0, 1) === 0) {
      return {
        prompt: L(`Катеты прямоугольного треугольника равны ${a} и ${b}. Найди гипотенузу.`, `The legs of a right triangle are ${a} and ${b}. Find the hypotenuse.`),
        answer: { kind: 'number', value: String(c),
          mistakes: [{ id: 'sum_legs', value: String(a + b), note: L('Гипотенуза — не сумма катетов. Теорема Пифагора: c² = a² + b².', 'The hypotenuse is not the sum of the legs. Pythagoras: c² = a² + b².') }] },
        hints: [
          L('Какая теорема связывает катеты и гипотенузу?', 'Which theorem relates the legs and the hypotenuse?'),
          L('Теорема Пифагора: c² = a² + b².', 'Pythagorean theorem: c² = a² + b².'),
          L(`c² = ${a}² + ${b}² = ${a * a} + ${b * b}. Извлеки квадратный корень.`, `c² = ${a}² + ${b}² = ${a * a} + ${b * b}. Take the square root.`),
        ],
        solution: L(`c² = ${a * a} + ${b * b} = ${c * c}; c = ${c}`, `c² = ${a * a} + ${b * b} = ${c * c}; c = ${c}`),
        keywords: ['пифагор', 'катет', 'гипотенуз', 'pythagor', 'leg', 'hypotenuse'],
      };
    }
    return {
      prompt: L(`Гипотенуза прямоугольного треугольника равна ${c}, один катет равен ${a}. Найди второй катет.`, `The hypotenuse of a right triangle is ${c} and one leg is ${a}. Find the other leg.`),
      answer: { kind: 'number', value: String(b),
        mistakes: [{ id: 'diff', value: String(c - a), note: L('Катет — не разность гипотенузы и катета. b² = c² − a².', 'A leg is not the difference. b² = c² − a².') }] },
      hints: [
        L('Как выразить катет через гипотенузу и другой катет?', 'How do you express a leg via the hypotenuse and the other leg?'),
        L('По теореме Пифагора: b² = c² − a².', 'By Pythagoras: b² = c² − a².'),
        L(`b² = ${c}² − ${a}² = ${c * c} − ${a * a}. Извлеки корень.`, `b² = ${c}² − ${a}² = ${c * c} − ${a * a}. Take the root.`),
      ],
      solution: L(`b² = ${c * c} − ${a * a} = ${b * b}; b = ${b}`, `b² = ${c * c} − ${a * a} = ${b * b}; b = ${b}`),
      keywords: ['пифагор', 'катет', 'квадрат', 'pythagor', 'leg', 'square'],
    };
  },
  geo_pythagoras_rad(r) {
    let a = int(r, 1, 12), b = int(r, 1, 12), s = a * a + b * b;
    while (Number.isInteger(Math.sqrt(s))) { b = int(r, 1, 12); s = a * a + b * b; }
    const { k, m } = simplifyRadical(s);
    const value = `${k}√${m}`;
    return {
      prompt: L(`Катеты прямоугольного треугольника равны ${a} и ${b}. Найди гипотенузу. Ответ запиши в точном виде k√m (например, 3√2).`, `The legs of a right triangle are ${a} and ${b}. Find the hypotenuse in exact form k√m (e.g. 3√2).`),
      answer: { kind: 'radical', value,
        mistakes: [{ id: 'sum_legs', value: String(a + b), note: L('Гипотенуза — не сумма катетов. c = √(a² + b²).', 'The hypotenuse is not the sum of the legs. c = √(a² + b²).') }] },
      hints: [
        L('Как найти гипотенузу по двум катетам?', 'How do you find the hypotenuse from two legs?'),
        L('c² = a² + b², значит c = √(a² + b²).', 'c² = a² + b², so c = √(a² + b²).'),
        L(`c = √(${a}² + ${b}²) = √${s}. Вынеси квадратный множитель из-под корня.`, `c = √(${a}² + ${b}²) = √${s}. Pull the square factor out of the root.`),
      ],
      solution: L(`c = √${s} = ${k}√${m}`, `c = √${s} = ${k}√${m}`),
      keywords: ['пифагор', 'корень', 'квадрат', 'pythagor', 'root', 'square'],
    };
  },
  geo_triangle_area(r) {
    const a = int(r, 2, 20), h = int(r, 2, 20), s = new Q(BigInt(a * h), 2n);
    return {
      prompt: L(`Основание треугольника равно ${a} см, высота, проведённая к нему, — ${h} см. Найди площадь (в см²).`, `A triangle has base ${a} cm and the corresponding height ${h} cm. Find its area in cm².`),
      answer: { kind: 'number', value: s.toString(), unit: 'см²',
        mistakes: [{ id: 'no_half', value: String(a * h), note: L('Площадь треугольника — половина произведения основания на высоту.', 'Triangle area is half of base times height.') }] },
      hints: [
        L('Как найти площадь треугольника по основанию и высоте?', 'How do you find a triangle’s area from base and height?'),
        L('S = (основание · высота) / 2.', 'S = (base × height) / 2.'),
        L(`S = (${a} · ${h}) / 2.`, `S = (${a} × ${h}) / 2.`),
      ],
      solution: L(`S = (${a} · ${h}) / 2 = ${H(s)} см²`, `S = (${a} × ${h}) / 2 = ${H(s)} cm²`),
      keywords: ['основан', 'высот', 'половин', 'base', 'height', 'half'],
    };
  },
  geo_parallelogram(r) {
    const a = int(r, 3, 20), h = int(r, 2, 15);
    if (int(r, 0, 1) === 0) {
      return {
        prompt: L(`Сторона параллелограмма равна ${a} см, высота к ней — ${h} см. Найди площадь (в см²).`, `A parallelogram has side ${a} cm and the corresponding height ${h} cm. Find its area in cm².`),
        answer: { kind: 'number', value: String(a * h), unit: 'см²',
          mistakes: [{ id: 'half', value: new Q(BigInt(a * h), 2n).toString(), note: L('Это площадь треугольника. У параллелограмма S = a · h, без половины.', 'That is a triangle’s area. A parallelogram has S = a × h, no half.') }] },
        hints: [
          L('Как найти площадь параллелограмма?', 'How do you find the area of a parallelogram?'),
          L('S = сторона · высота, проведённая к этой стороне.', 'S = side × the height to that side.'),
          L(`S = ${a} · ${h}.`, `S = ${a} × ${h}.`),
        ],
        solution: L(`S = ${a} · ${h} = ${a * h} см²`, `S = ${a} × ${h} = ${a * h} cm²`),
        keywords: ['сторон', 'высот', 'площад', 'side', 'height', 'area'],
      };
    }
    const ang = int(r, 30, 150), adj = 180 - ang;
    return {
      prompt: L(`Один угол параллелограмма равен ${ang}°. Найди соседний с ним угол (в градусах).`, `One angle of a parallelogram is ${ang}°. Find the adjacent angle in degrees.`),
      answer: { kind: 'number', value: String(adj), unit: '°',
        mistakes: [{ id: 'equal', value: String(ang), note: L('Равны противоположные углы, а соседние в сумме дают 180°.', 'Opposite angles are equal; adjacent ones sum to 180°.') }] },
      hints: [
        L('Как связаны соседние углы параллелограмма?', 'How are adjacent angles of a parallelogram related?'),
        L('Сумма соседних углов параллелограмма равна 180°.', 'Adjacent angles of a parallelogram sum to 180°.'),
        L(`Соседний угол = 180 − ${ang}.`, `Adjacent angle = 180 − ${ang}.`),
      ],
      solution: L(`180 − ${ang} = ${adj}°`, `180 − ${ang} = ${adj}°`),
      keywords: ['соседн', '180', 'противоположн', 'adjacent', 'opposite'],
    };
  },
  geo_trapezoid(r) {
    const a = int(r, 4, 20), b = int(r, 4, 20), h = int(r, 2, 12);
    if (int(r, 0, 1) === 0) {
      const s = new Q(BigInt((a + b) * h), 2n);
      return {
        prompt: L(`Основания трапеции равны ${a} см и ${b} см, высота — ${h} см. Найди площадь (в см²).`, `A trapezoid has bases ${a} cm and ${b} cm and height ${h} cm. Find its area in cm².`),
        answer: { kind: 'number', value: s.toString(), unit: 'см²',
          mistakes: [{ id: 'no_half_sum', value: String((a + b) * h), note: L('Нужна полусумма оснований: S = ((a + b) / 2) · h.', 'Use the half-sum of the bases: S = ((a + b) / 2) × h.') }] },
        hints: [
          L('Как найти площадь трапеции?', 'How do you find the area of a trapezoid?'),
          L('S = полусумма оснований · высота.', 'S = half-sum of the bases × height.'),
          L(`S = ((${a} + ${b}) / 2) · ${h}.`, `S = ((${a} + ${b}) / 2) × ${h}.`),
        ],
        solution: L(`S = ((${a} + ${b}) / 2) · ${h} = ${H(s)} см²`, `S = ((${a} + ${b}) / 2) × ${h} = ${H(s)} cm²`),
        keywords: ['основан', 'полусумма', 'высот', 'base', 'half-sum', 'height'],
      };
    }
    const mid = new Q(BigInt(a + b), 2n);
    return {
      prompt: L(`Основания трапеции равны ${a} см и ${b} см. Найди среднюю линию (в см).`, `A trapezoid has bases ${a} cm and ${b} cm. Find its midline in cm.`),
      answer: { kind: 'number', value: mid.toString(), unit: 'см',
        mistakes: [{ id: 'sum', value: String(a + b), note: L('Средняя линия — полусумма оснований, а не сумма.', 'The midline is the half-sum of the bases, not the sum.') }] },
      hints: [
        L('Что такое средняя линия трапеции?', 'What is the midline of a trapezoid?'),
        L('Средняя линия равна полусумме оснований.', 'The midline equals the half-sum of the bases.'),
        L(`Средняя линия = (${a} + ${b}) / 2.`, `Midline = (${a} + ${b}) / 2.`),
      ],
      solution: L(`(${a} + ${b}) / 2 = ${H(mid)} см`, `(${a} + ${b}) / 2 = ${H(mid)} cm`),
      keywords: ['средняя', 'полусумма', 'основан', 'midline', 'half-sum', 'base'],
    };
  },
  geo_circle(r) {
    const R = int(r, 2, 15);
    const v = int(r, 0, 2);
    if (v === 0) {
      return {
        prompt: L(`Радиус круга равен ${R}. Найди его площадь, делённую на π (то есть S/π).`, `A disk has radius ${R}. Find its area divided by π (that is, S/π).`),
        answer: { kind: 'number', value: String(R * R),
          mistakes: [{ id: 'diam', value: String(4 * R * R), note: L('В формуле S = πR² используется радиус, а не диаметр.', 'S = πR² uses the radius, not the diameter.') }] },
        hints: [
          L('Как найти площадь круга?', 'How do you find the area of a disk?'),
          L('S = πR², значит S/π = R².', 'S = πR², so S/π = R².'),
          L(`S/π = ${R}².`, `S/π = ${R}².`),
        ],
        solution: L(`S = π · ${R}² = ${R * R}π; S/π = ${R * R}`, `S = π × ${R}² = ${R * R}π; S/π = ${R * R}`),
        keywords: ['радиус', 'пи', 'квадрат', 'radius', 'pi', 'square'],
      };
    }
    if (v === 1) {
      return {
        prompt: L(`Радиус окружности равен ${R}. Найди длину окружности, делённую на π (то есть C/π).`, `A circle has radius ${R}. Find its circumference divided by π (that is, C/π).`),
        answer: { kind: 'number', value: String(2 * R),
          mistakes: [{ id: 'radius_only', value: String(R), note: L('C = 2πR, поэтому C/π = 2R, а не R.', 'C = 2πR, so C/π = 2R, not R.') }] },
        hints: [
          L('Как найти длину окружности?', 'How do you find the circumference of a circle?'),
          L('C = 2πR, значит C/π = 2R.', 'C = 2πR, so C/π = 2R.'),
          L(`C/π = 2 · ${R}.`, `C/π = 2 × ${R}.`),
        ],
        solution: L(`C = 2π · ${R} = ${2 * R}π; C/π = ${2 * R}`, `C = 2π × ${R} = ${2 * R}π; C/π = ${2 * R}`),
        keywords: ['длина', 'радиус', 'пи', 'circumference', 'radius', 'pi'],
      };
    }
    const alpha = pick(r, [30, 45, 60, 90, 120]), coef = new Q(BigInt(alpha * R * R), 360n);
    return {
      prompt: L(`Радиус круга равен ${R}. Найди площадь сектора с центральным углом ${alpha}°, делённую на π (S/π).`, `A disk has radius ${R}. Find the area of a ${alpha}° sector divided by π (S/π).`),
      answer: { kind: 'number', value: coef.toString(),
        mistakes: [{ id: 'full_circle', value: String(R * R), note: L('Это площадь всего круга. Сектор — лишь доля α/360.', 'That is the whole disk. A sector is the fraction α/360 of it.') }] },
      hints: [
        L('Какую часть круга составляет сектор с углом α?', 'What fraction of the disk is a sector with angle α?'),
        L('Доля сектора = α/360, поэтому S/π = (α/360) · R².', 'The sector fraction is α/360, so S/π = (α/360) × R².'),
        L(`S/π = (${alpha}/360) · ${R}².`, `S/π = (${alpha}/360) × ${R}².`),
      ],
      solution: L(`S/π = (${alpha}/360) · ${R * R} = ${H(coef)}`, `S/π = (${alpha}/360) × ${R * R} = ${H(coef)}`),
      keywords: ['сектор', 'доля', '360', 'sector', 'fraction'],
    };
  },
  geo_circle_angles(r) {
    const v = int(r, 0, 2);
    if (v === 0) {
      const central = int(r, 20, 160), inscribed = central / 2;
      return {
        prompt: L(`Центральный угол опирается на дугу в ${central}°. Найди вписанный угол, опирающийся на эту же дугу (в градусах).`, `A central angle subtends a ${central}° arc. Find the inscribed angle subtending the same arc in degrees.`),
        answer: { kind: 'number', value: String(inscribed), unit: '°',
          mistakes: [{ id: 'equal', value: String(central), note: L('Вписанный угол вдвое меньше центрального, опирающегося на ту же дугу.', 'The inscribed angle is half the central angle on the same arc.') }] },
        hints: [
          L('Как связаны вписанный и центральный углы, опирающиеся на одну дугу?', 'How are inscribed and central angles on the same arc related?'),
          L('Вписанный угол равен половине центрального.', 'The inscribed angle is half the central one.'),
          L(`Вписанный угол = ${central} / 2.`, `Inscribed angle = ${central} / 2.`),
        ],
        solution: L(`${central} / 2 = ${inscribed}°`, `${central} / 2 = ${inscribed}°`),
        keywords: ['вписан', 'центральн', 'половин', 'inscribed', 'central', 'half'],
      };
    }
    if (v === 1) {
      const inscribed = int(r, 15, 80), central = 2 * inscribed;
      return {
        prompt: L(`Вписанный угол равен ${inscribed}°. Найди величину дуги, на которую он опирается (в градусах).`, `An inscribed angle is ${inscribed}°. Find the measure of its subtended arc in degrees.`),
        answer: { kind: 'number', value: String(central), unit: '°',
          mistakes: [{ id: 'half', value: String(inscribed / 2), note: L('Дуга вдвое больше вписанного угла, а не вдвое меньше.', 'The arc is twice the inscribed angle, not half of it.') }] },
        hints: [
          L('Чему равен вписанный угол относительно дуги, на которую опирается?', 'What is an inscribed angle relative to its subtended arc?'),
          L('Вписанный угол равен половине дуги.', 'The inscribed angle is half the arc.'),
          L(`Дуга = 2 · ${inscribed}.`, `Arc = 2 × ${inscribed}.`),
        ],
        solution: L(`2 · ${inscribed} = ${central}°`, `2 × ${inscribed} = ${central}°`),
        keywords: ['вписан', 'дуг', 'половин', 'inscribed', 'arc', 'half'],
      };
    }
    return {
      prompt: L('Вписанный угол опирается на диаметр окружности. Найди этот угол (в градусах).', 'An inscribed angle subtends a diameter of the circle. Find this angle in degrees.'),
      answer: { kind: 'number', value: '90', unit: '°' },
      hints: [
        L('Какова величина дуги, на которую опирается угол, если это диаметр?', 'What is the measure of the arc subtended when it is a diameter?'),
        L('Диаметр стягивает дугу в 180°, а вписанный угол — половина дуги.', 'A diameter subtends a 180° arc, and the inscribed angle is half the arc.'),
        L('Угол = 180 / 2.', 'Angle = 180 / 2.'),
      ],
      solution: L('180 / 2 = 90°', '180 / 2 = 90°'),
      keywords: ['диаметр', 'прямой', '90', 'diameter', 'right'],
    };
  },
  geo_similar(r) {
    const k = int(r, 2, 5), a = int(r, 2, 12), b = int(r, 2, 12);
    if (int(r, 0, 1) === 0) {
      const a2 = a * k;
      return {
        prompt: L(`Треугольники подобны с коэффициентом ${k}. Сторона меньшего треугольника равна ${a}. Найди соответствующую сторону большего.`, `Two triangles are similar with coefficient ${k}. A side of the smaller one is ${a}. Find the corresponding side of the larger one.`),
        answer: { kind: 'number', value: String(a2),
          mistakes: [{ id: 'divide', value: new Q(BigInt(a), BigInt(k)).toString(), note: L('Сторона большего треугольника больше: умножай на коэффициент, а не дели.', 'The larger triangle’s side is bigger: multiply by the coefficient, don’t divide.') }] },
        hints: [
          L('Что означает коэффициент подобия?', 'What does the similarity coefficient mean?'),
          L('Стороны большего треугольника в k раз больше соответствующих сторон меньшего.', 'The larger triangle’s sides are k times the corresponding smaller sides.'),
          L(`Искомая сторона = ${a} · ${k}.`, `The side = ${a} × ${k}.`),
        ],
        solution: L(`${a} · ${k} = ${a2}`, `${a} × ${k} = ${a2}`),
        keywords: ['подоб', 'коэффициент', 'умнож', 'similar', 'coefficient', 'multiply'],
      };
    }
    const s1 = a * b, s2 = s1 * k * k;
    return {
      prompt: L(`Площадь меньшего из подобных треугольников равна ${s1}, коэффициент подобия равен ${k}. Найди площадь большего.`, `The smaller of two similar triangles has area ${s1} and the similarity coefficient is ${k}. Find the larger area.`),
      answer: { kind: 'number', value: String(s2),
        mistakes: [{ id: 'linear_ratio', value: String(s1 * k), note: L('Площади подобных фигур относятся как квадрат коэффициента: k².', 'Areas of similar figures scale as the square of the coefficient: k².') }] },
      hints: [
        L('Как относятся площади подобных треугольников?', 'How do the areas of similar triangles relate?'),
        L('Отношение площадей равно квадрату коэффициента подобия.', 'The area ratio is the square of the similarity coefficient.'),
        L(`Площадь большего = ${s1} · ${k}².`, `Larger area = ${s1} × ${k}².`),
      ],
      solution: L(`${s1} · ${k}² = ${s1} · ${k * k} = ${s2}`, `${s1} × ${k}² = ${s1} × ${k * k} = ${s2}`),
      keywords: ['площад', 'квадрат', 'коэффициент', 'area', 'square', 'coefficient'],
    };
  },
  geo_quadrilateral(r) {
    const v = int(r, 0, 2);
    if (v === 0) {
      const a = int(r, 60, 120), b = int(r, 60, 120), c = int(r, 60, 120), d = 360 - a - b - c;
      return {
        prompt: L(`Три угла четырёхугольника равны ${a}°, ${b}° и ${c}°. Найди четвёртый угол (в градусах).`, `Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. Find the fourth angle in degrees.`),
        answer: { kind: 'number', value: String(d), unit: '°',
          mistakes: [{ id: 'sum180', value: String(180 - a - b - c), note: L('Сумма углов четырёхугольника — 360°, а не 180°.', 'Quadrilateral angles sum to 360°, not 180°.') }] },
        hints: [
          L('Чему равна сумма углов любого четырёхугольника?', 'What do the angles of any quadrilateral sum to?'),
          L('Сумма углов четырёхугольника равна 360°.', 'The angles of a quadrilateral sum to 360°.'),
          L(`Четвёртый угол = 360 − ${a} − ${b} − ${c}.`, `Fourth angle = 360 − ${a} − ${b} − ${c}.`),
        ],
        solution: L(`360 − ${a} − ${b} − ${c} = ${d}°`, `360 − ${a} − ${b} − ${c} = ${d}°`),
        keywords: ['сумма', '360', 'угол', 'sum', 'angle'],
      };
    }
    if (v === 1) {
      const a = int(r, 3, 15), b = int(r, 3, 15);
      return {
        prompt: L(`Стороны прямоугольника равны ${a} см и ${b} см. Найди его площадь (в см²).`, `A rectangle has sides ${a} cm and ${b} cm. Find its area in cm².`),
        answer: { kind: 'number', value: String(a * b), unit: 'см²',
          mistakes: [{ id: 'perimeter', value: String(2 * (a + b)), note: L('Это периметр. Площадь — произведение сторон.', 'That is the perimeter. Area is the product of the sides.') }] },
        hints: [
          L('Как найти площадь прямоугольника?', 'How do you find the area of a rectangle?'),
          L('S = длина · ширина.', 'S = length × width.'),
          L(`S = ${a} · ${b}.`, `S = ${a} × ${b}.`),
        ],
        solution: L(`S = ${a} · ${b} = ${a * b} см²`, `S = ${a} × ${b} = ${a * b} cm²`),
        keywords: ['площад', 'произведен', 'сторон', 'area', 'product', 'side'],
      };
    }
    const [x, y, z] = pick(r, TRIPLES), k = int(r, 1, 3), a = x * k, b = y * k, c = z * k;
    return {
      prompt: L(`Стороны прямоугольника равны ${a} см и ${b} см. Найди его диагональ (в см).`, `A rectangle has sides ${a} cm and ${b} cm. Find its diagonal in cm.`),
      answer: { kind: 'number', value: String(c), unit: 'см',
        mistakes: [{ id: 'sum', value: String(a + b), note: L('Диагональ — гипотенуза прямоугольного треугольника: d² = a² + b².', 'The diagonal is a hypotenuse: d² = a² + b².') }] },
      hints: [
        L('Какой треугольник образуют две стороны и диагональ прямоугольника?', 'What triangle do two sides and a diagonal of a rectangle form?'),
        L('Прямоугольный: диагональ — гипотенуза, d² = a² + b².', 'A right one: the diagonal is the hypotenuse, d² = a² + b².'),
        L(`d² = ${a}² + ${b}² = ${a * a + b * b}. Извлеки корень.`, `d² = ${a}² + ${b}² = ${a * a + b * b}. Take the root.`),
      ],
      solution: L(`d² = ${a * a + b * b}; d = ${c} см`, `d² = ${a * a + b * b}; d = ${c} cm`),
      keywords: ['диагонал', 'пифагор', 'гипотенуз', 'diagonal', 'pythagor', 'hypotenuse'],
    };
  },
};