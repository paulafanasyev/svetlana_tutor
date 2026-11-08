// Reproducible grade / difficulty / context tagging for the English core (P0.1).
// CEFR level → Russian school grade band (English starts in grade 2; ОГЭ ≈ B1, ЕГЭ ≈ B2).
// Every vocab / grammar / listening item gets: grades [lo,hi], difficulty 1–4, context (situational register).

export const LEVEL_GRADES = { A1: [2, 4], A2: [5, 7], B1: [8, 9], B2: [10, 11] };
export const LEVEL_DIFFICULTY = { A1: 1, A2: 2, B1: 3, B2: 4 };

// A situational register, distinct from the lexical topic: where the language is used.
const TOPIC_CONTEXT = {
  basics: 'personal', family: 'personal', feelings: 'personal',
  food: 'daily-life', shopping: 'daily-life', city: 'daily-life',
  travel: 'travel-nature', nature: 'travel-nature',
  school: 'academic-professional', work: 'academic-professional', technology: 'academic-professional',
  hobbies: 'leisure',
};

export function tagsFor(level, topic) {
  const grades = LEVEL_GRADES[level] || LEVEL_GRADES.A2;
  return {
    grades: [...grades],
    difficulty: LEVEL_DIFFICULTY[level] || 2,
    context: TOPIC_CONTEXT[topic] || 'daily-life',
  };
}

// Attach tags without disturbing existing fields; strip legacy Vietnamese (app is ru/en only).
export function tagItem(item, skill) {
  const { vi, ...rest } = item;
  const explain = rest.explain ? (() => { const { vi: _v, ...e } = rest.explain; return e; })() : undefined;
  const out = { ...rest, skill, ...tagsFor(rest.level, rest.topic || topicOf(skill, rest)) };
  if (explain) out.explain = explain;
  return out;
}

function topicOf(skill, item) {
  if (skill === 'listening') return 'basics';
  return item.topic || 'basics';
}