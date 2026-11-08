// ОГЭ «Реальная математика» (задания 1–5): практико-ориентированные сценарии
// (шины, участок, план квартиры, бумага A-формата, печь). Все ответы точные (Q/BigInt),
// без float. Подключается к общему реестру problems.js и сократической лесенке подсказок.
import { Q } from './rational.js';

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const L = (ru, en) => ({ ru, en });
const H = (q) => q.toHuman();

export const OGE_REAL_TOPICS = {
  9: [
    { id: 'oge_tire', title: L('ОГЭ: автомобильные шины', 'ОГЭ: car tyres') },
    { id: 'oge_plot', title: L('ОГЭ: земельный участок', 'ОГЭ: land plot') },
    { id: 'oge_plan', title: L('ОГЭ: план квартиры', 'ОГЭ: flat plan') },
    { id: 'oge_paper', title: L('ОГЭ: бумага A-формата', 'ОГЭ: A-format paper') },
    { id: 'oge_stove', title: L('ОГЭ: печь и дымоход', 'ОГЭ: stove and chimney') },
  ],
};

export const OGE_REAL_GEN = {
  oge_tire(r) {
    // Маркировка W/P R Rrim: ширина W мм, профиль P% от ширины, диск Rrim дюймов (1" = 25,4 мм).
    const W = pick(r, [185, 195, 205, 215, 225]), P = pick(r, [50, 55, 60, 65]), rim = pick(r, [15, 16, 17]);
    const side = new Q(BigInt(W * P), 100n); // высота профиля, мм
    const diameter = new Q(BigInt(rim * 254), 10n).add(side.mul(2)); // диаметр колеса, мм
    return {
      oge: true,
      prompt: L(`Шина имеет маркировку ${W}/${P} R${rim}. Ширина профиля ${W} мм, высота профиля составляет ${P}% от ширины, диаметр диска ${rim} дюймов (1 дюйм = 25,4 мм). Найди диаметр колеса в миллиметрах.`, `A tyre is marked ${W}/${P} R${rim}. Section width is ${W} mm, sidewall height is ${P}% of the width, rim diameter is ${rim} inches (1 inch = 25.4 mm). Find the wheel diameter in mm.`),
      answer: { kind: 'number', value: diameter.toString(), unit: 'мм',
        mistakes: [{ id: 'one_side', value: new Q(BigInt(rim * 254), 10n).add(side).toString(), note: L('Профиль удваивается: сверху и снизу от диска. Прибавь две высоты профиля.', 'The sidewall appears twice (above and below the rim). Add two sidewall heights.') }] },
      hints: [
        L('Из чего складывается диаметр колеса: диск и что ещё?', 'What makes up the wheel diameter: the rim and what else?'),
        L('Высота профиля = ширина · P/100. К диаметру диска прибавляются две высоты профиля.', 'Sidewall height = width × P/100. Add two sidewall heights to the rim diameter.'),
        L(`Высота профиля = ${W} · ${P}/100 = ${H(side)} мм. Диаметр = ${rim} · 25,4 + 2 · ${H(side)}.`, `Sidewall = ${W} × ${P}/100 = ${H(side)} mm. Diameter = ${rim} × 25.4 + 2 × ${H(side)}.`),
      ],
      solution: L(`${rim} · 25,4 + 2 · (${W} · ${P}/100) = ${H(diameter)} мм`, `${rim} × 25.4 + 2 × (${W} × ${P}/100) = ${H(diameter)} mm`),
      keywords: ['профиль', 'диск', 'диаметр', 'sidewall', 'rim', 'diameter'],
    };
  },
  oge_plot(r) {
    const a = int(r, 10, 40), b = int(r, 10, 40), price = pick(r, [200, 350, 500, 800]);
    if (int(r, 0, 1) === 0) {
      const area = a * b;
      return {
        oge: true,
        prompt: L(`Земельный участок имеет форму прямоугольника со сторонами ${a} м и ${b} м. Найди его площадь в квадратных метрах.`, `A land plot is a rectangle with sides ${a} m and ${b} m. Find its area in square metres.`),
        answer: { kind: 'number', value: String(area), unit: 'м²',
          mistakes: [{ id: 'perimeter', value: String(2 * (a + b)), note: L('Это периметр. Площадь прямоугольника — произведение сторон.', 'That is the perimeter. Area is the product of the sides.') }] },
        hints: [
          L('Как найти площадь прямоугольника?', 'How do you find the area of a rectangle?'),
          L('Площадь = длина · ширина.', 'Area = length × width.'),
          L(`S = ${a} · ${b}.`, `S = ${a} × ${b}.`),
        ],
        solution: L(`${a} · ${b} = ${area} м²`, `${a} × ${b} = ${area} m²`),
        keywords: ['площадь', 'произведен', 'area', 'product'],
      };
    }
    const cost = 2 * (a + b) * price;
    return {
      oge: true,
      prompt: L(`Участок прямоугольной формы ${a} м на ${b} м огораживают забором по периметру. Один метр забора стоит ${price} рублей. Найди стоимость всего забора в рублях.`, `A rectangular plot ${a} m by ${b} m is fenced along its perimeter. One metre of fence costs ${price} roubles. Find the total fence cost in roubles.`),
      answer: { kind: 'number', value: String(cost), unit: '₽',
        mistakes: [{ id: 'area_cost', value: String(a * b * price), note: L('Забор ставится по периметру, а не по площади. Сначала найди периметр.', 'The fence goes along the perimeter, not the area. Find the perimeter first.') }] },
      hints: [
        L('Вдоль какой границы ставят забор — что нужно найти сначала?', 'Along which boundary is the fence placed — what do you find first?'),
        L('Периметр прямоугольника = 2 · (длина + ширина).', 'Perimeter of a rectangle = 2 × (length + width).'),
        L(`Периметр = 2 · (${a} + ${b}). Стоимость = периметр · ${price}.`, `Perimeter = 2 × (${a} + ${b}). Cost = perimeter × ${price}.`),
      ],
      solution: L(`2 · (${a} + ${b}) · ${price} = ${cost} ₽`, `2 × (${a} + ${b}) × ${price} = ${cost} ₽`),
      keywords: ['периметр', 'забор', 'стоимость', 'perimeter', 'fence', 'cost'],
    };
  },
  oge_plan(r) {
    // План в клетках, масштаб: 1 клетка = s м (s = 0,5 или 1). Комната a×b клеток.
    const a = int(r, 4, 12), b = int(r, 4, 12), half = int(r, 0, 1) === 1;
    const scale = half ? new Q(1n, 2n) : new Q(1n);
    const area = new Q(BigInt(a * b)).mul(scale).mul(scale);
    const scaleText = half ? '0,5 м' : '1 м';
    return {
      oge: true,
      prompt: L(`На плане квартиры комната занимает прямоугольник ${a} клеток в длину и ${b} клеток в ширину. Сторона каждой клетки равна ${scaleText}. Найди площадь комнаты в квадратных метрах.`, `On a flat plan a room occupies a rectangle ${a} cells long and ${b} cells wide. Each cell side is ${half ? '0.5' : '1'} m. Find the room area in square metres.`),
      answer: { kind: 'number', value: area.toString(), unit: 'м²',
        mistakes: [{ id: 'cells_as_m', value: String(a * b), note: L(half ? 'Клетка — это 0,5 м, а не 1 м. Площадь клетки 0,25 м².' : 'Учти масштаб клетки.', half ? 'A cell is 0.5 m, not 1 m. One cell area is 0.25 m².' : 'Account for the cell scale.') }] },
      hints: [
        L('Сколько клеток занимает комната и чему равна сторона одной клетки?', 'How many cells does the room take and what is one cell side?'),
        L('Площадь комнаты = число клеток · площадь одной клетки.', 'Room area = number of cells × area of one cell.'),
        L(`Число клеток = ${a} · ${b}. Площадь клетки = ${scaleText} · ${scaleText}.`, `Cells = ${a} × ${b}. Cell area = ${half ? '0.5' : '1'} × ${half ? '0.5' : '1'}.`),
      ],
      solution: L(`${a} · ${b} · (${scaleText})² = ${H(area)} м²`, `${a} × ${b} × (${half ? '0.5' : '1'})² = ${H(area)} m²`),
      keywords: ['клетк', 'масштаб', 'план', 'cell', 'scale', 'plan'],
    };
  },
  oge_paper(r) {
    // A0 имеет площадь 1 м²; каждый следующий формат вдвое меньше. A_n -> A_m: 2^(m-n) листов.
    const n = int(r, 0, 3), m = n + int(r, 1, 4 - n);
    const count = 2 ** (m - n);
    return {
      oge: true,
      prompt: L(`Лист бумаги формата A${n} разрезали на листы формата A${m}. Каждый следующий формат получается разрезанием предыдущего пополам. Сколько листов формата A${m} получилось?`, `An A${n} sheet was cut into A${m} sheets. Each next format is obtained by cutting the previous one in half. How many A${m} sheets were obtained?`),
      answer: { kind: 'number', value: String(count),
        mistakes: [{ id: 'diff', value: String(m - n), note: L('Каждый шаг удваивает число листов: это степень двойки, а не разность форматов.', 'Each step doubles the number of sheets: it is a power of two, not the difference of formats.') }] },
      hints: [
        L('Что происходит с числом листов при переходе к следующему формату?', 'What happens to the number of sheets when moving to the next format?'),
        L('Каждый переход к следующему формату удваивает количество листов.', 'Each step to the next format doubles the number of sheets.'),
        L(`Число переходов от A${n} к A${m}: ${m - n}. Возведи 2 в степень числа переходов.`, `Number of steps from A${n} to A${m}: ${m - n}. Raise 2 to the number of steps.`),
      ],
      solution: L(`2^${m - n} = ${count}`, `2^${m - n} = ${count}`),
      keywords: ['формат', 'пополам', 'степень', 'format', 'half', 'power'],
    };
  },
  oge_stove(r) {
    // Дымоход — цилиндр: радиус r, высота h. Объём, делённый на π = r²h (точно).
    const rr = int(r, 2, 9), h = int(r, 5, 20), v = rr * rr * h;
    return {
      oge: true,
      prompt: L(`Дымоход печи имеет форму цилиндра с радиусом основания ${rr} дм и высотой ${h} дм. Найди объём дымохода, делённый на π (то есть V/π), в кубических дециметрах.`, `A stove chimney is a cylinder with base radius ${rr} dm and height ${h} dm. Find its volume divided by π (that is, V/π) in cubic decimetres.`),
      answer: { kind: 'number', value: String(v),
        mistakes: [{ id: 'no_square', value: String(rr * h), note: L('В формуле V = πr²h радиус возводится в квадрат.', 'In V = πr²h the radius is squared.') },
          { id: 'diam', value: String(4 * v), note: L('В формуле используется радиус, а не диаметр.', 'The formula uses the radius, not the diameter.') }] },
      hints: [
        L('Как найти объём цилиндра?', 'How do you find the volume of a cylinder?'),
        L('V = π · r² · h, значит V/π = r² · h.', 'V = π × r² × h, so V/π = r² × h.'),
        L(`V/π = ${rr}² · ${h}.`, `V/π = ${rr}² × ${h}.`),
      ],
      solution: L(`V/π = ${rr}² · ${h} = ${v}`, `V/π = ${rr}² × ${h} = ${v}`),
      keywords: ['цилиндр', 'объём', 'радиус', 'cylinder', 'volume', 'radius'],
    };
  },
};