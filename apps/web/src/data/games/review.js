// Итог проверки каждого файла вопросов тремя ИИ-критиками: фактчекер (ответ верный и единственный),
// методист (тема и сложность по ФОП для класса), детский редактор (понятно и безопасно для возраста).
// pass = все замечания исправлены (data/games/fixes.js). Отчёт с отклонёнными вопросами: docs/school-games/REVIEW.md.
const ok = { factcheck: 'pass', methodist: 'pass', editor: 'pass', date: '2026-10-21' };
export const REVIEW = {
  russian: ok, litread: ok, literature: ok, english: ok, math: ok, algebra: ok, geometry: ok, prob: ok,
  informatics: ok, history: ok, social: ok, geography: ok, physics: ok, chemistry: ok, biology: ok, world: ok,
  orkse: ok, dnkr: ok, art: ok, music: ok, tech: ok, pe: ok, obzr: ok,
};
