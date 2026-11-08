// Seeded sample catalog for the partner school-goods marketplace («Маркетплейс»).
// Pure data module: no framework, no network, no storage.
//
// Conventions mirror the buffet/bookstore modules:
//   - price is an INTEGER number of rubles (exact money math, no floats).
//   - stock is an INTEGER quantity available; 0 = out of stock (visible but not orderable).
//   - category is one of GOODS_CATEGORIES ids.
//   - status: 'approved' listings are visible to buyers; 'pending' await moderation;
//     'rejected' are hidden (a couple of each are seeded to demo the partner/moderator views).
//   - sizes (optional) apply to uniforms/clothing.
//   - brand models the partner/правообладатель; partnerId owns the listing.
//
// Child-safety: school-appropriate goods only — no weapons, alcohol, tobacco,
// energy drinks, or other age-inappropriate products.

export const GOODS_CATEGORIES = Object.freeze([
  { id: 'uniform', name: 'Школьная форма', emoji: '👔' },
  { id: 'stationery', name: 'Канцелярия', emoji: '✏️' },
  { id: 'sports', name: 'Спорттовары', emoji: '⚽' },
  { id: 'accessories', name: 'Аксессуары', emoji: '🎒' },
]);

export const UNIFORM_SIZES = Object.freeze(['122', '128', '134', '140', '146', '152', '158', '164', 'S', 'M', 'L']);

export const SAMPLE_GOODS = Object.freeze([
  // ── Школьная форма ─────────────────────────────────────────────────────────
  { id: 'uniform-blazer', name: 'Блейзер школьный синий', category: 'uniform', price: 2499, stock: 40, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'approved', emoji: '🧥', sizes: ['134', '140', '146', '152', '158', '164'], description: 'Классический приталенный блейзер из смесовой ткани, держит форму после стирки.' },
  { id: 'uniform-trousers', name: 'Брюки школьные чёрные', category: 'uniform', price: 1299, stock: 55, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'approved', emoji: '👖', sizes: ['128', '134', '140', '146', '152', '158'], description: 'Прямые брюки со стрелками, регулируемый пояс.' },
  { id: 'uniform-sarafan', name: 'Сарафан школьный тёмно-синий', category: 'uniform', price: 1599, stock: 35, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'approved', emoji: '👗', sizes: ['122', '128', '134', '140', '146'], description: 'Сарафан на подкладке для начальной школы.' },
  { id: 'uniform-shirt-white', name: 'Рубашка белая хлопковая', category: 'uniform', price: 899, stock: 80, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'approved', emoji: '👕', sizes: ['128', '134', '140', '146', '152', '158', '164'], description: 'Дышащая хлопковая рубашка, немнущаяся отделка.' },
  { id: 'uniform-polo', name: 'Поло школьное белое', category: 'uniform', price: 649, stock: 90, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'approved', emoji: '👕', sizes: ['134', '140', '146', '152', '158'], description: 'Поло из пике, воротник держит форму.' },
  { id: 'uniform-jumper', name: 'Джемпер школьный синий', category: 'uniform', price: 1099, stock: 0, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'approved', emoji: '🧶', sizes: ['134', '140', '146', '152'], description: 'Мягкий джемпер V-образный вырез. Сейчас нет в наличии.' },
  { id: 'uniform-tie', name: 'Галстук школьный бордовый', category: 'uniform', price: 349, stock: 120, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'approved', emoji: '👔', description: 'Галстук на резинке, единый цвет для школы.' },

  // ── Канцелярия ─────────────────────────────────────────────────────────────
  { id: 'stat-notebook-48', name: 'Тетрадь 48 л. клетка (набор 10 шт.)', category: 'stationery', price: 399, stock: 200, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '📓', description: 'Набор тетрадей 48 листов, плотная обложка, белизна бумаги 100%.' },
  { id: 'stat-pen-blue', name: 'Ручка шариковая синяя (набор 5 шт.)', category: 'stationery', price: 199, stock: 300, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '🖊️', description: 'Масляные чернила, мягкое письмо, не течёт.' },
  { id: 'stat-pencil-hb', name: 'Карандаш чернографитный HB (набор 6 шт.)', category: 'stationery', price: 149, stock: 250, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '✏️', description: 'Прочный грифель, точится без сколов.' },
  { id: 'stat-penal', name: 'Пенал школьный жёсткий', category: 'stationery', price: 499, stock: 70, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '🧰', description: 'Пенал на молнии с отделениями для ручек и мелочей.' },
  { id: 'stat-ruler-set', name: 'Набор линеек и геометрии', category: 'stationery', price: 259, stock: 110, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '📐', description: 'Линейка 20 см, транспортир, два угольника в чехле.' },
  { id: 'stat-markers', name: 'Фломастеры 12 цветов', category: 'stationery', price: 289, stock: 95, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '🖍️', description: 'Смываемые чернила, вентилируемый колпачок.' },
  { id: 'stat-diary', name: 'Дневник школьный твёрдый', category: 'stationery', price: 329, stock: 60, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '📔', description: 'Дневник для 1–11 классов, плотная обложка, справочные материалы.' },
  { id: 'stat-covers', name: 'Обложки для учебников (набор 10 шт.)', category: 'stationery', price: 179, stock: 140, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'approved', emoji: '📚', description: 'Универсальные прозрачные обложки с клеевым слоем.' },

  // ── Спорттовары ────────────────────────────────────────────────────────────
  { id: 'sport-sneakers', name: 'Кроссовки школьные белые', category: 'sports', price: 1899, stock: 45, brand: 'СпортЮни', partnerId: 'partner-sport', status: 'approved', emoji: '👟', sizes: ['30', '32', '34', '36', '38', '40'], description: 'Лёгкие кроссовки на нескользящей подошве для физкультуры.' },
  { id: 'sport-suit', name: 'Спортивный костюм школьный', category: 'sports', price: 2199, stock: 30, brand: 'СпортЮни', partnerId: 'partner-sport', status: 'approved', emoji: '🎽', sizes: ['134', '140', '146', '152', '158', '164'], description: 'Куртка и брюки, дышащая ткань, светоотражающие элементы.' },
  { id: 'sport-ball', name: 'Мяч футбольный размер 4', category: 'sports', price: 899, stock: 50, brand: 'СпортЮни', partnerId: 'partner-sport', status: 'approved', emoji: '⚽', description: 'Мяч для мини-футбола и школьных тренировок, прочная камера.' },
  { id: 'sport-rope', name: 'Скакалка скоростная', category: 'sports', price: 299, stock: 100, brand: 'СпортЮни', partnerId: 'partner-sport', status: 'approved', emoji: '🪢', description: 'Регулируемая длина, подшипники для вращения.' },
  { id: 'sport-mat', name: 'Коврик гимнастический', category: 'sports', price: 799, stock: 25, brand: 'СпортЮни', partnerId: 'partner-sport', status: 'approved', emoji: '🧘', description: 'Нескользящий коврик для упражнений, толщина 8 мм.' },

  // ── Аксессуары ─────────────────────────────────────────────────────────────
  { id: 'acc-backpack', name: 'Рюкзак школьный ортопедический', category: 'accessories', price: 2799, stock: 40, brand: 'РанецПро', partnerId: 'partner-acc', status: 'approved', emoji: '🎒', description: 'Ортопедическая спинка, светоотражатели, отделение для ноутбука.' },
  { id: 'acc-shoe-bag', name: 'Мешок для обуви', category: 'accessories', price: 249, stock: 130, brand: 'РанецПро', partnerId: 'partner-acc', status: 'approved', emoji: '👟', description: 'Прочный мешок на затяжке, водоотталкивающая ткань.' },
  { id: 'acc-bottle', name: 'Бутылка для воды 0,5 л', category: 'accessories', price: 459, stock: 85, brand: 'РанецПро', partnerId: 'partner-acc', status: 'approved', emoji: '🍶', description: 'Тритановая бутылка без BPA, герметичная крышка.' },
  { id: 'acc-lunchbox', name: 'Ланчбокс школьный', category: 'accessories', price: 599, stock: 55, brand: 'РанецПро', partnerId: 'partner-acc', status: 'approved', emoji: '🍱', description: 'Контейнер с отделениями, герметичные защёлки.' },

  // ── Ожидают модерации / отклонены (для демонстрации кабинета партнёра) ──────
  { id: 'uniform-vest-new', name: 'Жилет школьный утеплённый', category: 'uniform', price: 1399, stock: 20, brand: 'Школьный стиль', partnerId: 'partner-forma', status: 'pending', emoji: '🦺', sizes: ['140', '146', '152'], description: 'Новая позиция: утеплённый жилет, ожидает проверки модератором.' },
  { id: 'stat-glue-set', name: 'Набор клея ПВА и клеевых карандашей', category: 'stationery', price: 219, stock: 40, brand: 'Канцторг', partnerId: 'partner-kanc', status: 'pending', emoji: '🧴', description: 'Новая позиция: нетоксичный клей для творчества, ожидает модерации.' },
  { id: 'acc-phone-case', name: 'Чехол для телефона с логотипом', category: 'accessories', price: 399, stock: 10, brand: 'РанецПро', partnerId: 'partner-acc', status: 'rejected', rejectReason: 'Аксессуар не относится к школьным товарам первой необходимости.', emoji: '📱', description: 'Отклонённая позиция: не входит в ассортимент школьного маркетплейса.' },
]);