// Содержание обучения по действующим редакциям ФОП НОО (приказ № 372) и ФОП ООО (приказ № 370), ред. от 10.11.2025, КонсультантПлюс.
// При сборке страницы содержания по классам загружаются с consultant.ru и разбираются на разделы и абзацы.
// Слова не меняются: только кавычки «», тире, склейка перечней и удаление сносок/примечаний КонсультантПлюс.
// Если источник недоступен (и нет кэша), сборка не падает: остаётся содержание из корпуса. В GitHub Actions сборка падает при неполноте.
// Музыка: в ФОП (п. 166.6) содержание дано модулями без деления по классам; распределение тем по классам берём из корпуса
// (ФРП ЕДСОО 2025), а текст каждой темы заменяем текстом «Содержание: …» соответствующего подпункта ФОП.
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'https://www.consultant.ru/document/cons_doc_';
const NOO = 'LAW_452094', OOO = 'LAW_452180';
const VID = 'virtual:noo-content';
const ENT = { nbsp: ' ', quot: '"', laquo: '«', raquo: '»', amp: '&', lt: '<', gt: '>', mdash: '—', ndash: '–', hellip: '…' };
// [предмет, класс, пункт ФОП, страница КонсультантПлюс]
export const PAGES = [
  ['Русский язык', 1, '20.6', '1aca76c957e9454926b6d4425637b01759b14267'], ['Русский язык', 2, '20.7', 'd3c141313597d6c704608ee64459321ca58fd8b1'],
  ['Русский язык', 3, '20.8', 'c465cf7c6aa781c272710869438f4c858457a887'], ['Русский язык', 4, '20.9', '24fbf78d58b23ab0a157c2fa1eaaa120c20a85a4'],
  ['Литературное чтение', 1, '21.6', '8ca82b245495b28d0485de372555a1fc72640c67'], ['Литературное чтение', 2, '21.7', 'b279350778529d3d9dc6e8f52ae1efc6d42a7ffe'],
  ['Литературное чтение', 3, '21.8', '2a052b7e357da50f5a8267ca693037948fdcafb8'], ['Литературное чтение', 4, '21.9', 'ce7489d37f975e65e92dcff6644e997668563372'],
  ['Иностранный (английский) язык', 2, '157.6', 'b07075ae1b8bc112400118f6a2067650086f3019'], ['Иностранный (английский) язык', 3, '157.7', '523fd78c6e439a03a7c0ca8723d3bbe222d25cee'],
  ['Иностранный (английский) язык', 4, '157.8', 'fa584a884ee56c087e5df0770c77e8b7445d5800'],
  ['Математика', 1, '162.6', '89956370edba1f055692596d4e0acc2ea4000926'], ['Математика', 2, '162.7', '9beed8c8cce18e0a11fdbbcbd0ee76a3c9be092d'],
  ['Математика', 3, '162.8', 'c04558f8083544f18ae589c49f84727b90a39ec5'], ['Математика', 4, '162.9', '6f252396bec17e7ffe87457c8613aef9d68aedc9'],
  ['Окружающий мир', 1, '163.6', '2b9ef0cdc6a0d212b90cb1dab0940115664e3ca8'], ['Окружающий мир', 2, '163.7', 'f9f798f2bdb51051de43eb7bc11f2e530794391b'],
  ['Окружающий мир', 3, '163.8', '1ef0e77852d445e26c190823245ad28697c2d655'], ['Окружающий мир', 4, '163.9', '1c5b16d99d3c4c94b1a30e2c691771b22407cd8f'],
  ['ОРКСЭ', 4, '164.6', '4c08ec5474dfa34e3db3866616ea79912557a79e'],
  ['Изобразительное искусство', 1, '165.6', 'fec5151211550c32dc69eea3646391424e7f8093'], ['Изобразительное искусство', 2, '165.7', '7b9c3a1147a228c3658943da9aea27f09f104871'],
  ['Изобразительное искусство', 3, '165.8', '7ff1abf3796b947a7d9bce0e32a2f1b51ae1b9af'], ['Изобразительное искусство', 4, '165.9', 'dd2eaa17fbd1ac58720285f4838e4ba46e28588a'],
  ['Труд (технология)', 1, '167.6', '77ac32bdfe0585fc6adf46072494e80fbf0405a7'], ['Труд (технология)', 2, '167.7', 'c2efa319d283a62f0122e4bff1be6212d0097749'],
  ['Труд (технология)', 3, '167.8', '6af914467a352371e1b78406d99736e7bd407e63'], ['Труд (технология)', 4, '167.9', '06556783f4eb2b399a6a2dd09b47951982f9d8c0'],
  // Физическая культура: вариант N 2 (п. 168.3), с ним совпадают результаты; классы — пп. 168.3.2–168.3.5 одной страницы.
  ['Физическая культура', 1, '168.3.2', 'c0837412925e5cee690e9ad933344c7a875d02c7'], ['Физическая культура', 2, '168.3.3', 'c0837412925e5cee690e9ad933344c7a875d02c7'],
  ['Физическая культура', 3, '168.3.4', 'c0837412925e5cee690e9ad933344c7a875d02c7'], ['Физическая культура', 4, '168.3.5', 'c0837412925e5cee690e9ad933344c7a875d02c7'],
];
// ФОП ООО: [предмет, класс, пункт ФОП, страница КонсультантПлюс]
export const OOO_PAGES = [
  ['Иностранный (английский) язык', 5, '136.3', '9760c9d91ab6748cdf739b7e7a713850cf61f053'], ['Иностранный (английский) язык', 6, '136.4', 'a8ead0c3208df493b2aaaa2a27228797b2f72b51'],
  ['Иностранный (английский) язык', 7, '136.5', '08132177c8218bf41cd221bd1cb6e3dce848abb0'], ['Иностранный (английский) язык', 8, '136.6', '508ec8dcaf0e9b36416f48058aba07125be787de'],
  ['Иностранный (английский) язык', 9, '136.7', 'c1201aaecc23ceed267e30efb2b8f3d445b8421d'],
  // История (п. 150): содержание по классам, Всеобщая история и История России в одном пункте класса.
  ['История', 5, '150.3', '6cd2dbfd63f4567da8f29bb63f4710ec67f2b145'], ['История', 6, '150.4', 'c51f0abca3d3c8a82bc14dbc1c219570acf23d3e'],
  ['История', 7, '150.5', '1e85464769ab88e3d6fd0b44bb246428d72ca73b'], ['История', 8, '150.6', '2d295331c16e4c5c35b026a78ed40f5e4eb92eea'],
  ['История', 9, '150.7', '9c97424b505b47ffdd808bf6b1e9a9e144971417'],
  // Физическая культура (п. 163): содержание по классам (модули по видам спорта п. 163.10 и вариативный модуль 163.8 не входят).
  ['Физическая культура', 5, '163.3', '06fedfdda8684272d2c4e083259cba95f7181db9'], ['Физическая культура', 6, '163.4', '7b85b3f26ae198e1bd18bb57792152b5c962bf07'],
  ['Физическая культура', 7, '163.5', 'c1401985374a1b9f706ada1d56a335a13f655218'], ['Физическая культура', 8, '163.6', '690400c303b99a75e10d11b6204fa465fb17c2c1'],
  ['Физическая культура', 9, '163.7', '191a2c681655052bf870b5fd76a7d14c58c0efc7'],
];
// ФОП ООО, курсы на одной странице: «Содержание обучения в N классе» и предметные результаты «к концу обучения в N классе»
// находятся по заголовкам. [предмет, пункт, страница, классы, только результаты]
export const COURSES = [
  ['Математика', '146.4', '76b44841c3da8f19c19a5d503046f8255cab22c6', [5, 6]],
  ['Алгебра', '146.5', 'd5b25ad8ed951a831bcd4fed0feffaf354eb6025', [7, 8, 9]],
  ['Геометрия', '146.6', '0e4c55d2e25f53e4f8e2ad181aeb5b09d1dae129', [7, 8, 9]],
  ['Вероятность и статистика', '146.7', '028b0e926036a3222b0ed8e422335c790e281fbf', [7, 8, 9]],
  ['Иностранный (английский) язык', '136.8', '94947fccef514db3a8687e66e8bf853b67f69ea6', [5, 6, 7, 8, 9], true],
  // Планируемые результаты истории (150.8) и физкультуры (163.9): предметные результаты по классам.
  ['История', '150.8', '06a9ee3182714c5e524fe0997ebb8f9640c928b3', [5, 6, 7, 8, 9], true],
  ['Физическая культура', '163.9', '3d35f5e743ae2ff79c753b1f485caf54df5f05cd', [5, 6, 7, 8, 9], true],
];
export const MUSIC = ['166.6', 'fa93888f44e4134baf8e18f48fbda2c043913d4b'];
// ОРКСЭ: 6 модулей на одной странице; музыка 1–4; курсы ООО: содержание (кроме «только результаты») и результаты по классам.
export const EXPECTED = PAGES.length + 5 + 4 + OOO_PAGES.length + COURSES.reduce((a, [, , , gs, only]) => a + gs.length * (only ? 1 : 2), 0);

export function htmlLines(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<img[^>]*>/gi, 'ё').replace(/<\/?(?:p|br|div|h\d|li|tr)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&([a-z]+);/g, (m, k) => ENT[k] ?? m).replace(/[ \t]+/g, ' ')
    .split('\n').map(x => x.trim()).filter(Boolean);
}
const typo = s => s.replace(/<\d+>/g, '').replace(/"([^"]*)"/g, '«$1»').replace(/(\d)\s*-\s*(\d)/g, '$1–$2').replace(/\s+-\s+/g, ' – ').replace(/\s+/g, ' ').trim();
const NUM = /^(\d+(?:\.\d+)+)\.?\s+(.*)$/;
const NOTE = /^(?:КонсультантПлюс: примечание|Нумерация подпунктов дана|\((?:в ред\.|введен|абзац|пп?\.\s|подпункт)|-{5,}|<\d+>)/;
const oneTitle = t => t.length < 150 && !/:/.test(t) && !/[.!?»)]\s+[А-ЯЁA-Z«]/.test(t.replace(/\.$/, ''));
const FIXNUM = { '157.6.2. ': ['157.6.1.2.', '157.6.2. Мир моих увлечений'] };
const STOP = /^(?:Изучение|Освоение)\s|универсальн[а-я]+ учебн/;

// Разбор одной части страницы: sec — пункт класса (например '20.7' или '168.3.3').
export function parse(lines, sec, { lit = false, keep = false, nopend = false } = {}) {
  // В тексте КонсультантПлюс у 157.6.1.2 ошибочно стоит номер 157.6.2 (см. примечание КонсультантПлюс); номера не выводятся, нужны только для структуры.
  lines = lines.map(x => (FIXNUM[x.slice(0, x.indexOf(' ') + 1)] && x.startsWith(FIXNUM[x.slice(0, x.indexOf(' ') + 1)][1]) ? FIXNUM[x.slice(0, x.indexOf(' ') + 1)][0] + x.slice(x.indexOf(' ')) : x));
  const a = lines.findIndex(x => x.startsWith(`${sec}.1.`) || x.startsWith(`${sec}.1 `));
  if (a < 0) return [];
  const d0 = sec.split('.').length;
  const items = [];
  for (let i = a; i < lines.length; i++) {
    const x = lines[i];
    if (/^Открыть полный текст/.test(x)) break;
    if (NOTE.test(x)) continue;
    const m = x.match(NUM);
    if (m && !m[1].startsWith(sec + '.')) break;
    if (m && m[1].split('.').length === d0 + 1 && STOP.test(m[2])) break;
    items.push(m ? { num: m[1], depth: m[1].split('.').length, text: m[2] } : { text: x });
  }
  const secs = [], stack = [];
  const cur = () => {
    if (!stack.length) return null;
    const key = stack.map(s => s.num).join('|');
    let s = secs.find(z => z.key === key);
    if (!s) { s = { key, depth: stack[stack.length - 1].depth, title: stack.slice(-2).map(z => z.title).join(': '), topics: [] }; secs.push(s); }
    return s;
  };
  const add = t => {
    const s = cur(); if (!s) return;
    const prev = s.topics[s.topics.length - 1];
    if (prev && (/[:;]$/.test(prev) || /^[a-zа-яё(]/.test(t))) s.topics[s.topics.length - 1] = `${prev} ${t}`;
    else if (prev && s.pending) { s.topics[s.topics.length - 1] = `${prev} ${t}`; }
    else s.topics.push(t);
    s.pending = !nopend && t.length < 45 && /\.$/.test(t) && oneTitle(t) && !/[:;]/.test(t);
  };
  items.forEach((it, i) => {
    const text = typo(it.text);
    if (lit && it.num) {
      if (it.depth === d0 + 1) {
        const title = (text.match(/^(.+?)(?<![А-ЯЁA-Z])\.(?:\s|$)/) || [, text])[1];
        while (stack.length) stack.pop();
        stack.push({ num: it.num, depth: it.depth, title });
      }
      add(text);
      return;
    }
    const next = items[i + 1];
    const isHead = it.num && oneTitle(text) && (!next || !next.num || next.num.startsWith(it.num + '.'));
    if (isHead) {
      while (stack.length && stack[stack.length - 1].depth >= it.depth) stack.pop();
      stack.push({ num: it.num, depth: it.depth, title: text.replace(/\.$/, '') });
      return;
    }
    add(text);
  });
  // Разделы, у которых есть подразделы, сами по себе не выводим (вводные абзацы и описания модулей).
  // ООО (keep): у разделов ФОП ООО собственный текст стоит перед подразделами (например, тематика речи) и выводится.
  return secs.filter(s => s.topics.length && (keep || !secs.some(z => z !== s && z.key.startsWith(s.key + '|'))))
    .map(s => ({ title: s.title, topics: s.topics }));
}

// ОРКСЭ: модули 164.6.k — отдельные программы «ОРКСЭ: <модуль>».
export function parseOrkse(lines) {
  const out = {};
  for (let k = 1; k <= 6; k++) {
    const h = lines.find(x => x.startsWith(`164.6.${k}. `));
    const name = h && (h.match(/Модуль "([^"]+)"/) || [])[1];
    if (!name) continue;
    const topics = lines.filter(x => x.startsWith(`164.6.${k}.`) && x !== h).map(x => typo(x.replace(NUM, '$2')));
    if (topics.length) out[`ОРКСЭ: ${name}|4`] = [{ title: `Модуль «${name}»`, topics }];
  }
  return out;
}

// Номера пунктов «Содержание обучения в N классе» и предметных результатов по классам внутри курса root:
// «… к концу обучения в N классе» (математика, английский) или «Предметные результаты изучения … в N классе» (история и др.).
export function courseParts(lines, root) {
  const content = {}, results = {};
  for (const x of lines) {
    const m = x.match(NUM);
    if (!m || !m[1].startsWith(root + '.')) continue;
    let g;
    if ((g = m[2].match(/^Содержание обучения в (\d+) классе/))) content[g[1]] ??= m[1];
    else if ((g = m[2].match(/(?:[Кк] концу обучения|[Пп]редметные результаты[^.:]*?) в (\d+) классе/))) results[g[1]] ??= m[1];
  }
  return { content, results };
}
// Абзацы пункта sec подряд (каждый абзац отдельно); заголовки подпунктов (короткие, без двоеточия) не выводим.
export function flatResults(lines, sec) {
  const i = lines.findIndex(x => x.startsWith(sec + '. '));
  if (i < 0) return [];
  const out = [];
  for (const x of lines.slice(i + 1)) {
    if (/^Открыть полный текст/.test(x)) break;
    if (NOTE.test(x)) continue;
    const m = x.match(NUM);
    if (m && !m[1].startsWith(sec + '.')) break;
    const t = typo(m ? m[2] : x);
    if (m && oneTitle(t) && t.length < 120) continue;
    out.push(t);
  }
  return out;
}

// Общий блок результатов иногда начинается сразу с подпунктов (без строки «163.9.»).
// Собирает только подпункты одного корневого раздела, не подхватывая следующий раздел ФОП.
export function flatSubtreeResults(lines, root) {
  const i = lines.findIndex(x => {
    const m = x.match(NUM);
    return m && m[1].startsWith(root + '.');
  });
  if (i < 0) return [];
  const out = [];
  for (const x of lines.slice(i)) {
    if (/^Открыть полный текст/.test(x)) break;
    if (NOTE.test(x)) continue;
    const m = x.match(NUM);
    if (m && !m[1].startsWith(root + '.')) break;
    const t = typo(m ? m[2] : x);
    if (m && oneTitle(t) && t.length < 120) continue;
    if (t) out.push(t);
  }
  return out;
}

// Музыка: подпункт 166.6.k.j «Название.» → текст после «Содержание:» (до «Виды деятельности обучающихся»).
const key = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
export function parseMusic(lines) {
  const out = {};
  let cur = null, on = false;
  const a = lines.findIndex(x => x.startsWith('166.6.1.'));
  for (const x of lines.slice(Math.max(0, a))) {
    if (/^Открыть полный текст/.test(x)) break;
    if (NOTE.test(x)) continue;
    const m = x.match(NUM);
    if (m && !m[1].startsWith('166.6.')) break;
    if (m) { on = false; cur = m[1].split('.').length === 4 ? { title: typo(m[2]).replace(/\.$/, ''), text: [] } : null; if (cur) out[key(cur.title)] = cur; continue; }
    if (!cur) continue;
    if (/^Содержание:/.test(x)) { on = true; cur.text.push(typo(x.replace(/^Содержание:\s*/, ''))); continue; }
    if (/^Виды деятельности/.test(x)) { on = false; continue; }
    if (on) cur.text.push(typo(x));
  }
  return out;
}
// Названия тем ФРП, отличающиеся от подпунктов ФОП: «Музыка в церкви» (ФРП) = 166.6.5.4 «Искусство Русской православной церкви».
const ALIAS = { 'музыка в церкви': 'искусство русской православной церкви' };
export function musicSections(corpus, fop, miss) {
  return corpus.sections.map(s => ({ title: s.title, topics: s.topics.map(t => {
    const name = String(t).split(/:\s/)[0];
    const f = fop[key(name)] || fop[ALIAS[key(name)]];
    if (!f || !f.text.length) { miss.push(`${corpus.grade}: ${name}`); return t; }
    return `${f.title}: ${f.text.join(' ')}`;
  }) }));
}

// mark — номер пункта, который обязан быть в тексте страницы (например «20.6.1»): вне расписания КонсультантПлюс
// отдаёт страницу без текста документа (с оглавлением и навигацией), её не кэшируем; такой кэш тоже отбрасываем.
async function page(hash, cacheDir, doc = NOO, mark = '') {
  const f = path.join(cacheDir, `${hash}.html`);
  const ok = h => !mark || htmlLines(h).some(x => x.startsWith(mark + '.') || x.startsWith(mark + ' '));
  if (fs.existsSync(f)) { const h = fs.readFileSync(f, 'utf8'); if (ok(h)) return h; fs.rmSync(f); }
  const res = await fetch(`${DOC}${doc}/${hash}/`, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ru' }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (!html.includes(doc) && !html.includes('Минпросвещения')) throw new Error('неожиданная страница');
  // Некоммерческая версия КонсультантПлюс отдаёт большие документы по расписанию (будни 20–24 МСК, выходные весь день);
  // вне расписания приходит заглушка без текста: её не кэшируем. Кэш (node_modules/.cache) сохраняется между сборками Vercel.
  if (/доступен по расписанию/.test(html) || html.length < 20000 || !ok(html)) throw new Error('КонсультантПлюс: документ доступен только по расписанию');
  fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(f, html);
  return html;
}

export async function loadNooContent({ cacheDir = path.resolve('node_modules/.cache/noo-content') } = {}) {
  const map = {}, errors = [];
  for (const [subject, grade, sec, hash] of PAGES) {
    try {
      const lines = htmlLines(await page(hash, cacheDir, NOO, `${sec}.1`));
      if (subject === 'ОРКСЭ') { Object.assign(map, parseOrkse(lines)); continue; }
      const s = parse(lines, sec, { lit: subject === 'Литературное чтение' });
      if (s.length) map[`${subject}|${grade}`] = s; else errors.push(`${sec}: разделы не найдены`);
    } catch (e) { errors.push(`${sec}: ${e.message || e}`); }
  }
  for (const [subject, grade, sec, hash] of OOO_PAGES) {
    try {
      const s = parse(htmlLines(await page(hash, cacheDir, OOO, `${sec}.1`)), sec, { keep: true, nopend: true });
      if (s.length) map[`${subject}|${grade}`] = s; else errors.push(`ООО ${sec}: разделы не найдены`);
    } catch (e) { errors.push(`ООО ${sec}: ${e.message || e}`); }
  }
  for (const [subject, root, hash, grades, onlyResults] of COURSES) {
    try {
      const lines = htmlLines(await page(hash, cacheDir, OOO, `${root}.1`));
      const { content, results } = courseParts(lines, root);
      // ФОП ООО, п. 163.9 по физической культуре задаёт общие предметные результаты
      // для всего уровня ООО, а не отдельные подпункты для 5–9 классов.
      // Используем общий блок как общий для уровня; не маркируем его как уникальный результат класса.
      const sharedLevelResults = subject === 'Физическая культура' && root === '163.9'
        ? (flatResults(lines, root).length ? flatResults(lines, root) : flatSubtreeResults(lines, root))
        : [];
      for (const g of grades) {
        if (!onlyResults) {
          // Без подразделов (геометрия, ВиС): один раздел «Содержание обучения в N классе» с абзацами подряд.
          let s = content[g] && parse(lines, content[g], { keep: true, nopend: true });
          if (content[g] && !(s && s.length)) { const t = flatResults(lines, content[g]); if (t.length) s = [{ title: `Содержание обучения в ${g} классе`, topics: t }]; }
          if (s && s.length) map[`${subject}|${g}`] = s; else errors.push(`ООО ${root}: нет содержания ${g} кл.`);
        }
        const r = results[g] && flatResults(lines, results[g]);
        const resolvedResults = r && r.length ? r : sharedLevelResults;
        if (resolvedResults && resolvedResults.length) map[`R|${subject}|${g}`] = resolvedResults;
        else errors.push(`ООО ${root}: нет результатов ${g} кл.`);
      }
      // Для диагностики: заголовки пунктов курса, если результаты по классам не найдены.
      if (grades.some(g => !results[g]) && !sharedLevelResults.length) errors.push(`ООО ${root} пункты: ` + lines.filter(x => (x.match(NUM) || [])[1]?.startsWith(root + '.') && x.length < 160 && (x.match(NUM) || [])[1].split('.').length <= root.split('.').length + 2).map(x => x.slice(0, 90)).slice(0, 25).join(' / '));
    } catch (e) { errors.push(`ООО ${root}: ${e.message || e}`); }
  }
  try {
    const fop = parseMusic(htmlLines(await page(MUSIC[1], cacheDir, NOO, '166.6.1')));
    const corpus = JSON.parse(fs.readFileSync(path.resolve('src/data/fop/music_noo.json'), 'utf8'));
    const miss = [];
    for (const p of corpus.filter(q => /^music-[1-4]$/.test(q.id))) map[`Музыка|${p.grade}`] = musicSections(p, fop, miss);
    if (miss.length) errors.push(`музыка, нет в ФОП: ${miss.join('; ')}`);
  } catch (e) { errors.push(`166.6: ${e.message || e}`); }
  return { map, errors };
}

export default function nooContent() {
  let mod = null;
  return {
    name: 'noo-content',
    resolveId(id) { return id === VID ? '\0' + VID : null; },
    async load(id) {
      if (id !== '\0' + VID) return null;
      if (!mod) {
        const { map, errors } = await loadNooContent();
        const n = Object.keys(map).length;
        console.log(`[noo-content] программ: ${n} из ${EXPECTED}${errors.length ? '; ' + errors.join(' | ') : ''}`);
        if (process.env.GITHUB_ACTIONS === 'true') {
          const esc = s => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
          // Одно сообщение: лимит GitHub — 10 notice на шаг (остальное нужно frp-extract). Сводка по последним подключённым предметам.
          const CHECK = ['История', 'Физическая культура'];
          const sum = Object.entries(map).filter(([k]) => CHECK.some(s => k === `${s}|${k.split('|').pop()}` || k === `R|${s}|${k.split('|').pop()}`) && +k.split('|').pop() >= 5).map(([k, v]) => `#${k} s=${v.length} t=${Array.isArray(v[0]?.topics) ? v.reduce((a, s) => a + s.topics.length, 0) : v.length}` + (Array.isArray(v[0]?.topics) ? ' ' + v.slice(0, 4).map(s => `${s.title.slice(0, 40)} [${s.topics.length}]`).join('; ') : '')).join('\n');
          const dump = ['=== История 5', ...(map['История|5'] || []).slice(0, 3).flatMap(s => [`## ${s.title}`, ...s.topics.slice(0, 2)]), '=== R История 5', ...(map['R|История|5'] || []).slice(0, 4), '=== R ФК 5', ...(map['R|Физическая культура|5'] || []).slice(0, 3)].map(t => t.slice(0, 110)).join('\n');
          const text = `n=${n}/${EXPECTED} errors=${errors.join(' | ')}\n${sum}\n${dump}`;
          for (let i = 0, k = 0; i < text.length && k < 1; i += 1900, k++) console.log(`::notice title=c${k}::${esc(text.slice(i, i + 1900))}`);
          // Вне расписания КонсультантПлюс (будни днём) страницы недоступны: это не ошибка разбора, сборку не валим.
          const blocked = errors.length && errors.every(e => /по расписанию/.test(e));
          if (blocked) console.log(`::warning title=noo-content::КонсультантПлюс вне расписания: ${n} из ${EXPECTED}, остальное из корпуса`);
          else if (n < EXPECTED) this.error(`Содержание НОО/ООО из ФОП: ${n} из ${EXPECTED}. ${errors.join(' | ')}`);
        }
        mod = `export default ${JSON.stringify(map)};`;
      }
      return mod;
    },
  };
}
