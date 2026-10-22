// Subject IDs in the source catalog are mapped explicitly to the Russian labels used by the tutor UI.
// The returned entries are links only; this module never loads or copies textbook content.
export const EDSOO_SUBJECTS = {
  'Русский язык': ['russian-language'],
  'Литературное чтение': ['literature'],
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

export function officialSubjectResourcesFor(items, subject, grade) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 11) return [];
  const subjects = EDSOO_SUBJECTS[subject] || [];
  if (!Array.isArray(items)) return [];
  return items.filter((item) =>
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

const ESTABLISHED_GRADE = new Set(['GRADE_FOUND_IN_INDEX', 'GRADE_VERIFIED_ON_SOURCE_PAGE']);
const validPublicLesson = (item) => Boolean(
  item && /^https:\/\//.test(item.url || '')
  && item.contentStoredLocally === false
  && ESTABLISHED_GRADE.has(item.gradeStatus)
);
const includesGrade = (item, grade) => Array.isArray(item.gradeRange)
  && item.gradeRange.length > 0
  && grade >= item.gradeRange[0]
  && grade <= item.gradeRange[item.gradeRange.length - 1];

export function officialLessonResourcesFor(items, subject, grade) {
  if (!Array.isArray(items) || !Number.isInteger(grade) || grade < 1 || grade > 11) return [];
  const subjects = EDSOO_SUBJECTS[subject] || [];
  return items.filter((item) =>
    validPublicLesson(item)
    && subjects.includes(item.subject)
    && item.subject !== 'all-school-subjects'
    && includesGrade(item, grade)
  );
}

// The index deliberately marks these as all-school-subjects when the page itself
// did not establish a sufficiently reliable subject mapping. Keep them available
// by grade in a separate panel; never silently attach them to the selected subject.
export function unclassifiedOfficialLessonsFor(items, grade) {
  if (!Array.isArray(items) || !Number.isInteger(grade) || grade < 1 || grade > 11) return [];
  return items.filter((item) =>
    validPublicLesson(item)
    && item.subject === 'all-school-subjects'
    && includesGrade(item, grade)
  );
}
