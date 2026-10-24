export const TEACHER_DOCUMENTS = [
  { id: 'lesson-plan', title: 'План урока', category: 'Планирование' },
  { id: 'subject-report', title: 'Отчёт по предмету за период', category: 'Отчётность' },
  { id: 'class-report', title: 'Аналитический отчёт по классу', category: 'Отчётность' },
  { id: 'assessment-analysis', title: 'Анализ контрольной работы', category: 'Оценивание' },
  { id: 'remedial-plan', title: 'План коррекционной работы', category: 'Сопровождение обучения' },
  { id: 'individual-support-plan', title: 'Индивидуальный план поддержки ученика', category: 'Сопровождение обучения' },
  { id: 'parent-message', title: 'Сообщение родителям', category: 'Коммуникация' },
  { id: 'parent-meeting-minutes', title: 'Протокол родительского собрания', category: 'Классное руководство' },
  { id: 'class-hour', title: 'План классного часа', category: 'Классное руководство' },
  { id: 'student-characteristic', title: 'Педагогическая характеристика', category: 'Сопровождение обучения' },
  { id: 'explanatory-note', title: 'Объяснительная записка', category: 'Деловые документы' },
  { id: 'teacher-self-analysis', title: 'Самоанализ работы учителя', category: 'Отчётность' },
  { id: 'homework-sheet', title: 'Рабочий лист и ключ ответов', category: 'Учебные материалы' },
];

const value = (form, key, fallback = '[уточнить]') => {
  const current = form && form[key] !== undefined && form[key] !== null ? String(form[key]).trim() : '';
  return current || fallback;
};

const titleOf = (id) => TEACHER_DOCUMENTS.find((item) => item.id === id)?.title || TEACHER_DOCUMENTS[0].title;
const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== '';

function numberField(form, key) {
  if (!isFilled(form?.[key])) return null;
  const n = Number(form[key]);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

export function getGradeCounts(form = {}) {
  const fields = ['five', 'four', 'three', 'two'];
  const parsed = fields.map((key) => numberField(form, key));
  if (parsed.some((n) => n === null || Number.isNaN(n))) return null;
  const [five, four, three, two] = parsed;
  const total = five + four + three + two;
  const assessedRaw = numberField(form, 'studentCount');
  const assessed = assessedRaw === null ? total : assessedRaw;
  if (!Number.isFinite(assessed) || assessed < total || assessed < 1) return null;
  return {
    five, four, three, two, total,
    assessed,
    successRate: ((five + four + three) / assessed) * 100,
    qualityRate: ((five + four) / assessed) * 100,
  };
}

export function validateTeacherDocument(type, form = {}) {
  const errors = [];
  if (!TEACHER_DOCUMENTS.some((item) => item.id === type)) errors.push('Выберите тип документа.');
  for (const key of ['studentCount', 'five', 'four', 'three', 'two']) {
    const n = numberField(form, key);
    if (Number.isNaN(n)) errors.push('Поле «' + key + '» должно быть целым неотрицательным числом.');
  }
  const c = getGradeCounts(form);
  const allMarksEntered = ['five', 'four', 'three', 'two'].every((key) => isFilled(form[key]));
  if (allMarksEntered && c === null) errors.push('Проверьте количество учеников: сумма отметок не должна превышать численность класса.');
  return { ok: errors.length === 0, errors };
}

const percent = (n) => Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + '%';
const meta = (form) => [
  'Организация: ' + value(form, 'schoolName'),
  'Педагог: ' + value(form, 'teacherName'),
  'Должность / роль: ' + value(form, 'position', 'учитель'),
  'Класс / группа: ' + value(form, 'className'),
  'Класс обучения: ' + value(form, 'grade'),
  'Предмет: ' + value(form, 'subject'),
  'Период: ' + value(form, 'period'),
  'Дата составления: ' + value(form, 'date'),
];
const base = (id, form) => [
  '# ' + titleOf(id),
  '',
  ...meta(form),
  '',
  '> ЧЕРНОВИК. Проверьте факты, локальные формы школы, сроки и подписи перед использованием. Этот шаблон сам по себе не является утверждённым официальным документом.',
  '',
];
const optional = (form, key, label) => label + ': ' + value(form, key, 'не указано');
const endNote = [
  '',
  '---',
  'Перед передачей документа проверьте достоверность исходных данных и требования образовательной организации. Не включайте лишние персональные или медицинские сведения.',
].join('\n');

export function buildTeacherDocument(type, form = {}) {
  const header = base(type, form);
  let lines = [];
  switch (type) {
    case 'lesson-plan': {
      const duration = numberField(form, 'durationMinutes');
      const minutes = duration && Number.isFinite(duration) && duration > 0 ? duration : 45;
      const phase1 = Math.max(2, Math.round(minutes * 0.08));
      const phase2 = Math.max(3, Math.round(minutes * 0.12));
      const phase3 = Math.max(5, Math.round(minutes * 0.25));
      const phase4 = Math.max(5, Math.round(minutes * 0.35));
      const phase5 = Math.max(3, minutes - phase1 - phase2 - phase3 - phase4);
      lines = [
        '## Тема', value(form, 'topic'),
        '',
        '## Цель и планируемые результаты',
        '- Цель: ' + value(form, 'goals'),
        '- Планируемые результаты: ' + value(form, 'outcomes'),
        '',
        '## Оборудование и материалы',
        value(form, 'materials'),
        '',
        '## Ход урока (' + minutes + ' минут)',
        '1. Организационный этап и мотивация — ' + phase1 + ' мин. Проверить готовность класса, сформулировать учебную задачу.',
        '2. Актуализация знаний — ' + phase2 + ' мин. Короткое задание по опорным понятиям; зафиксировать типичные затруднения.',
        '3. Изучение / открытие нового — ' + phase3 + ' мин. Объяснение с образцом, визуальной опорой и вопросами на понимание.',
        '4. Практика и дифференциация — ' + phase4 + ' мин. Базовое задание для всех и дополнительный уровень для готовых учеников.',
        '5. Проверка понимания и рефлексия — ' + phase5 + ' мин. Критерии успеха, самооценка, фиксация вопросов.',
        '',
        '## Домашнее задание',
        value(form, 'homework'),
        '',
        '## Что учителю проверить после урока',
        '- Какие результаты достигнуты и каким доказательством это подтверждается.',
        '- Кому нужна дополнительная практика и по какой конкретной теме.',
      ];
      break;
    }
    case 'subject-report': {
      lines = [
        '## Предмет и содержание периода',
        value(form, 'topic'),
        '',
        '## Данные и наблюдаемые результаты',
        '- Объём обучающихся / работ: ' + value(form, 'studentCount'),
        '- Посещаемость и выполнение работ: ' + value(form, 'attendance'),
        '- Сильные стороны: ' + value(form, 'strengths'),
        '- Выявленные затруднения: ' + value(form, 'gaps'),
        '',
        '## Принятые меры и следующие шаги',
        value(form, 'actions'),
        'Срок проверки результата: ' + value(form, 'deadline'),
        '',
        '## Что требуется уточнить',
        '- Сопоставить результаты с рабочей программой, критериями оценивания и календарно-тематическим планом школы.',
        '- Не делать выводов о причинах успеваемости без проверяемых данных.',
      ];
      break;
    }
    case 'class-report': {
      const counts = getGradeCounts(form);
      lines = [
        '## Краткая сводка',
        '- Численность класса: ' + value(form, 'studentCount'),
        '- Посещаемость / полнота данных: ' + value(form, 'attendance'),
        counts
          ? '- Отметки: «5» — ' + counts.five + '; «4» — ' + counts.four + '; «3» — ' + counts.three + '; «2» — ' + counts.two + '. Всего учтено ' + counts.total + ' отметок.'
          : '- Числовые результаты не рассчитаны: заполните все четыре поля количества отметок и проверьте численность класса.',
        counts ? '- Успеваемость по введённым данным (4–5 и 3): ' + percent(counts.successRate) : '- Успеваемость: нет достаточных исходных числовых данных.',
        counts ? '- Качество знаний по введённым данным (4–5): ' + percent(counts.qualityRate) : '- Качество знаний: нет достаточных исходных числовых данных.',
        '',
        '## Положительная динамика / сильные стороны',
        value(form, 'strengths'),
        '',
        '## Проблемные темы и факторы, которые подтверждены наблюдениями',
        value(form, 'gaps'),
        '',
        '## Меры поддержки и контроль результата',
        value(form, 'actions'),
        'Ответственный / срок: ' + value(form, 'deadline'),
        '',
        '## Ограничения анализа',
        'Расчёт отражает только введённые данные. Он не устанавливает причины затруднений и не заменяет анализ по каждому предмету, периоду и утверждённым критериям школы.',
      ];
      break;
    }
    case 'assessment-analysis': {
      lines = [
        '## Контрольная / диагностическая работа',
        value(form, 'topic'),
        '',
        '## Исходные данные',
        '- Количество обучающихся: ' + value(form, 'studentCount'),
        '- Количество проверенных работ: ' + value(form, 'workCount'),
        '- Распределение отметок: 5 — ' + value(form, 'five', 'не введено') + '; 4 — ' + value(form, 'four', 'не введено') + '; 3 — ' + value(form, 'three', 'не введено') + '; 2 — ' + value(form, 'two', 'не введено'),
        '',
        '## Анализ выполнения',
        '- Успешно выполненные элементы: ' + value(form, 'strengths'),
        '- Типичные ошибки / незакреплённые умения: ' + value(form, 'gaps'),
        '',
        '## План устранения затруднений',
        value(form, 'actions'),
        '- Повторная проверка: ' + value(form, 'deadline'),
        '- Критерий результата: заранее определите измеримый признак освоения темы.',
      ];
      break;
    }
    case 'remedial-plan': {
      lines = [
        '## Цель коррекционной работы',
        value(form, 'goals'),
        '',
        '## Подтверждённые пробелы / навыки',
        value(form, 'gaps'),
        '',
        '## Мероприятия',
        '1. Повторное объяснение с другой опорой или примером.',
        '2. Практика от базового задания к самостоятельному применению.',
        '3. Обратная связь по конкретным критериям и разбор ошибок.',
        '4. Короткая повторная диагностика без подсказки.',
        '',
        '## Ответственные, сроки и проверка',
        '- Действия: ' + value(form, 'actions'),
        '- Срок: ' + value(form, 'deadline'),
        '- Критерии успеха: ' + value(form, 'outcomes'),
        '',
        '## Оценка результата',
        'Запишите фактический результат повторной диагностики после её проведения; не подменяйте его прогнозом.',
      ];
      break;
    }
    case 'individual-support-plan': {
      lines = [
        '## Обучающийся',
        'Код / инициалы вместо полного имени: ' + value(form, 'studentAlias'),
        '',
        '## Текущая учебная ситуация (по наблюдаемым фактам)',
        value(form, 'baseline'),
        '',
        '## Цель и ближайшие шаги',
        '- Цель: ' + value(form, 'goals'),
        '- Действия поддержки: ' + value(form, 'support'),
        '- Изменения в заданиях / темпе / форме ответа: ' + value(form, 'actions'),
        '',
        '## Критерии и сроки пересмотра',
        '- Ожидаемый учебный результат: ' + value(form, 'outcomes'),
        '- Дата проверки: ' + value(form, 'deadline'),
        '',
        '## Согласование',
        'При необходимости согласуйте меры с законным представителем и школьной командой сопровождения по правилам организации. Не указывайте медицинские диагнозы и неподтверждённые психологические характеристики.',
      ];
      break;
    }
    case 'parent-message': {
      lines = [
        '## Текст сообщения',
        'Здравствуйте!',
        '',
        value(form, 'topic', 'Пишу, чтобы сообщить о ходе обучения.'),
        '',
        'Наблюдаемые факты: ' + value(form, 'strengths'),
        'Что сейчас требует внимания: ' + value(form, 'gaps'),
        'Предлагаемый следующий шаг: ' + value(form, 'actions'),
        'Срок / удобное время для связи: ' + value(form, 'deadline'),
        '',
        'Спасибо за сотрудничество. Готов(а) обсудить вопросы и согласовать дальнейшие шаги.',
        '',
        'Перед отправкой уберите лишние сведения и проверьте тон сообщения.',
      ];
      break;
    }
    case 'parent-meeting-minutes': {
      lines = [
        '## Повестка',
        value(form, 'agenda'),
        '',
        '## Участники',
        value(form, 'participants'),
        '',
        '## Обсуждение (кратко, без домыслов)',
        value(form, 'topic'),
        '',
        '## Принятые решения',
        value(form, 'decisions'),
        '',
        '## Ответственные и сроки',
        value(form, 'actions'),
        'Контрольная дата: ' + value(form, 'deadline'),
        '',
        'Председатель собрания: [указать]',
        'Секретарь: [указать]',
        'Подписи / подтверждение согласно порядку школы: [указать]',
      ];
      break;
    }
    case 'class-hour': {
      lines = [
        '## Тема классного часа',
        value(form, 'topic'),
        '',
        '## Цель и планируемый результат',
        '- Цель: ' + value(form, 'goals'),
        '- Ожидаемый результат: ' + value(form, 'outcomes'),
        '',
        '## Структура занятия',
        '1. Вступление и правила уважительного обсуждения.',
        '2. Проблемный вопрос / жизненная ситуация, соответствующая возрасту.',
        '3. Работа в парах или группах с распределением ролей.',
        '4. Обсуждение решений и проверка источников информации.',
        '5. Индивидуальная рефлексия и выводы.',
        '',
        '## Материалы и безопасность',
        value(form, 'materials'),
        '',
        '## Продолжение / обратная связь',
        value(form, 'actions'),
      ];
      break;
    }
    case 'student-characteristic': {
      lines = [
        '> Используйте только проверяемые наблюдения, учебные факты и сведения, которые разрешено включать в такой документ.',
        '',
        '## Обучающийся',
        'Код / инициалы: ' + value(form, 'studentAlias'),
        '',
        '## Учебная деятельность',
        value(form, 'baseline'),
        '',
        '## Сильные стороны',
        value(form, 'strengths'),
        '',
        '## Учебные затруднения и условия, в которых они наблюдаются',
        value(form, 'gaps'),
        '',
        '## Оказанная поддержка и её наблюдаемый результат',
        value(form, 'support'),
        '',
        '## Рекомендации по организации обучения',
        value(form, 'actions'),
        '',
        'Не добавляйте медицинские диагнозы, оценочные ярлыки, неподтверждённые причины поведения или сведения о семье, не относящиеся к цели документа.',
      ];
      break;
    }
    case 'explanatory-note': {
      lines = [
        '## Обстоятельства',
        value(form, 'reason'),
        '',
        '## Даты и подтверждающие сведения',
        '- Дата / период: ' + value(form, 'period'),
        '- Подтверждающие документы / факты: ' + value(form, 'evidence'),
        '',
        '## Просьба / пояснение',
        value(form, 'topic'),
        '',
        'Подпись: [указать]',
        'Дата подачи: ' + value(form, 'date'),
      ];
      break;
    }
    case 'teacher-self-analysis': {
      lines = [
        '## Цели на отчётный период',
        value(form, 'goals'),
        '',
        '## Выполненная работа и подтверждения',
        value(form, 'topic'),
        '',
        '## Достигнутые результаты',
        value(form, 'strengths'),
        '',
        '## Затруднения и отклонения от плана',
        value(form, 'gaps'),
        '',
        '## План профессиональных действий',
        value(form, 'actions'),
        'Срок следующего контроля: ' + value(form, 'deadline'),
      ];
      break;
    }
    case 'homework-sheet': {
      lines = [
        '## Инструкция обучающемуся',
        value(form, 'topic'),
        '',
        '## Цель',
        value(form, 'goals'),
        '',
        '## Задания',
        '1. Базовый уровень: [задание, проверяющее ключевое умение].',
        '2. Применение: [задача в новом контексте].',
        '3. Повышенный уровень: [задача с объяснением способа решения].',
        '',
        '## Критерии выполнения',
        value(form, 'outcomes'),
        '',
        '## Домашняя часть / материалы',
        value(form, 'homework'),
        '',
        '## Ключ для учителя (не выдавать до выполнения)',
        value(form, 'materials'),
        '',
        'Проверьте соответствие заданий возрасту, изученному материалу и рабочей программе.',
      ];
      break;
    }
    default:
      lines = ['## Содержание', value(form, 'topic')];
  }
  return [...header, ...lines, endNote].join('\n').trim() + '\n';
}

export function safeDocumentFilename(valueToSlug) {
  return String(valueToSlug || 'document')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'document';
}
