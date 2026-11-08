// Игры по школьным предметам: какие предметы и классы есть (по учебному плану ФОП) и где лежат вопросы.
// Без React и без Vite: модуль читают и приложение, и тест (node --test).
import { PLANS } from '../../features/school/fopPlan.js';
import { applyFixes } from './fixes.js';

// Название предмета в плане → файл с вопросами data/games/packs/<slug>.json (внутри вопросы по классам).
// «Алгебра» (7–9) и «Алгебра и начала математического анализа» (10–11) лежат в одном файле: классы не пересекаются.
export const SLUGS = {
  'Русский язык': 'russian', 'Литературное чтение': 'litread', 'Литература': 'literature', 'Иностранный язык': 'english',
  'Математика': 'math', 'Алгебра': 'algebra', 'Алгебра и начала математического анализа': 'algebra', 'Геометрия': 'geometry',
  'Вероятность и статистика': 'prob', 'Информатика': 'informatics', 'История': 'history', 'Обществознание': 'social',
  'География': 'geography', 'Физика': 'physics', 'Химия': 'chemistry', 'Биология': 'biology', 'Окружающий мир': 'world',
  'Основы религиозных культур и светской этики': 'orkse', 'Духовно-нравственная культура России': 'dnkr',
  'Изобразительное искусство': 'art', 'Музыка': 'music', 'Труд (технология)': 'tech', 'Физическая культура': 'pe',
  'Основы безопасности и защиты Родины': 'obzr',
};

export const ICONS = {
  russian: '✍️', litread: '📖', literature: '📖', english: '🔤', math: '🧮', algebra: '🧮', geometry: '📐', prob: '🎲',
  informatics: '💻', history: '🏛️', social: '⚖️', geography: '🌍', physics: '🧲', chemistry: '⚗️', biology: '🌿', world: '🌳',
  orkse: '🕊️', dnkr: '🕊️', art: '🎨', music: '🎵', tech: '🛠️', pe: '⚽', obzr: '🛡️',
};

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Все клетки плана с часами > 0: { subject, grade, slug }.
export function gameCells() {
  const out = [];
  for (const plan of Object.values(PLANS)) {
    for (const [subject, hours] of plan.rows) {
      plan.grades.forEach((grade, i) => { if (hours[i] > 0) out.push({ subject, grade, slug: SLUGS[subject] }); });
    }
  }
  return out;
}

export const subjectsOfGrade = (grade) => gameCells().filter((c) => c.grade === grade);

// Режимы игры. Битва и Квест берут вопросы с вариантами, Пары берут пары «термин — значение».
// nameKey / descKey — ключи в i18n/cabinets.js (sg.<mode>.name / sg.<mode>.desc).
export const MODES = [
  { id: 'battle', icon: '⚔️', nameKey: 'sg.battle.name', descKey: 'sg.battle.desc' },
  { id: 'quest', icon: '🗺️', nameKey: 'sg.quest.name', descKey: 'sg.quest.desc' },
  { id: 'pairs', icon: '🧠', nameKey: 'sg.pairs.name', descKey: 'sg.pairs.desc' },
  { id: 'memory', icon: '🧠', nameKey: 'sg.memory.name', descKey: 'sg.memory.desc' },
];

// Класс из packs/ + класс из more/ → один класс: новые вопросы и пары идут в конец.
export function mergeMore(base, more) {
  if (!base || !more) return base;
  return { ...base, quiz: [...(base.quiz || []), ...(more.quiz || [])], pairs: [...(base.pairs || []), ...(more.pairs || [])] };
}

// Пакет из файла → удобный вид с id. Формат файла: { quiz: [{t, q, o: [4], a, e}], pairs: [[термин, значение]] }.
// Перед показом поверх файла накладываются исправления критиков (data/games/fixes.js).
export function normalizeGrade(slug, grade, raw) {
  if (!raw) return null;
  const g = applyFixes(slug, grade, raw);
  return {
    slug,
    subject: g.subject,
    grade,
    quiz: (g.quiz || []).map((x, i) => ({ id: `${slug}-${grade}-q${i + 1}`, topic: x.t, q: x.q, options: x.o, answer: x.a, explain: x.e })),
    pairs: (g.pairs || []).map(([term, meaning], i) => ({ id: `${slug}-${grade}-p${i + 1}`, term, meaning })),
  };
}

// Трековые слои контента. Вопросы могут иметь необязательное поле "track":
//   - "lyceum" — олимпиадные задачи (для лицейского трека);
//   - "cadet" — военный/кадетский контекст;
//   - "care" — микрошаги, упрощённые задания (для трека поддержки);
//   - без поля — базовый уровень, показывается всем.
export const TRACK_FILTERS = ['base', 'cadet', 'lyceum', 'care'];

// Отфильтровать сырой объект класса { quiz, pairs } по текущему треку.
// Базовые вопросы (без track) всегда включаются; трековые — только если track совпадает.
// track === 'base' || track === undefined → только базовые (без track-поля).
export function filterByTrack(raw, track) {
  if (!raw) return raw;
  const t = track || 'base';
  const filterQuiz = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.filter((q) => {
      const qTrack = q.track || 'base';
      if (t === 'base') return qTrack === 'base';
      // Для не-base треков: показываем базовые + вопросы своего трека
      return qTrack === 'base' || qTrack === t;
    });
  };
  const filterPairs = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.filter((p) => {
      const pTrack = (Array.isArray(p) && p[2]) || 'base';
      if (t === 'base') return pTrack === 'base';
      return pTrack === 'base' || pTrack === t;
    });
  };
  return { ...raw, quiz: filterQuiz(raw.quiz), pairs: filterPairs(raw.pairs) };
}

// Доступные треки для UI-селектора в играх.
export function availableTracks() {
  return TRACK_FILTERS.map((id) => {
    const labels = {
      base: { ru: 'Базовый', en: 'Standard', emoji: '📘' },
      cadet: { ru: 'Кадетский', en: 'Cadet', emoji: '🎖️' },
      lyceum: { ru: 'Лицейский', en: 'Advanced', emoji: '🎓' },
      care: { ru: 'Поддержка', en: 'Support', emoji: '🤝' },
    };
    return { id, ...labels[id] };
  });
}
