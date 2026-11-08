// Seeded sample menu for the school buffet/canteen («Школьный буфет»).
// Pure data module: no framework, no network, no storage.
//
// Conventions:
//   - price is an INTEGER number of rubles (no kopecks, no floats) — all money
//     math in buffet.js stays exact.
//   - category is one of MENU_CATEGORIES ids.
//   - allergens is an array of human-readable Russian allergen labels.
//   - nutrition (optional) is per serving: calories (kcal), protein/fat/carbs (g).
//   - available=false means the kitchen has temporarily stopped selling it
//     («стоп-лист»); it is hidden from pupils but still visible to the kitchen.
//
// Child-safety: this menu is for schools. It deliberately contains NO alcohol,
// tobacco, energy drinks or other age-inappropriate products.

export const MENU_CATEGORIES = Object.freeze([
  { id: 'bakery', name: 'Выпечка' },
  { id: 'hot', name: 'Горячее' },
  { id: 'salads', name: 'Салаты' },
  { id: 'drinks', name: 'Напитки' },
]);

// Common allergen labels used by the kitchen (kept as plain Russian strings so
// they can be shown to pupils/parents without extra translation).
export const KNOWN_ALLERGENS = Object.freeze([
  'глютен', 'молоко', 'яйцо', 'рыба', 'соя', 'орехи',
]);

export const SAMPLE_MENU = Object.freeze([
  // ── Выпечка ──────────────────────────────────────────────────────────────
  {
    id: 'bakery-cinnamon-bun', name: 'Булочка с корицей', price: 35,
    category: 'bakery', available: true, allergens: ['глютен', 'молоко'],
    nutrition: { calories: 290, protein: 7, fat: 8, carbs: 47 },
  },
  {
    id: 'bakery-sausage-in-dough', name: 'Сосиска в тесте', price: 55,
    category: 'bakery', available: true, allergens: ['глютен', 'соя'],
    nutrition: { calories: 320, protein: 11, fat: 18, carbs: 28 },
  },
  {
    id: 'bakery-potato-pie', name: 'Пирожок с картошкой', price: 40,
    category: 'bakery', available: true, allergens: ['глютен'],
    nutrition: { calories: 230, protein: 5, fat: 7, carbs: 36 },
  },
  {
    id: 'bakery-cabbage-pie', name: 'Пирожок с капустой', price: 35,
    category: 'bakery', available: true, allergens: ['глютен'],
    nutrition: { calories: 210, protein: 5, fat: 6, carbs: 34 },
  },
  {
    id: 'bakery-cottage-vatrushka', name: 'Ватрушка с творогом', price: 45,
    category: 'bakery', available: true, allergens: ['глютен', 'молоко', 'яйцо'],
    nutrition: { calories: 260, protein: 12, fat: 9, carbs: 33 },
  },
  {
    id: 'bakery-cottage-sochen', name: 'Сочень с творогом', price: 45,
    category: 'bakery', available: true, allergens: ['глютен', 'молоко', 'яйцо'],
    nutrition: { calories: 250, protein: 13, fat: 8, carbs: 31 },
  },

  // ── Горячее ──────────────────────────────────────────────────────────────
  {
    id: 'hot-chicken-noodle-soup', name: 'Суп куриный с вермишелью', price: 60,
    category: 'hot', available: true, allergens: ['глютен'],
    nutrition: { calories: 180, protein: 12, fat: 6, carbs: 18 },
  },
  {
    id: 'hot-borsch', name: 'Борщ со сметаной', price: 65,
    category: 'hot', available: true, allergens: ['молоко'],
    nutrition: { calories: 210, protein: 9, fat: 10, carbs: 20 },
  },
  {
    id: 'hot-oat-porridge', name: 'Каша овсяная молочная', price: 45,
    category: 'hot', available: true, allergens: ['глютен', 'молоко'],
    nutrition: { calories: 230, protein: 8, fat: 7, carbs: 33 },
  },
  {
    id: 'hot-mash-and-cutlet', name: 'Картофельное пюре с котлетой', price: 90,
    category: 'hot', available: true, allergens: ['молоко', 'глютен'],
    nutrition: { calories: 340, protein: 14, fat: 16, carbs: 35 },
  },
  {
    id: 'hot-macaroni-cheese', name: 'Макароны с сыром', price: 70,
    category: 'hot', available: true, allergens: ['глютен', 'молоко'],
    nutrition: { calories: 310, protein: 11, fat: 10, carbs: 44 },
  },
  {
    id: 'hot-omelet-peas', name: 'Омлет с зелёным горошком', price: 55,
    category: 'hot', available: true, allergens: ['яйцо', 'молоко'],
    nutrition: { calories: 220, protein: 13, fat: 14, carbs: 8 },
  },
  {
    id: 'hot-chicken-plov', name: 'Плов с курицей', price: 85,
    category: 'hot', available: true, allergens: [],
    nutrition: { calories: 380, protein: 15, fat: 14, carbs: 48 },
  },
  {
    id: 'hot-baked-fish-veg', name: 'Рыба запечённая с овощами', price: 95,
    category: 'hot', available: true, allergens: ['рыба'],
    nutrition: { calories: 240, protein: 18, fat: 9, carbs: 20 },
  },

  // ── Салаты ───────────────────────────────────────────────────────────────
  {
    id: 'salad-fresh-vegetables', name: 'Салат из свежих овощей', price: 40,
    category: 'salads', available: true, allergens: [],
    nutrition: { calories: 90, protein: 3, fat: 5, carbs: 8 },
  },
  {
    id: 'salad-vitaminny', name: 'Салат «Витаминный» (капуста и морковь)', price: 35,
    category: 'salads', available: true, allergens: [],
    nutrition: { calories: 80, protein: 2, fat: 4, carbs: 9 },
  },
  {
    id: 'salad-carrot-apple', name: 'Салат морковный с яблоком', price: 35,
    category: 'salads', available: true, allergens: [],
    nutrition: { calories: 95, protein: 2, fat: 3, carbs: 15 },
  },
  {
    id: 'salad-beet-prunes', name: 'Свёкла с черносливом', price: 35,
    category: 'salads', available: true, allergens: [],
    nutrition: { calories: 110, protein: 2, fat: 4, carbs: 17 },
  },
  {
    id: 'salad-cucumber-egg', name: 'Салат с огурцом и яйцом', price: 45,
    category: 'salads', available: true, allergens: ['яйцо'],
    nutrition: { calories: 120, protein: 6, fat: 8, carbs: 6 },
  },

  // ── Напитки ──────────────────────────────────────────────────────────────
  {
    id: 'drink-black-tea', name: 'Чай чёрный с сахаром', price: 20,
    category: 'drinks', available: true, allergens: [],
    nutrition: { calories: 60, protein: 0, fat: 0, carbs: 15 },
  },
  {
    id: 'drink-green-tea', name: 'Чай зелёный без сахара', price: 20,
    category: 'drinks', available: true, allergens: [],
    nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  },
  {
    id: 'drink-cocoa', name: 'Какао на молоке', price: 30,
    category: 'drinks', available: true, allergens: ['молоко'],
    nutrition: { calories: 150, protein: 6, fat: 5, carbs: 20 },
  },
  {
    id: 'drink-dried-fruit-kompot', name: 'Компот из сухофруктов', price: 25,
    category: 'drinks', available: true, allergens: [],
    nutrition: { calories: 90, protein: 0, fat: 0, carbs: 22 },
  },
  {
    // Временно в стоп-листе — демонстрирует разницу между видом ученика и кухни.
    id: 'drink-berry-kisel', name: 'Кисель ягодный', price: 25,
    category: 'drinks', available: false, allergens: [],
    nutrition: { calories: 100, protein: 0, fat: 0, carbs: 25 },
  },
  {
    id: 'drink-apple-juice', name: 'Сок яблочный, 200 мл', price: 35,
    category: 'drinks', available: true, allergens: [],
    nutrition: { calories: 90, protein: 0, fat: 0, carbs: 22 },
  },
  {
    id: 'drink-milk', name: 'Молоко, 200 мл', price: 30,
    category: 'drinks', available: true, allergens: ['молоко'],
    nutrition: { calories: 100, protein: 6, fat: 5, carbs: 9 },
  },
  {
    id: 'drink-water', name: 'Вода питьевая, 0,5 л', price: 20,
    category: 'drinks', available: true, allergens: [],
    nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  },
]);