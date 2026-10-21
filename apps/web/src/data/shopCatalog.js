// Shop catalog: names, look and PRICES. The demo backend (core/api.js) takes the price from here, never from
// the button that was pressed; the server has the same table in apps/api/src/lib/catalog.js (keep in sync).
export const THEMES = [{ id: 'candy', price: 0, sw: ['#7c3aed', '#a855f7'] }, { id: 'ocean', price: 200, sw: ['#0284c7', '#06b6d4'] },
  { id: 'sunset', price: 200, sw: ['#e11d48', '#f97316'] }, { id: 'forest', price: 200, sw: ['#059669', '#84cc16'] },
  { id: 'galaxy', price: 250, sw: ['#111023', '#8b5cf6'] }];
export const MUSIC = [{ id: 'lofi', price: 0, icon: '🎧' }, { id: 'classical', price: 150, icon: '🎻' }, { id: 'electronic', price: 150, icon: '🎛️' }, { id: 'ambient', price: 150, icon: '🌌' }];
export const FRAMES = [{ id: 'none', price: 0, icon: '⬜' }, { id: 'gold', price: 100, icon: '🥇' }, { id: 'neon', price: 120, icon: '💠' }, { id: 'leaf', price: 100, icon: '🍃' }];
export const TEACHER_PRICE = 300;
const TEACHER_IDS = ['emma', 'james', 'sofia', 'alex'];

const TABLE = {
  theme: Object.fromEntries(THEMES.map((x) => [x.id, x.price])),
  musicStyle: Object.fromEntries(MUSIC.map((x) => [x.id, x.price])),
  frame: Object.fromEntries(FRAMES.map((x) => [x.id, x.price])),
  teacher: Object.fromEntries(TEACHER_IDS.map((id) => [id, TEACHER_PRICE])),
};

/** Price of an item, or null if it is not sold. */
export function priceOf(itemType, itemId) {
  const group = Object.prototype.hasOwnProperty.call(TABLE, itemType) ? TABLE[itemType] : null;
  return group && Object.prototype.hasOwnProperty.call(group, itemId) ? group[itemId] : null;
}
