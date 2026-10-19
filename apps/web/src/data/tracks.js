// Versions (tracks) of the tutor. One app, four modes: they change Svetlana's tone, pace and focus.
// Official names come from 273-ФЗ «Об образовании в РФ» (ред. от 04.08.2026):
//  - ст. 22 ч. 9: обучающиеся с девиантным (общественно опасным) поведением, нуждающиеся в особых условиях
//    воспитания, обучения и требующие специального педагогического подхода (СУВУ открытого и закрытого типа);
//  - ст. 86: программы ООО/СОО, интегрированные с дополнительными общеразвивающими программами, имеющими целью
//    подготовку несовершеннолетних обучающихся к военной или иной государственной службе (кадетская школа,
//    кадетский (морской кадетский) корпус, казачий кадетский корпус и др.);
//  - лицеи и гимназии: углублённое изучение отдельных учебных предметов (углублённый уровень ФОП) и профильное обучение.
// Learner-facing labels are neutral on purpose: a child never sees words like «девиантный».

export const TRACKS = [
  {
    id: 'base',
    emoji: '📘',
    title: { ru: 'Базовая', en: 'Standard' },
    desc: { ru: 'Общеобразовательная программа по ФОП, базовый уровень.', en: 'General school programme (federal curriculum), standard level.' },
    audience: { ru: 'Общеобразовательная школа', en: 'Mainstream school' },
    level: 'базовый',
    prompt: '',
  },
  {
    id: 'cadet',
    emoji: '🎖️',
    title: { ru: 'Кадетская', en: 'Cadet' },
    desc: { ru: 'Для кадетских школ и корпусов: чёткий режим, дисциплина, уставной стиль, акцент на ОБЗР, истории, физкультуре.', en: 'For cadet schools and corps: clear routine, discipline, focus on safety, history and PE.' },
    audience: { ru: 'Кадетская школа, кадетский (морской кадетский) корпус, казачий кадетский корпус (ст. 86 273-ФЗ)', en: 'Cadet school / cadet corps (Art. 86 of the Education Law)' },
    level: 'базовый',
    prompt: 'Learner track: cadet school. Use a clear, structured, respectful tone, like a fair instructor. Short instructions, numbered steps, a clear goal for each exercise. Praise discipline and effort. Where natural, use topics of service, duty, teamwork, history of the Fatherland, sport, safety and orienteering. Address the learner politely; no slang.',
  },
  {
    id: 'lyceum',
    emoji: '🎓',
    title: { ru: 'Лицейская', en: 'Advanced' },
    desc: { ru: 'Для лицеев, гимназий и профильных классов: углублённый уровень, олимпиадные и исследовательские задания.', en: 'For lyceums, gymnasiums and specialised classes: advanced level, olympiad and research tasks.' },
    audience: { ru: 'Лицей, гимназия, класс с углублённым изучением предметов', en: 'Lyceum, gymnasium, advanced classes' },
    level: 'углублённый',
    prompt: 'Learner track: advanced (lyceum / gymnasium). Raise the challenge: richer vocabulary, complex structures, follow-up "why" questions, short reasoning and research-style tasks, olympiad-style puzzles. Expect precise answers and point out subtle mistakes, but stay encouraging.',
  },
  {
    id: 'care',
    emoji: '🤝',
    title: { ru: 'Поддержка', en: 'Support' },
    desc: { ru: 'Для ребят, которым нужен особый педагогический подход: короткие шаги, много поддержки, без давления.', en: 'For learners who need a special teaching approach: small steps, lots of support, no pressure.' },
    audience: { ru: 'Обучающиеся, требующие специального педагогического подхода, в т. ч. СУВУ открытого и закрытого типа (ст. 22 ч. 9 273-ФЗ)', en: 'Learners needing a special teaching approach, incl. special educational institutions (Art. 22 p. 9)' },
    level: 'базовый',
    prompt: 'Learner track: special teaching approach (support). Be calm, warm and respectful; never shame, threaten, label or lecture. One small step at a time, very short sentences, quick wins, concrete praise for effort. Offer a choice between two tasks. Use everyday topics: sport, music, games, work skills, future plans. If the learner is rude or refuses, stay calm, do not argue, and gently offer an easy task. If the learner mentions danger, abuse or self-harm, answer briefly with care and advise talking to a trusted adult or calling the Russian children helpline 8-800-2000-122 (free).',
  },
];

export const DEFAULT_TRACK = 'base';
export const trackById = (id) => TRACKS.find((t) => t.id === id) || TRACKS[0];

// Current track from saved preferences (works outside React, e.g. in AI tasks).
export function currentTrack() {
  try {
    const p = JSON.parse(localStorage.getItem('aet_prefs') || '{}');
    return trackById(p && p.track);
  } catch {
    return TRACKS[0];
  }
}
