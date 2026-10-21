// Вопросы грузятся только когда ребёнок открыл игру: один файл на предмет (все классы внутри).
import { normalizeGrade, mergeMore } from './subjects.js';
import { REVIEW } from './review.js';

export const LOADERS = {
  russian: () => import('./packs/russian.json'),
  litread: () => import('./packs/litread.json'),
  literature: () => import('./packs/literature.json'),
  english: () => import('./packs/english.json'),
  math: () => import('./packs/math.json'),
  algebra: () => import('./packs/algebra.json'),
  geometry: () => import('./packs/geometry.json'),
  prob: () => import('./packs/prob.json'),
  informatics: () => import('./packs/informatics.json'),
  history: () => import('./packs/history.json'),
  social: () => import('./packs/social.json'),
  geography: () => import('./packs/geography.json'),
  physics: () => import('./packs/physics.json'),
  chemistry: () => import('./packs/chemistry.json'),
  biology: () => import('./packs/biology.json'),
  world: () => import('./packs/world.json'),
  orkse: () => import('./packs/orkse.json'),
  dnkr: () => import('./packs/dnkr.json'),
  art: () => import('./packs/art.json'),
  music: () => import('./packs/music.json'),
  tech: () => import('./packs/tech.json'),
  pe: () => import('./packs/pe.json'),
  obzr: () => import('./packs/obzr.json'),
};

// Дополнительные вопросы (вторая дюжина): more/<slug>.json, тот же формат { grades: { "N": { quiz, pairs? } } }.
// Дописываются после вопросов из packs/, поэтому номера q1…q6 и правки критиков к ним не сдвигаются.
const MORE = import.meta.glob('./more/*.json');

const cache = new Map();
const cached = (key, load) => { if (!cache.has(key)) cache.set(key, load().then((m) => m.default || m)); return cache.get(key); };

// → { subject, grade, quiz, pairs, review } или null, если вопросов для класса нет.
export async function loadPack(slug, grade) {
  const load = LOADERS[slug];
  if (!load) return null;
  const moreLoad = MORE[`./more/${slug}.json`];
  const [file, more] = await Promise.all([cached(slug, load), moreLoad ? cached(`more:${slug}`, moreLoad) : null]);
  const g = normalizeGrade(slug, grade, mergeMore(file.grades?.[String(grade)], more?.grades?.[String(grade)]));
  return g ? { ...g, review: REVIEW[slug] || null } : null;
}
