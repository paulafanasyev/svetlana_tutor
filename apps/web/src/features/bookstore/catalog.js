// Seeded sample catalog for the e-book / textbook store («Книжный магазин ЦШ»).
// Pure data module: no framework, no network, no storage.
//
// Conventions (mirrored by bookstore.js):
//   - price is an INTEGER number of rubles (0 = free) — all money math stays exact.
//   - subject is one of BOOK_SUBJECTS ids; grades is [lo, hi] within 1..11.
//   - format is one of BOOK_FORMATS; license is one of BOOK_LICENSES.
//   - status: 'pending' (moderation queue), 'approved' (visible to readers),
//     'rejected' (requires rejectReason).
//   - rightsHolder + license model правообладание: the partner either owns the
//     rights ('own') or distributes under a license ('licensed').
//   - createdAt is a fixed epoch-ms timestamp so the seed is fully deterministic.
//
// Child-safety: this catalog is for schools (grades 1–11). It deliberately
// contains NO age-inappropriate content — only curriculum textbooks, exam
// preparation and children's reading. Real textbook titles/authors are used as
// realistic sample data; rightsHolder names model the publishing partners.

export const BOOK_SUBJECTS = Object.freeze([
  { id: 'mathematics', name: 'Математика' },
  { id: 'geometry', name: 'Геометрия' },
  { id: 'russian', name: 'Русский язык' },
  { id: 'literature', name: 'Литература' },
  { id: 'english', name: 'Английский язык' },
  { id: 'physics', name: 'Физика' },
  { id: 'chemistry', name: 'Химия' },
  { id: 'biology', name: 'Биология' },
  { id: 'history', name: 'История' },
  { id: 'social', name: 'Обществознание' },
  { id: 'geography', name: 'География' },
  { id: 'informatics', name: 'Информатика' },
  { id: 'reading', name: 'Внеклассное чтение' },
].map((s) => Object.freeze(s)));

export const BOOK_FORMATS = Object.freeze(['pdf', 'epub', 'fb2']);
export const BOOK_LICENSES = Object.freeze(['own', 'licensed']);

const DAY = 86400000;
const SEED_TIME = 1700000000000; // fixed → deterministic seed timestamps

const LISTINGS = [
  // ── Учебники (approved) ──────────────────────────────────────────────────
  {
    id: 'book-math-5',
    title: 'Математика. 5 класс. Учебник',
    author: 'Н. Я. Виленкин, В. И. Жохов',
    subject: 'mathematics', grades: [5, 5], price: 499,
    description: 'Классический учебник математики для 5 класса: натуральные числа, дроби, геометрический материал. Упражнения и вопросы для повторения.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '📐',
  },
  {
    id: 'book-russian-1-4',
    title: 'Русский язык. 1–4 классы. Комплект учебников',
    author: 'В. П. Канакина, В. Г. Горецкий',
    subject: 'russian', grades: [1, 4], price: 799,
    description: 'Комплект учебников по русскому языку для начальной школы: обучение грамоте, развитие речи, орфография и пунктуация.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '📝',
  },
  {
    id: 'book-english-spotlight-5',
    title: 'Английский язык. Spotlight 5. Student\'s Book',
    author: 'V. Evans, J. Dooley',
    subject: 'english', grades: [5, 5], price: 599,
    description: 'Учебник английского языка для 5 класса: модули по темам, грамматика, аудирование и проекты. Цифровая версия с закладками.',
    format: 'epub', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '🌍',
    sampleText: 'Module 1. School days! Hello! My name is Ann. I am eleven years old and I am a pupil.',
  },
  {
    id: 'book-physics-7',
    title: 'Физика. 7 класс. Учебник',
    author: 'А. В. Пёрышкин',
    subject: 'physics', grades: [7, 7], price: 449,
    description: 'Первый год изучения физики: строение вещества, движение, силы, давление. Лабораторные работы и задачи.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '🧲',
  },
  {
    id: 'book-history-6',
    title: 'История России. 6 класс. Учебник',
    author: 'Н. М. Арсентьев, А. А. Данилов',
    subject: 'history', grades: [6, 6], price: 429,
    description: 'История Отечества с древнейших времён до эпохи Ивана III: карты, документы, вопросы и задания.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '🏰',
  },
  {
    id: 'book-literature-9',
    title: 'Литература. 9 класс. Учебник',
    author: 'В. Я. Коровина',
    subject: 'literature', grades: [9, 9], price: 479,
    description: 'Русская литература от древнерусской до советской эпохи: хрестоматийный материал, статьи и вопросы для анализа.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '📖',
  },
  {
    id: 'book-biology-5',
    title: 'Биология. 5 класс. Учебник',
    author: 'В. В. Пасечник',
    subject: 'biology', grades: [5, 5], price: 399,
    description: 'Вводный курс биологии: разнообразие живой природы, клетка, организмы и среда обитания. Задания и лабораторные работы.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '🌿',
  },
  {
    id: 'book-chemistry-8',
    title: 'Химия. 8 класс. Учебник',
    author: 'О. С. Габриелян',
    subject: 'chemistry', grades: [8, 8], price: 449,
    description: 'Начальный курс химии: атомно-молекулярное учение, классы неорганических соединений, химические реакции. Задачи и упражнения.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '⚗️',
  },
  {
    id: 'book-informatics-7',
    title: 'Информатика. 7 класс. Учебник',
    author: 'Л. Л. Босова',
    subject: 'informatics', grades: [7, 7], price: 429,
    description: 'Информация и информационные процессы, устройство компьютера, обработка графики и текстов. Практические задания.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '💻',
  },
  {
    id: 'book-social-9',
    title: 'Обществознание. 9 класс. Учебник',
    author: 'Л. Н. Боголюбов',
    subject: 'social', grades: [9, 9], price: 459,
    description: 'Общество и человек, политика, право и экономика: базовый курс для подготовки к ОГЭ. Вопросы и работа с документами.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '⚖️',
  },
  {
    id: 'book-geometry-7-9',
    title: 'Геометрия. 7–9 классы. Учебник',
    author: 'Л. С. Атанасян',
    subject: 'geometry', grades: [7, 9], price: 549,
    description: 'Классический учебник геометрии для 7–9 классов: планиметрия, теоремы и задачи на доказательство и вычисление.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '📏',
  },
  {
    id: 'book-geography-5-6',
    title: 'География. 5–6 классы. Учебник',
    author: 'А. И. Алексеев',
    subject: 'geography', grades: [5, 6], price: 429,
    description: 'Начальный курс географии: план и карта, литосфера, атмосфера, гидросфера. Практические работы с картами.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '🗺️',
  },
  {
    id: 'book-algebra-10-11',
    title: 'Алгебра и начала математического анализа. 10–11 классы',
    author: 'Ш. А. Алимов',
    subject: 'mathematics', grades: [10, 11], price: 599,
    description: 'Учебник для старшей школы: производная, интеграл, степени и корни, тригонометрия. Задачи базового и профильного уровней.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'approved', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME,
    coverEmoji: '🧮',
  },
  {
    id: 'book-english-grammar-5-9',
    title: 'Английский язык. Грамматика. Сборник упражнений. 5–9 классы',
    author: 'Ю. Б. Голицынский',
    subject: 'english', grades: [5, 9], price: 349,
    description: 'Грамматический практикум по английскому языку: времена, артикли, степени сравнения. Упражнения с ключами для самостоятельной работы.',
    format: 'pdf', rightsHolder: 'Издательство «КАРО»', license: 'licensed',
    status: 'approved', partnerId: 'partner-karo', createdAt: SEED_TIME,
    coverEmoji: '✏️',
  },

  // ── ОГЭ / ЕГЭ (approved) ─────────────────────────────────────────────────
  {
    id: 'book-oge-math',
    title: 'ОГЭ. Математика. Типовые экзаменационные варианты',
    author: 'И. В. Ященко',
    subject: 'mathematics', grades: [9, 9], price: 399,
    description: 'Типовые варианты ОГЭ по математике с ответами и указаниями: алгебра, геометрия, практико-ориентированные задачи.',
    format: 'pdf', rightsHolder: 'Издательство «Национальное образование»', license: 'licensed',
    status: 'approved', partnerId: 'partner-exam', createdAt: SEED_TIME,
    coverEmoji: '🎯',
  },
  {
    id: 'book-ege-russian',
    title: 'ЕГЭ. Русский язык. Типовые экзаменационные варианты',
    author: 'И. П. Цыбулько, Д. В. Драбкина',
    subject: 'russian', grades: [10, 11], price: 499,
    description: 'Типовые варианты ЕГЭ по русскому языку: тестовая часть, сочинение, комментарии и ответы.',
    format: 'pdf', rightsHolder: 'Издательство «Национальное образование»', license: 'licensed',
    status: 'approved', partnerId: 'partner-exam', createdAt: SEED_TIME,
    coverEmoji: '🎓',
  },

  // ── Детское чтение (approved, free) ──────────────────────────────────────
  {
    id: 'book-reading-tales',
    title: 'Волшебный мир сказок',
    author: 'Составитель: А. Н. Иванова',
    subject: 'reading', grades: [1, 4], price: 0,
    description: 'Добрые сказки для младших школьников: русские народные и авторские сказки с крупным шрифтом и иллюстрациями.',
    format: 'fb2', rightsHolder: 'А. Н. Иванова', license: 'own',
    status: 'approved', partnerId: 'partner-ivanova', createdAt: SEED_TIME,
    coverEmoji: '📚',
    sampleText: 'Жили-были дед да баба. И была у них курочка Ряба. Снесла курочка яичко, не простое — золотое.',
  },
  {
    id: 'book-reading-animals',
    title: 'Рассказы о животных',
    author: 'В. В. Бианки, М. М. Пришвин, Е. И. Чарушин',
    subject: 'reading', grades: [1, 4], price: 0,
    description: 'Рассказы классиков о природе и животных: наблюдения, забота о потомстве, бережное отношение к живому. Для внеклассного чтения в 1–4 классах.',
    format: 'fb2', rightsHolder: 'Издательство «Детская литература»', license: 'licensed',
    status: 'approved', partnerId: 'partner-detlit', createdAt: SEED_TIME,
    coverEmoji: '🦊',
  },

  // ── На модерации (pending) — демонстрируют очередь модерации ─────────────
  {
    id: 'book-physics-lab-8',
    title: 'Физика. Лабораторный практикум. 8 класс',
    author: 'Е. В. Соколова',
    subject: 'physics', grades: [8, 8], price: 299,
    description: 'Сборник лабораторных работ по физике для 8 класса: тепловые явления, электричество. Методические указания и бланки отчётов.',
    format: 'pdf', rightsHolder: 'Е. В. Соколова', license: 'own',
    status: 'pending', partnerId: 'partner-sokolova', createdAt: SEED_TIME + DAY,
    coverEmoji: '🔬',
  },
  {
    id: 'book-math-workbook-2',
    title: 'Математика. Рабочая тетрадь. 2 класс',
    author: 'М. И. Моро, С. И. Волкова',
    subject: 'mathematics', grades: [2, 2], price: 299,
    description: 'Рабочая тетрадь к учебнику математики для 2 класса: устный счёт, задачи, геометрический материал.',
    format: 'pdf', rightsHolder: 'Издательство «Просвещение»', license: 'licensed',
    status: 'pending', partnerId: 'partner-prosveshcheniye', createdAt: SEED_TIME + DAY,
    coverEmoji: '🔢',
  },

  // ── Отклонена (rejected) — демонстрирует причину отклонения ──────────────
  {
    id: 'book-gdz-math-5',
    title: 'Готовые домашние задания по математике. 5 класс',
    author: 'С. А. Козлов',
    subject: 'mathematics', grades: [5, 5], price: 299,
    description: 'Сборник готовых ответов ко всем упражнениям школьного учебника математики за 5 класс.',
    format: 'pdf', rightsHolder: 'С. А. Козлов', license: 'own',
    status: 'rejected',
    rejectReason: 'Готовые ответы без объяснений не соответствуют образовательным требованиям платформы.',
    partnerId: 'partner-kozlov', createdAt: SEED_TIME,
  },
];

// Deep-freeze the seed so callers can never mutate the shared sample data.
for (const listing of LISTINGS) {
  Object.freeze(listing.grades);
  Object.freeze(listing);
}

export const SAMPLE_CATALOG = Object.freeze(LISTINGS);