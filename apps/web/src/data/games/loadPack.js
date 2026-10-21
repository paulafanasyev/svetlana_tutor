// Вопросы грузятся только когда ребёнок открыл игру: один файл на предмет (все классы внутри).
import { normalizeGrade } from './subjects.js';
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

const cache = new Map();

// → { subject, grade, quiz, pairs, review } или null, если вопросов для класса нет.
export async function loadPack(slug, grade) {
  const load = LOADERS[slug];
  if (!load) return null;
  if (!cache.has(slug)) cache.set(slug, load().then((m) => m.default || m));
  const file = await cache.get(slug);
  const g = normalizeGrade(slug, grade, file.grades?.[String(grade)]);
  return g ? { ...g, review: REVIEW[slug] || null } : null;
}
