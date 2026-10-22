import catalog from './officialSubjectResources.json';

// Subject IDs in the source catalog are mapped explicitly to the Russian labels used by the tutor UI.
// The returned entries are links only; this module never loads or copies textbook content.
export const EDSOO_SUBJECTS = {
  'Русский язык': ['russian-language'],
  'Математика': ['mathematics'],
  'Химия': ['chemistry'],
  'География': ['geography'],
  'Биология': ['biology'],
  'Физика': ['physics'],
  'История': ['history'],
  'Литература': ['literature'],
  'Информатика': ['informatics'],
  'Иностранный язык': ['foreign-language'],
  'Обществознание': ['social-studies'],
  'Музыка': ['music'],
  'Изобразительное искусство': ['visual-arts'],
  'Физическая культура': ['physical-education'],
  'Основы безопасности и защиты Родины': ['fundamentals-security-defense-homeland'],
  'Труд (технология)': ['technology'],
  'Функциональная грамотность': ['functional-literacy'],
};

export const officialSubjectResourceItems = catalog.items;

export function officialSubjectResourcesFor(subject, grade) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 11) return [];
  const subjects = EDSOO_SUBJECTS[subject] || [];
  return catalog.items.filter((item) =>
    subjects.includes(item.subject)
    && Array.isArray(item.gradeRange) && item.gradeRange.length > 0
    && grade >= item.gradeRange[0] && grade <= item.gradeRange[item.gradeRange.length - 1]
    && /^https:\/\//.test(item.url)
  );
}

export function officialGradeRangeLabel(range) {
  if (!Array.isArray(range) || range.length === 0) return 'Класс не установлен';
  const first = range[0], last = range[range.length - 1];
  return first === last ? `${first} класс` : `${first}–${last} классы`;
}
