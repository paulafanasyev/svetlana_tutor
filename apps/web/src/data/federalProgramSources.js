import catalog from './federalWorkingProgramCatalog.json' with { type: 'json' };

const SUBJECT_CODES = {
  'Математика': ['mathematics'],
  'Алгебра': ['mathematics'],
  'Геометрия': ['mathematics'],
  'Вероятность и статистика': ['mathematics'],
  'Русский язык': ['russian-language'],
  'Литературное чтение': ['literary-reading'],
  'Литература': ['literature'],
  'Иностранный язык': ['english-language'],
  'Иностранный (английский) язык': ['english-language'],
  'Английский язык': ['english-language'],
  'Немецкий язык': ['german-language'],
  'Иностранный (немецкий) язык': ['german-language'],
  'Французский язык': ['french-language'],
  'Иностранный (французский) язык': ['french-language'],
  'Испанский язык': ['spanish-language'],
  'Китайский язык': ['chinese-language'],
  'Иностранный (китайский) язык': ['chinese-language'],
  'Второй иностранный (китайский) язык': ['chinese-language'],
  'История': ['history'],
  'Обществознание': ['social-studies'],
  'География': ['geography'],
  'Физика': ['physics'],
  'Химия': ['chemistry'],
  'Биология': ['biology'],
  'Информатика': ['informatics'],
  'Окружающий мир': ['world-around-us'],
  'Труд / технология': ['technology'],
  'Труд (технология)': ['technology'],
  'Физическая культура': ['physical-education'],
  'ОБЗР': ['fundamentals-security-defense-homeland'],
  'Основы безопасности и защиты Родины': ['fundamentals-security-defense-homeland'],
  'ОРКСЭ': ['religious-cultures-ethics'],
  'Основы религиозных культур и светской этики': ['religious-cultures-ethics'],
  'Духовно-нравственная культура России': ['spiritual-moral-culture-russia'],
  'Основы духовно-нравственной культуры народов России': ['fundamentals-spiritual-culture'],
  'Музыка': ['music'],
  'Изобразительное искусство': ['visual-arts'],
};

const allPrograms = () => Array.isArray(catalog.programs) ? catalog.programs : [];
const isValidSource = (item) => item
  && item.subject !== 'all-school-subjects'
  && Array.isArray(item.gradeRange)
  && item.gradeRange.length === 2
  && Number(item.gradeRange[0]) >= 1
  && Number(item.gradeRange[1]) <= 11
  && Number(item.gradeRange[0]) <= Number(item.gradeRange[1])
  && typeof item.url === 'string'
  && item.url.startsWith('https://');

export function officialProgramSubjectCodes(subjectLabel) {
  return SUBJECT_CODES[String(subjectLabel || '').trim()] || [];
}

export function findOfficialProgramSources(subjectLabel, grade, limit = 5) {
  const gradeNumber = Number(grade);
  if (!Number.isInteger(gradeNumber) || gradeNumber < 1 || gradeNumber > 11) return [];
  const codes = officialProgramSubjectCodes(subjectLabel);
  if (!codes.length) return [];
  const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(20, limit)) : 5;
  return allPrograms()
    .filter((item) => isValidSource(item)
      && gradeNumber >= Number(item.gradeRange[0])
      && gradeNumber <= Number(item.gradeRange[1])
      && codes.includes(item.subject))
    .sort((a, b) => {
      const aExact = Number(a.gradeRange[0]) === gradeNumber && Number(a.gradeRange[1]) === gradeNumber ? 0 : 1;
      const bExact = Number(b.gradeRange[0]) === gradeNumber && Number(b.gradeRange[1]) === gradeNumber ? 0 : 1;
      return aExact - bExact || String(a.title).localeCompare(String(b.title), 'ru');
    })
    .slice(0, safeLimit);
}

export function listOfficialProgramSourcesForGrade(grade, limit = 20) {
  const gradeNumber = Number(grade);
  if (!Number.isInteger(gradeNumber) || gradeNumber < 1 || gradeNumber > 11) return [];
  const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(50, limit)) : 20;
  return allPrograms()
    .filter((item) => isValidSource(item)
      && gradeNumber >= Number(item.gradeRange[0])
      && gradeNumber <= Number(item.gradeRange[1]))
    .sort((a, b) => String(a.title).localeCompare(String(b.title), 'ru'))
    .slice(0, safeLimit);
}

export function getOfficialProgramCatalogMetadata() {
  return {
    checkedAt: catalog.checkedAt || null,
    recordCount: allPrograms().length,
    directPdfLinks: allPrograms().filter((item) => typeof item.url === 'string' && /\.pdf(?:$|\?)/i.test(item.url)).length,
  };
}
