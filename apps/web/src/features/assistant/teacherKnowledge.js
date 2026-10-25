import federalProgramCatalog from '../../data/federalWorkingProgramCatalog.json' with { type: 'json' };

export const TEACHER_REFERENCE_SOURCES = [
  {
    title: 'Перечень документов педагогических работников',
    url: 'https://publication.pravo.gov.ru/document/0001202412050007',
    note: 'Приказ Минпросвещения России от 06.11.2024 № 779; применять с учётом раздела перечня, должности и локальных актов.',
  },
  {
    title: 'Федеральные рабочие программы',
    url: 'https://edsoo.ru/rabochie-programmy/',
    note: 'Официальный каталог ЕДСОО; перед использованием проверять класс, предмет, редакцию и дату.',
  },
  {
    title: 'Федеральный перечень учебников 2026 года',
    url: 'https://publication.pravo.gov.ru/document/0001202607230005',
    note: 'Приказ Минпросвещения России от 22.06.2026 № 436; статус конкретного издания требует сверки.',
  },
  {
    title: 'ФИПИ — материалы ОГЭ и ЕГЭ',
    url: 'https://fipi.ru/',
    note: 'Для экзаменационных заданий, демоверсий, спецификаций и кодификаторов использовать кампанию нужного года.',
  },
  {
    title: 'Разъяснения по перечню документов',
    url: 'https://base.garant.ru/414943108/',
    note: 'Письмо Минпросвещения России от 16.09.2026 № 03-1772; уточняйте актуальность и сферу применения.',
  },
];

const SUBJECTS = [
  { label: 'Математика', match: /математик|алгебр|геометр|вероятност|статистик/i },
  { label: 'Русский язык', match: /русск.*язык/i },
  { label: 'Литературное чтение', match: /литературн.*чтен/i },
  { label: 'Литература', match: /литератур/i },
  { label: 'Китайский язык', match: /китайск/i },
  { label: 'Немецкий язык', match: /немецк/i },
  { label: 'Французский язык', match: /французск/i },
  { label: 'Испанский язык', match: /испанск/i },
  { label: 'Основы духовно-нравственной культуры народов России', match: /однкнр|днкр|основ.*духовно-нравствен/i },
  { label: 'Английский язык', match: /англий|иностранн.*язык/i },
  { label: 'История', match: /истори/i },
  { label: 'Обществознание', match: /обществозн/i },
  { label: 'География', match: /географ/i },
  { label: 'Физика', match: /физик/i },
  { label: 'Химия', match: /хими/i },
  { label: 'Биология', match: /биолог/i },
  { label: 'Информатика', match: /информатик/i },
  { label: 'Окружающий мир', match: /окружающ.*мир/i },
  { label: 'Труд / технология', match: /труд|технолог/i },
  { label: 'Физическая культура', match: /физическ.*культур|физкультур/i },
  { label: 'ОБЗР', match: /обзр|основ.*безопасност|защит.*родин/i },
  { label: 'Музыка', match: /музык/i },
  { label: 'Изобразительное искусство', match: /изобразительн.*искусств|изо\b/i },
  { label: 'ОРКСЭ', match: /оркcэ|орксе|религиозн.*культур/i },
];

export function extractRequestedGrade(question) {
  const text = String(question || '').toLowerCase().replace(/ё/g, 'е');
  const patterns = [
    /(?:^|\D)(1[01]|[1-9])\s*(?:-?\s*(?:й|го|ый|ого))?\s*класс(?:а|е|у|ом)?(?:\D|$)/i,
    /класс(?:а|е|у|ом)?\s*[:№-]?\s*(1[01]|[1-9])(?:\D|$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const n = Number(match[1] || match[2]);
      if (n >= 1 && n <= 11) return n;
    }
  }
  return null;
}

export function detectRequestedSubject(question) {
  const text = String(question || '').toLowerCase().replace(/ё/g, 'е');
  const explicit = text.match(/(?:предмет|дисциплина)\s*[:—-]\s*([^,\n.!?]+)/i);
  if (explicit) {
    const found = SUBJECTS.find((item) => item.match.test(explicit[1]));
    if (found) return found.label;
  }
  return SUBJECTS.find((item) => item.match.test(text))?.label || null;
}

function programmeMatchesSubject(programme, label) {
  const spec = SUBJECTS.find((item) => item.label === label);
  return !!spec && spec.match.test(String(programme.subject || ''));
}

function programmeSummary(programme) {
  const sections = Array.isArray(programme.sections) ? programme.sections.slice(0, 8) : [];
  const sectionText = sections.map((section) => {
    const topics = Array.isArray(section.topics) ? section.topics.slice(0, 4) : [];
    return section.title + ': ' + topics.join('; ');
  }).join('\n');
  const results = Array.isArray(programme.results) ? programme.results.slice(0, 5).join(' ') : '';
  const source = programme.source_url || programme.content_source_url || '';
  return [
    'Программа: ' + programme.subject + ', ' + programme.grade + ' класс (' + programme.level + ').',
    programme.source_doc ? 'Документ/происхождение: ' + programme.source_doc : '',
    sectionText ? 'Разделы и темы: ' + sectionText : 'Подробные темы в локальной записи не найдены.',
    results ? 'Планируемые результаты: ' + results : 'Планируемые результаты в записи не найдены.',
    source ? 'Источник программы: ' + source : 'Прямой URL источника не задан в этой записи.',
    programme.content_src ? 'Статус содержания: ' + programme.content_src + '; статус результатов: ' + (programme.results_src || 'не указан') + '.' : '',
  ].filter(Boolean).join('\n');
}

const OFFICIAL_SUBJECT_CODES = {
  'Математика': ['mathematics'],
  'Русский язык': ['russian-language'],
  'Литературное чтение': ['literary-reading'],
  'Литература': ['literature'],
  'Английский язык': ['english-language'],
  'Немецкий язык': ['german-language'],
  'Французский язык': ['french-language'],
  'Испанский язык': ['spanish-language'],
  'Китайский язык': ['chinese-language'],
  'История': ['history'],
  'Обществознание': ['social-studies'],
  'География': ['geography'],
  'Физика': ['physics'],
  'Химия': ['chemistry'],
  'Биология': ['biology'],
  'Информатика': ['informatics'],
  'Окружающий мир': ['world-around-us'],
  'Труд / технология': ['technology'],
  'Физическая культура': ['physical-education'],
  'ОБЗР': ['fundamentals-security-defense-homeland'],
  'ОРКСЭ': ['fundamentals-spiritual-culture'],
  'Основы духовно-нравственной культуры народов России': ['fundamentals-spiritual-culture'],
};

export function findOfficialProgramSources(subjectLabel, grade) {
  const gradeNumber = Number(grade);
  if (!Number.isInteger(gradeNumber) || gradeNumber < 1 || gradeNumber > 11) return [];
  const codes = OFFICIAL_SUBJECT_CODES[subjectLabel] || [];
  if (!codes.length) return [];
  return (Array.isArray(federalProgramCatalog.programs) ? federalProgramCatalog.programs : [])
    .filter((item) => Array.isArray(item.gradeRange) && item.gradeRange.length === 2
      && gradeNumber >= Number(item.gradeRange[0]) && gradeNumber <= Number(item.gradeRange[1])
      && codes.includes(item.subject) && typeof item.url === 'string' && item.url.startsWith('https://'))
    .sort((a, b) => {
      const aExact = Number(a.gradeRange[0]) === gradeNumber && Number(a.gradeRange[1]) === gradeNumber ? 0 : 1;
      const bExact = Number(b.gradeRange[0]) === gradeNumber && Number(b.gradeRange[1]) === gradeNumber ? 0 : 1;
      return aExact - bExact || String(a.title).localeCompare(String(b.title), 'ru');
    })
    .slice(0, 5);
}

function officialSourceSummary(sources) {
  if (!sources.length) return '';
  return [
    'Официальные ссылки на федеральные рабочие программы (только метаданные; PDF не подмешан в текст модели):',
    ...sources.map((item) => '- ' + item.title + ' — ' + item.url + (item.pages ? ' (' + item.pages + ' стр.)' : '') + '. Источник: ' + (item.sourceLandingPage || 'не указан') + '.'),
    'Перед утверждением темы открой PDF и проверь редакцию, класс, уровень и актуальность. Наличие ссылки не означает, что полный текст PDF уже доступен модели.',
  ].join('\n');
}

export async function buildTeacherKnowledgeContext(question) {
  const references = [
    'Нормативные и методические ориентиры (это ссылки для проверки, а не юридическое заключение):',
    ...TEACHER_REFERENCE_SOURCES.map((item) => '- ' + item.title + ': ' + item.url + '. ' + item.note),
    '',
    'Правила ответа: не называй шаблон обязательным, пока это не подтверждено действующим нормативным текстом, должностью и локальными актами. Не выдумывай программу, тему, оценку, посещаемость, причины трудностей или результаты. Отличай точный текст федеральной программы от корпуса/непроверенных материалов. Если данных нет, укажи это и попроси предмет, класс или проверенный источник.',
  ].join('\n');

  try {
    const requestedGrade = extractRequestedGrade(question);
    const requestedSubject = detectRequestedSubject(question);
    const module = await import('../school/fop.js');
    const programmes = Array.isArray(module.PROGRAMS) ? module.PROGRAMS : [];
    let candidates = programmes.slice();
    if (requestedGrade !== null) candidates = candidates.filter((item) => Number(item.grade) === requestedGrade);
    if (requestedSubject) candidates = candidates.filter((item) => programmeMatchesSubject(item, requestedSubject));
    const unique = [];
    const seen = new Set();
    for (const item of candidates) {
      const key = [item.id, item.subject, item.grade, item.level].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length >= 2) break;
    }
    const officialSources = requestedGrade !== null && requestedSubject
      ? findOfficialProgramSources(requestedSubject, requestedGrade)
      : [];
    if (!unique.length) {
      const sourceContext = officialSourceSummary(officialSources);
      return references + '\n\nПодходящая запись локальной базы ФОП не обнаружена для указанного запроса. Не подменяй её похожим предметом или другим классом. ' +
        (sourceContext ? sourceContext + '\n\n' : '') +
        'Используй официальную ссылку как указатель на источник, а не как доказательство того, что содержание PDF загружено в модель. Если точный текст не доступен, прямо сообщи об этом.';
    }
    const sourceContext = officialSourceSummary(officialSources);
    return references + '\n\nРелевантные фрагменты локального каталога ФОП/ФРП (проверяй метки источника и уровень достоверности):\n\n' +
      unique.map(programmeSummary).join('\n\n').slice(0, 5600) +
      (sourceContext ? '\n\n' + sourceContext.slice(0, 1400) : '');
  } catch {
    return references + '\n\nЛокальный каталог программ сейчас не удалось загрузить. Не утверждай, что тема или программа подтверждены; используй ссылки выше и сообщи об ограничении.';
  }
}
