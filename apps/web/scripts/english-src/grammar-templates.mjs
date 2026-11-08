// Deterministic grammar item generators (P0.1). Real rules, valid answers, bilingual explanations.
// Produces the three runtime shapes: choose / reorder / findError (see generated/grammar.json).

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (r, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const L = (en, ru) => ({ en, ru });

// ---- CHOOSE expanders: each returns ALL variants (exhaustive, deterministic) ----
// Each variant: { level, topic, sentence, options, answer, explain }. Answer position is varied later.
const CHOOSE_EXPAND = [
  () => { // present simple, 3rd person -s
    const subjects = ['He', 'She', 'It', 'My brother', 'Anna', 'Tom', 'My mother', 'The cat', 'David', 'My friend', 'The teacher', 'Olga'];
    const verbs = [['play', 'plays', 'football'], ['like', 'likes', 'pizza'], ['read', 'reads', 'books'], ['watch', 'watches', 'TV'], ['want', 'wants', 'a bike'], ['need', 'needs', 'help'], ['walk', 'walks', 'to school'], ['cook', 'cooks', 'dinner'], ['study', 'studies', 'English'], ['visit', 'visits', 'grandma'], ['help', 'helps', 'his friends'], ['open', 'opens', 'the shop'], ['clean', 'cleans', 'the room'], ['draw', 'draws', 'pictures'], ['sing', 'sings', 'songs']];
    const out = [];
    for (const subj of subjects) for (const v of verbs) out.push({ level: 'A1', topic: 'present simple', sentence: `${subj} ___ ${v[2]} every day.`, options: [v[0], v[1], `${v[0]}ing`, `${v[0]}ed`], answer: 1, explain: L(`With he/she/it add -s/-es: ${subj.toLowerCase()} ${v[1]}.`, `После he/she/it добавляем -s/-es: ${v[1]}.`) });
    return out;
  },
  () => { // present simple, I/you/we/they base form
    const subjects = ['I', 'You', 'We', 'They', 'My friends'];
    const verbs = [['play', 'plays', 'tennis'], ['live', 'lives', 'in Moscow'], ['study', 'studies', 'English'], ['go', 'goes', 'to school']];
    const out = [];
    for (const subj of subjects) for (const v of verbs) out.push({ level: 'A1', topic: 'present simple', sentence: `${subj} ___ ${v[2]}.`, options: [v[0], v[1], `${v[0]}ing`, `${v[0]}ed`], answer: 0, explain: L(`With I/you/we/they use the base form: ${v[0]}.`, `С I/you/we/they — начальная форма: ${v[0]}.`) });
    return out;
  },
  () => { // present continuous
    const subjects = [['They', 'are'], ['The children', 'are'], ['We', 'are'], ['I', 'am']];
    const verbs = [['play', 'playing', 'football'], ['read', 'reading', 'a book'], ['run', 'running', 'in the park'], ['cook', 'cooking', 'dinner']];
    const out = [];
    for (const [subj, be] of subjects) for (const v of verbs) out.push({ level: 'A1', topic: 'present continuous', sentence: `Look! ${subj} ___ ${v[2]}.`, options: [v[0], `${be} ${v[1]}`, `${v[0]}s`, `${v[0]}ed`], answer: 1, explain: L(`Look! = action now: ${be} + -ing.`, `Look! — действие сейчас: ${be} + -ing.`) });
    return out;
  },
  () => { // past simple irregular
    const verbs = [['go', 'went', 'to the park'], ['see', 'saw', 'a film'], ['eat', 'ate', 'pizza'], ['buy', 'bought', 'a book'], ['take', 'took', 'a photo'], ['come', 'came', 'home'], ['have', 'had', 'a good day'], ['make', 'made', 'a cake'], ['give', 'gave', 'a present'], ['find', 'found', 'a coin'], ['bring', 'brought', 'a friend'], ['write', 'wrote', 'a letter'], ['drink', 'drank', 'some tea'], ['run', 'ran', 'a race'], ['swim', 'swam', 'in the lake']];
    const subjects = ['I', 'We', 'She', 'They', 'He', 'You', 'My sister', 'The boys', 'Anna', 'My parents', 'Tom', 'The children'];
    const out = [];
    for (const subj of subjects) for (const v of verbs) out.push({ level: 'A2', topic: 'past simple', sentence: `Yesterday ${subj} ___ ${v[2]}.`, options: [v[0], v[1], `${v[0]}ed`, `${v[0]}ing`], answer: 1, explain: L(`Past simple of "${v[0]}" is "${v[1]}".`, `Прошедшая форма "${v[0]}" — "${v[1]}".`) });
    return out;
  },
  () => { // present perfect participle
    const verbs = [['see', 'seen', 'this film'], ['take', 'taken', 'a photo'], ['write', 'written', 'a letter'], ['do', 'done', 'the homework'], ['eat', 'eaten', 'sushi'], ['speak', 'spoken', 'to the teacher']];
    const subjects = [['I', 'have'], ['She', 'has'], ['We', 'have'], ['He', 'has'], ['They', 'have']];
    const out = [];
    for (const [subj, has] of subjects) for (const v of verbs) out.push({ level: 'B1', topic: 'present perfect', sentence: `${subj} ${has} already ___ ${v[2]}.`, options: [v[0], `${v[0]}s`, v[1], `${v[0]}ing`], answer: 2, explain: L(`Present perfect: ${has} + past participle "${v[1]}".`, `Present perfect: ${has} + третья форма "${v[1]}".`) });
    return out;
  },
  () => { // comparatives
    const adjs = [['big', 'bigger'], ['cheap', 'cheaper'], ['interesting', 'more interesting'], ['good', 'better'], ['bad', 'worse'], ['happy', 'happier']];
    return adjs.map((adj) => ({ level: 'A2', topic: 'comparatives', sentence: 'This book is ___ that one.', options: [adj[0], adj[1], `most ${adj[0]}`, `as ${adj[0]}`], answer: 1, explain: L(`Comparative form: "${adj[1]} ... than".`, `Сравнительная степень: "${adj[1]} ... than".`) }));
  },
  () => { // articles a/an
    const nouns = ['elephant', 'apple', 'honest man', 'umbrella', 'orange', 'idea'];
    return nouns.map((noun) => ({ level: 'A1', topic: 'articles', sentence: `I saw ___ ${noun} yesterday.`, options: ['a', 'an', 'the', 'some'], answer: 1, explain: L(`Use "an" before a vowel sound: an ${noun}.`, `Перед гласным звуком — an: an ${noun}.`) }));
  },
  () => { // prepositions of time
    const ps = [['Monday', 'on', 'днями недели — on'], ['2010', 'in', 'годами — in'], ['5 o\'clock', 'at', 'временем суток — at'], ['July', 'in', 'месяцами — in'], ['the morning', 'in', 'частями дня — in'], ['Friday', 'on', 'днями недели — on']];
    return ps.map((p) => ({ level: 'A2', topic: 'prepositions', sentence: `The event is ___ ${p[0]}.`, options: ['in', 'on', 'at', 'to'], answer: ['in', 'on', 'at'].indexOf(p[1]), explain: L(`Use "${p[1]}" with "${p[0]}".`, `С "${p[0]}" — предлог ${p[1]} (${p[2]}).`) }));
  },
  () => { // first conditional
    const vs = [['rain', 'stay', 'at home'], ['be late', 'miss', 'the bus'], ['study hard', 'pass', 'the exam'], ['snow', 'cancel', 'the match']];
    return vs.map((v) => ({ level: 'B1', topic: 'first conditional', sentence: `If it ${v[0]}, we ___ ${v[2]}.`, options: [v[1], `will ${v[1]}`, `${v[1]}ed`, `would ${v[1]}`], answer: 1, explain: L('First conditional: if + present, will + base.', 'Первый тип условия: if + настоящее, will + начальная форма.') }));
  },
  () => { // passive voice
    const vs = [['send', 'sent', 'The letter'], ['build', 'built', 'The house'], ['write', 'written', 'The book'], ['make', 'made', 'The cake']];
    return vs.map((v) => ({ level: 'B1', topic: 'passive voice', sentence: `${v[2]} ___ yesterday.`, options: [v[0], `was ${v[1]}`, `is ${v[0]}`, v[1]], answer: 1, explain: L(`Past passive: was/were + past participle "${v[1]}".`, `Прошедший залог: was/were + третья форма "${v[1]}".`) }));
  },
  () => { // modal verbs
    const ms = [['must', 'wear a helmet. It is the law', 'обязанность/закон', 'obligation'], ['can', 'speak three languages', 'умение', 'ability'], ['should', 'see a doctor', 'совет', 'advice'], ['may', 'borrow my pen', 'разрешение', 'permission']];
    return ms.map((m) => ({ level: 'A2', topic: 'modal verbs', sentence: `You ___ ${m[1]}.`, options: [m[0], 'mustn\'t', 'can\'t', 'would'], answer: 0, explain: L(`"${m[0]}" expresses ${m[3]}.`, `"${m[0]}" выражает ${m[2]}.`) }));
  },
];

// ---- REORDER templates: a correct sentence, words shuffled ----
const REORDER_BANK = [
  ['A1', 'word order', 'I like pizza very much', 'Подлежащее + глагол + дополнение + наречие.'],
  ['A1', 'word order', 'She reads books every evening', 'Обстоятельство времени ставится в конец.'],
  ['A1', 'word order', 'We play football on Sunday', 'Подлежащее + глагол + дополнение + время.'],
  ['A2', 'word order', 'He always gets up early', 'Наречие частоты стоит перед смысловым глаголом.'],
  ['A2', 'word order', 'They are watching a film now', 'Present continuous: be + -ing, now в конце.'],
  ['A2', 'word order', 'Where do you live', 'Вопрос: вопросительное слово + do + подлежащее + глагол.'],
  ['A2', 'word order', 'What time does the film start', 'Вопрос с does: глагол в начальной форме.'],
  ['B1', 'word order', 'I have never been to London', 'Наречие never стоит между have и третьей формой.'],
  ['B1', 'word order', 'She can speak English fluently', 'После can — начальная форма, наречие в конце.'],
  ['B1', 'word order', 'If I had time I would travel', 'Второй тип условия: if + past, would + base.'],
  ['A1', 'word order', 'My favourite subject is history', 'Подлежащее + is + именная часть.'],
  ['A2', 'word order', 'There are many books on the shelf', 'Конструкция there are + множественное число.'],
  ['A1', 'word order', 'The cat sleeps on the sofa', 'Подлежащее + глагол + обстоятельство места.'],
  ['A1', 'word order', 'I go to school by bus', 'Способ действия выражен в конце: by bus.'],
  ['A1', 'word order', 'She has a big red bag', 'Прилагательные стоят перед существительным.'],
  ['A1', 'word order', 'We eat breakfast at eight', 'Время приёма пищи — at eight.'],
  ['A2', 'word order', 'He usually walks to work', 'Наречие usually перед смысловым глаголом.'],
  ['A2', 'word order', 'They played tennis yesterday', 'Обстоятельство времени yesterday в конце.'],
  ['A2', 'word order', 'Do you like chocolate ice cream', 'Общий вопрос: Do + подлежащее + глагол.'],
  ['A2', 'word order', 'She is reading an interesting book', 'Артикль + прилагательное + существительное.'],
  ['A2', 'word order', 'We are going to visit grandma', 'Конструкция be going to + глагол.'],
  ['A2', 'word order', 'How often do you play sport', 'Вопрос How often + do + подлежащее + глагол.'],
  ['B1', 'word order', 'I have already finished my homework', 'Наречие already между have и третьей формой.'],
  ['B1', 'word order', 'She has lived here since 2010', 'Present perfect + since + точка отсчёта.'],
  ['B1', 'word order', 'The letter was sent yesterday', 'Пассив: was + третья форма + время.'],
  ['B1', 'word order', 'You should see a doctor soon', 'После should — начальная форма.'],
  ['B1', 'word order', 'If it rains we will stay home', 'Первый тип условия: if + present, will + base.'],
  ['B1', 'word order', 'He asked me where I lived', 'Косвенный вопрос: прямой порядок слов.'],
  ['B1', 'word order', 'This is the best film ever', 'Превосходная степень: the best.'],
  ['B1', 'word order', 'I am interested in modern art', 'Устойчивое: interested in.'],
  ['A1', 'word order', 'There is a park near my house', 'There is + единственное число.'],
  ['A1', 'word order', 'My brother plays the guitar well', 'Наречие well после дополнения.'],
  ['A2', 'word order', 'She does not like cold weather', 'Отрицание: does not + начальная форма.'],
  ['A2', 'word order', 'We must protect the environment', 'После must — начальная форма.'],
  ['A2', 'word order', 'Can you help me with this', 'Вопрос с can: Can + подлежащее + глагол.'],
  ['B1', 'word order', 'They had left before I arrived', 'Past perfect: had + третья форма.'],
  ['B1', 'word order', 'I wish I could speak French', 'Конструкция wish + could.'],
  ['B1', 'word order', 'The book which I read was great', 'Относительное придаточное с which.'],
  ['A1', 'word order', 'I would like a cup of tea', 'Вежливая форма: would like.'],
  ['A2', 'word order', 'She is taller than her sister', 'Сравнительная степень + than.'],
  ['A2', 'word order', 'We have got two cats at home', 'Конструкция have got.'],
  ['B1', 'word order', 'He is used to getting up early', 'Конструкция be used to + -ing.'],
  ['B1', 'word order', 'You must not smoke here', 'Запрет: must not + глагол.'],
  ['A1', 'word order', 'Please close the window now', 'Повелительное наклонение: глагол в начале.'],
  ['A2', 'word order', 'I am looking forward to the trip', 'Устойчивое: look forward to.'],
];

// ---- FINDERROR templates: sentence, wrong word, correction ----
const FINDERROR_BANK = [
  ['A1', 'articles', 'I saw a elephant at the zoo', 'a', 'an', 'Перед гласным звуком — an.'],
  ['A1', 'articles', 'She is a honest person', 'a', 'an', 'Honest начинается с гласного звука — an.'],
  ['A1', 'present simple', 'She go to school every day', 'go', 'goes', 'После she добавляем -es: goes.'],
  ['A1', 'present simple', 'He play football on Monday', 'play', 'plays', 'После he добавляем -s: plays.'],
  ['A2', 'past simple', 'He goed home yesterday', 'goed', 'went', 'Go — неправильный глагол: went.'],
  ['A2', 'past simple', 'She buyed a new dress', 'buyed', 'bought', 'Buy — неправильный глагол: bought.'],
  ['A1', 'plurals', 'There are many childs in the park', 'childs', 'children', 'Множественное число child — children.'],
  ['A2', 'plurals', 'I have two foots', 'foots', 'feet', 'Множественное число foot — feet.'],
  ['A2', 'prepositions', 'The cat is in the table', 'in', 'on', 'На поверхности — on the table.'],
  ['A2', 'comparatives', 'This box is more bigger than that one', 'more', 'much', 'Сравнительная степень уже есть: much bigger, не more bigger.'],
  ['B1', 'present perfect', 'She has wrote a letter', 'wrote', 'written', 'После has — третья форма: written.'],
  ['B1', 'first conditional', 'If it will rain we will stay home', 'will', 'rains', 'После if — настоящее время: if it rains.'],
  ['A1', 'present simple', 'My mother work in a hospital', 'work', 'works', 'После my mother (she) — works.'],
  ['A1', 'present simple', 'The dog run very fast', 'run', 'runs', 'После the dog (it) — runs.'],
  ['A1', 'plurals', 'I see three mouses in the field', 'mouses', 'mice', 'Множественное число mouse — mice.'],
  ['A2', 'plurals', 'She has five tooths', 'tooths', 'teeth', 'Множественное число tooth — teeth.'],
  ['A2', 'plurals', 'There are many mans in the street', 'mans', 'men', 'Множественное число man — men.'],
  ['A2', 'past simple', 'They eated all the cake', 'eated', 'ate', 'Eat — неправильный глагол: ate.'],
  ['A2', 'past simple', 'I seed a beautiful bird', 'seed', 'saw', 'See — неправильный глагол: saw.'],
  ['A2', 'past simple', 'He taked my book', 'taked', 'took', 'Take — неправильный глагол: took.'],
  ['A2', 'past simple', 'We goed to the cinema', 'goed', 'went', 'Go — неправильный глагол: went.'],
  ['A1', 'articles', 'Can I have a apple please', 'a', 'an', 'Перед гласным звуком — an apple.'],
  ['A2', 'articles', 'He is an university student', 'an', 'a', 'University начинается с согласного звука [j] — a.'],
  ['A2', 'prepositions', 'She was born on 2010', 'on', 'in', 'С годами — in: in 2010.'],
  ['A2', 'prepositions', 'The lesson starts on nine', 'on', 'at', 'Со временем суток — at: at nine.'],
  ['A2', 'prepositions', 'I will see you in Monday', 'in', 'on', 'С днями недели — on: on Monday.'],
  ['A2', 'comparatives', 'She is more taller than me', 'more', 'much', 'Сравнительная степень уже есть: much taller.'],
  ['A2', 'comparatives', 'This is the goodest book', 'goodest', 'best', 'Превосходная степень good — best.'],
  ['B1', 'present perfect', 'I have saw this film already', 'saw', 'seen', 'После have — третья форма: seen.'],
  ['B1', 'present perfect', 'He has did his homework', 'did', 'done', 'После has — третья форма: done.'],
  ['B1', 'present perfect', 'They have went home', 'went', 'gone', 'После have — третья форма: gone.'],
  ['B1', 'passive voice', 'The house was build last year', 'build', 'built', 'Пассив: was + третья форма built.'],
  ['B1', 'passive voice', 'The letter is write by Tom', 'write', 'written', 'Пассив: is + третья форма written.'],
  ['B1', 'modal verbs', 'You must wearing a uniform', 'wearing', 'wear', 'После must — начальная форма wear.'],
  ['A2', 'modal verbs', 'She can speaks three languages', 'speaks', 'speak', 'После can — начальная форма speak.'],
  ['A2', 'present continuous', 'Look! They is playing football', 'is', 'are', 'С they — are playing.'],
  ['A1', 'present continuous', 'I am read a book now', 'read', 'reading', 'Present continuous: am + reading.'],
  ['A2', 'pronouns', 'This book is me', 'me', 'mine', 'Притяжательное местоимение: mine.'],
  ['A2', 'pronouns', 'Her is a good student', 'Her', 'She', 'Подлежащее — She, не Her.'],
  ['B1', 'reported speech', 'He said he is tired', 'is', 'was', 'Согласование времён: said → was.'],
  ['B1', 'second conditional', 'If I was you I would go', 'was', 'were', 'Устойчивое: If I were you.'],
  ['A2', 'countable', 'There is much apples on the tree', 'much', 'many', 'С исчисляемыми — many apples.'],
  ['A2', 'countable', 'I have a few money', 'few', 'little', 'Money неисчисляемое — a little money.'],
  ['A1', 'present simple', 'She speak English well', 'speak', 'speaks', 'После she добавляем -s: speaks.'],
  ['B1', 'gerund or infinitive', 'I enjoy read books', 'read', 'reading', 'После enjoy — герундий: reading.'],
];

function makeReorder(r, level, topic, correct, ru) {
  const words = correct.split(' ');
  let mixed = shuffle(r, words);
  if (mixed.join(' ') === correct) mixed = [...words].reverse();
  return { level, topic, type: 'reorder', words: mixed, correct, explain: L('Put the words in the correct order.', ru) };
}
function makeFindError(r, level, topic, sentence, wrong, correction, ru) {
  const tokens = sentence.split(' ');
  const errorIndex = tokens.indexOf(wrong);
  return { level, topic, type: 'findError', sentence, errorIndex, correction, explain: L(`Replace "${wrong}" with "${correction}".`, ru) };
}

// Generate `count` unique grammar items deterministically: all reorder/findError bank entries plus an
// exhaustive, seed-shuffled expansion of the choose templates. Answer positions vary per item.
export function generateGrammar(count, seed = 1) {
  const r = rng(seed);
  const choose = [];
  for (const expand of CHOOSE_EXPAND) {
    for (const t of expand()) {
      const correctText = t.options[t.answer];
      const opts = shuffle(r, t.options);
      choose.push({ ...t, type: 'choose', options: opts, answer: opts.indexOf(correctText) });
    }
  }
  const reorder = REORDER_BANK.map((b) => makeReorder(r, b[0], b[1], b[2], b[3]));
  const findError = FINDERROR_BANK.map((b) => makeFindError(r, b[0], b[1], b[2], b[3], b[4], b[5]));
  const key = (item) => item.type === 'reorder' ? `R:${item.correct}` : item.type === 'findError' ? `E:${item.sentence}` : `C:${item.sentence}|${item.options[item.answer]}`;
  const seen = new Set();
  const pool = [];
  for (const item of shuffle(r, [...choose, ...reorder, ...findError])) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    pool.push(item);
  }
  return pool.slice(0, count);
}