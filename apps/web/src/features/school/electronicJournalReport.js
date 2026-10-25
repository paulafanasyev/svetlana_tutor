const MARKS = [2, 3, 4, 5];
const KINDS = ['lesson', 'quiz', 'homework', 'note'];

const validDate = (value) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(new Date(value + 'T12:00:00').getTime());

const markOf = (value) => {
  const n = Number(value);
  return value !== null && value !== undefined && value !== '' && Number.isInteger(n) && MARKS.includes(n) ? n : null;
};

const labelDate = (value) => validDate(value)
  ? new Date(value + 'T12:00:00').toLocaleDateString('ru-RU')
  : '';

const percentage = (value) => value.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + '%';

const kindTitle = (kind) => ({
  lesson: 'урок',
  quiz: 'проверочная работа',
  homework: 'домашняя работа',
  note: 'заметка',
}[kind] || 'другая запись');

function filterPeriod(entries, start, end) {
  const startAt = validDate(start) ? new Date(start + 'T00:00:00').getTime() : null;
  const endAt = validDate(end) ? new Date(new Date(end + 'T00:00:00').getTime() + 86400000) : null;
  if (startAt !== null && endAt !== null && startAt >= endAt) return [];
  return entries.filter((entry) => {
    const at = Number(entry.at);
    if (!Number.isFinite(at)) return false;
    return (startAt === null || at >= startAt) && (endAt === null || at < endAt);
  });
}

/**
 * Summarizes the existing electronic journal returned by api.listJournal.
 * Names, student IDs, comments and raw student-specific records are never exported.
 * Percentages are entry-weighted (not per-student averages) and do not describe attendance.
 */
export function buildElectronicJournalReport(entries, {
  className = '',
  periodStart = '',
  periodEnd = '',
  generatedAt = new Date(),
} = {}) {
  const safeEntries = (Array.isArray(entries) ? entries : []).filter((entry) => entry && typeof entry === 'object');
  const invalidPeriod = validDate(periodStart) && validDate(periodEnd)
    && new Date(periodStart + 'T00:00:00').getTime() >= new Date(periodEnd + 'T00:00:00').getTime();
  const filtered = invalidPeriod ? [] : filterPeriod(safeEntries, periodStart, periodEnd);
  const graded = filtered.map((entry) => ({ entry, mark: markOf(entry.mark) })).filter((item) => item.mark !== null);
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0 };
  graded.forEach(({ mark }) => { counts[mark] += 1; });
  const mean = graded.length ? graded.reduce((total, item) => total + item.mark, 0) / graded.length : null;
  const success = graded.length ? graded.filter((item) => item.mark >= 3).length / graded.length * 100 : null;
  const quality = graded.length ? graded.filter((item) => item.mark >= 4).length / graded.length * 100 : null;
  const byKind = Object.fromEntries(KINDS.map((kind) => [kind, filtered.filter((entry) => entry.kind === kind).length]));
  const studentsWithEntries = new Set(filtered.map((entry) => String(entry.studentId || '')).filter(Boolean));
  const studentsWithMarks = new Set(graded.map(({ entry }) => String(entry.studentId || '')).filter(Boolean));
  const topics = new Map();
  for (const entry of filtered) {
    const topic = typeof entry.topic === 'string' && entry.topic.trim() ? entry.topic.trim().slice(0, 100) : 'Тема не указана';
    topics.set(topic, (topics.get(topic) || 0) + 1);
  }
  const topTopics = Array.from(topics.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru')).slice(0, 8);
  const stamp = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  const dateLabel = Number.isNaN(stamp.getTime()) ? 'не указана' : stamp.toLocaleDateString('ru-RU');
  const periodLabel = invalidPeriod ? 'ОШИБКА: начало периода не может быть позже или равно концу' : (periodStart || periodEnd
    ? (labelDate(periodStart) || 'начало не задано') + ' — ' + (labelDate(periodEnd) || 'конец не задан')
    : 'все записи, возвращённые журналом');
  const kindLines = KINDS.filter((kind) => byKind[kind] > 0).map((kind) => '- ' + kindTitle(kind) + ': ' + byKind[kind] + '.');
  const topicLines = topTopics.map(([topic, amount]) => '- ' + topic + ': ' + amount + ' записей.');

  const markdown = [
    '# Сводный отчёт по электронному журналу',
    '',
    'Класс / группа: ' + (String(className || '').trim() || '[не указано]'),
    'Период: ' + periodLabel,
    'Дата формирования: ' + dateLabel,
    'Источник: записи, доступные текущему учителю через электронный журнал приложения.',
    '',
    '## Объём записей',
    ...(invalidPeriod ? ['- ОШИБКА: проверьте даты периода; начальная дата должна быть раньше конечной.'] : []),
    '- Записей в выбранном периоде: ' + filtered.length + '.',
    '- Уникальных учащихся, у которых есть записи: ' + studentsWithEntries.size + '.',
    '- Уникальных учащихся хотя бы с одной итоговой отметкой: ' + studentsWithMarks.size + '.',
    '',
    '## Типы записей',
    ...(kindLines.length ? kindLines : ['- В выбранном периоде записей нет.']),
    '',
    '## Итоговые отметки, сохранённые учителем',
    '- Записей с валидной отметкой 2–5: ' + graded.length + '.',
    '- Распределение по записям: «5» — ' + counts[5] + '; «4» — ' + counts[4] + '; «3» — ' + counts[3] + '; «2» — ' + counts[2] + '.',
    '- Средняя отметка по оценённым записям: ' + (mean === null ? 'не рассчитывается — нет оценённых записей' : mean.toLocaleString('ru-RU', { maximumFractionDigits: 2 })) + '.',
    '- Успеваемость по оценённым записям (3–5): ' + (success === null ? 'не рассчитывается — нет оценённых записей' : percentage(success)) + '.',
    '- Качество по оценённым записям (4–5): ' + (quality === null ? 'не рассчитывается — нет оценённых записей' : percentage(quality)) + '.',
    '',
    '## Темы с наибольшим числом записей',
    ...(topicLines.length ? topicLines : ['- Нет данных о темах.']),
    '',
    '## Границы интерпретации',
    '- Проценты и средняя отметка рассчитаны по записям журнала; ученик с несколькими записями может учитываться несколько раз.',
    '- Тип записи «урок» не доказывает фактическую посещаемость. Этот модуль не является табелем посещаемости.',
    '- Отсутствующая отметка не считается двойкой и не входит в распределение оценок.',
    '- Сводка не включает ФИО, идентификаторы, индивидуальные комментарии и тексты записей.',
    '- Перед передачей администрации сверяйте период, критерии расчёта и локальную форму отчёта школы.',
  ].join('\n');

  return {
    className: String(className || ''),
    invalidPeriod,
    periodStart: validDate(periodStart) ? periodStart : '',
    periodEnd: validDate(periodEnd) ? periodEnd : '',
    entryCount: filtered.length,
    gradedEntryCount: graded.length,
    studentsWithEntries: studentsWithEntries.size,
    studentsWithMarks: studentsWithMarks.size,
    markCounts: counts,
    meanMark: mean,
    successRate: success,
    qualityRate: quality,
    byKind,
    topTopics,
    markdown,
  };
}
