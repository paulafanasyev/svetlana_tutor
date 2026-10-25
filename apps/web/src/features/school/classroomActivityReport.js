const array = (value) => Array.isArray(value) ? value : [];
const integerMark = (value) => {
  const mark = Number(value);
  return Number.isInteger(mark) && [2, 3, 4, 5].includes(mark) ? mark : null;
};
const rate = (value) => Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + '%';

/**
 * Creates an aggregate report from the local "Classes & chat" store.
 * It deliberately excludes student names, answer text, AI suggestions and attendance claims.
 */
export function buildClassroomActivitySnapshot(db, classId, generatedAt = new Date()) {
  const cls = array(db?.classes).find((item) => item && item.id === classId);
  if (!cls) return null;

  const members = new Set(array(cls.members).map((member) => String(member?.id || '')).filter(Boolean));
  const homework = array(db?.homework).filter((item) => item && item.classId === classId);
  const homeworkById = new Map(homework.map((item) => [item.id, item]));
  const candidates = array(db?.submissions).filter((item) =>
    item && homeworkById.has(item.hwId) && members.has(String(item.studentId || ''))
  );

  // One current submission per assignment/student pair; if bad legacy data has duplicates, retain the latest.
  const unique = new Map();
  for (const item of candidates) {
    const key = String(item.hwId) + '|' + String(item.studentId);
    const previous = unique.get(key);
    if (!previous || Number(item.at || 0) >= Number(previous.at || 0)) unique.set(key, item);
  }
  const submissions = Array.from(unique.values());
  const reviewed = submissions.map((item) => integerMark(item.mark)).filter((mark) => mark !== null);
  const markCounts = { 5: 0, 4: 0, 3: 0, 2: 0 };
  reviewed.forEach((mark) => { markCounts[mark] += 1; });

  const expectedResponses = homework.length * members.size;
  const receivedResponses = submissions.length;
  const pendingResponses = Math.max(0, expectedResponses - receivedResponses);
  const completionRate = expectedResponses > 0 ? (receivedResponses / expectedResponses) * 100 : null;
  const averageMark = reviewed.length ? reviewed.reduce((sum, mark) => sum + mark, 0) / reviewed.length : null;
  const stamp = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  const dateLabel = Number.isNaN(stamp.getTime()) ? 'дата не указана' : stamp.toLocaleDateString('ru-RU');

  const lines = [
    '# Сводка активности класса из локального модуля',
    '',
    'Класс: ' + String(cls.title || '[класс не указан]'),
    'Предмет в настройках класса: ' + String(cls.subject || '[предмет не указан]'),
    'Дата формирования: ' + dateLabel,
    'Источник: данные текущего браузера из модуля «Классы и чат».',
    '',
    '## Задания и сдача работ',
    '- Участников в текущем составе класса: ' + members.size,
    '- Домашних заданий в модуле: ' + homework.length,
    '- Возможных ответов по текущему составу и заданиям: ' + expectedResponses,
    '- Уникальных полученных работ: ' + receivedResponses,
    '- Нет ответа по заданию: ' + pendingResponses,
    '- Доля полученных работ: ' + (completionRate === null ? 'не рассчитывается: пока нет заданий или участников' : rate(completionRate)),
    '',
    '## Оценки за домашние задания, выставленные учителем',
    '- Работ с сохранённой итоговой отметкой: ' + reviewed.length,
    '- Распределение: «5» — ' + markCounts[5] + '; «4» — ' + markCounts[4] + '; «3» — ' + markCounts[3] + '; «2» — ' + markCounts[2] + '.',
    '- Средняя отметка по этим работам: ' + (averageMark === null ? 'не рассчитывается: нет оценённых работ' : averageMark.toLocaleString('ru-RU', { maximumFractionDigits: 2 })),
    '',
    '## Ограничения',
    '- Это сводка только по заданиям и ответам, сохранённым в локальном модуле; она не описывает все оценки по предмету.',
    '- В расчёт отметок входят только сохранённые отметки учителя. Предварительные оценки локального ИИ не учитываются.',
    '- Модуль не ведёт посещаемость; по этой сводке нельзя делать выводы о пропусках или причинах невыполнения.',
    '- Подсчитанный процент — доля полученных ответов от произведения числа заданий на текущий состав класса; он не является официальным показателем успеваемости.',
    '- В сводку намеренно не включаются имена учащихся, тексты ответов и комментарии.',
  ];
  return {
    classId,
    classTitle: String(cls.title || ''),
    subject: String(cls.subject || ''),
    memberCount: members.size,
    homeworkCount: homework.length,
    expectedResponses,
    receivedResponses,
    pendingResponses,
    completionRate,
    reviewedCount: reviewed.length,
    markCounts,
    averageMark,
    markdown: lines.join('\n'),
  };
}
