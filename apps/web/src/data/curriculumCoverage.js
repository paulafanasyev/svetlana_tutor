import coverageData from './schoolCurriculumCoverage.json' with { type: 'json' };

const SUBJECT_CODES = {
  'Русский язык': ['russian-language'],
  'Литература': ['literature'],
  'Литературное чтение': ['literary-reading'],
  'Родной язык': ['native-language'],
  'Родная литература': ['native-literature'],
  'Иностранный язык': ['foreign-language'],
  'Английский язык': ['english-language', 'foreign-language'],
  'Иностранный (английский) язык': ['english-language', 'foreign-language'],
  'Немецкий язык': ['german-language', 'foreign-language'],
  'Иностранный (немецкий) язык': ['german-language', 'foreign-language'],
  'Французский язык': ['french-language', 'foreign-language'],
  'Иностранный (французский) язык': ['french-language', 'foreign-language'],
  'Испанский язык': ['spanish-language', 'foreign-language'],
  'Китайский язык': ['chinese-language', 'foreign-language'],
  'Иностранный (китайский) язык': ['chinese-language', 'foreign-language'],
  'Математика': ['mathematics'],
  'Алгебра': ['algebra', 'mathematics'],
  'Геометрия': ['geometry', 'mathematics'],
  'Вероятность и статистика': ['probability-statistics', 'mathematics'],
  'Информатика': ['informatics'],
  'История': ['history'],
  'Обществознание': ['social-studies'],
  'География': ['geography'],
  'Биология': ['biology'],
  'Физика': ['physics'],
  'Химия': ['chemistry'],
  'Астрономия': ['astronomy'],
  'Окружающий мир': ['world-around-us'],
  'Экономика': ['economics'],
  'Экология': ['ecology'],
  'Труд / технология': ['technology'],
  'Технология': ['technology'],
  'Труд (технология)': ['technology'],
  'Изобразительное искусство': ['visual-arts'],
  'Музыка': ['music'],
  'Физическая культура': ['physical-education'],
  'ОБЗР': ['fundamentals-security-defense-homeland'],
  'Основы безопасности и защиты Родины': ['fundamentals-security-defense-homeland'],
  'ОРКСЭ': ['religious-cultures-ethics'],
  'Основы религиозных культур и светской этики': ['religious-cultures-ethics'],
  'Основы духовно-нравственной культуры народов России': ['fundamentals-spiritual-culture'],
  'Духовно-нравственная культура России': ['spiritual-moral-culture-russia'],
  'Шахматы': ['chess'],
  'Функциональная грамотность': ['functional-literacy'],
  'Подготовка к ОГЭ/ЕГЭ': ['exam-preparation'],
  'Региональные и родные языки': ['regional-and-native-languages'],
};

const columns = coverageData.columns || [
  'grade', 'subject', 'indexedResourceCount', 'status', 'completeCoverage',
  'curriculumApplicability', 'officialWorkingProgramCount',
  'releaseAvailableWorkingProgramCount', 'locallyStoredOriginalTaskCount',
];

const asObject = (row) => Object.fromEntries(columns.map((key, index) => [key, row[index]]));
const norm = (value) => String(value || '').trim().toLowerCase().replace(/ё/g, 'е');

export function getCurriculumCoverage(subjectLabel, grade) {
  const gradeNumber = Number(grade);
  if (!Number.isInteger(gradeNumber) || gradeNumber < 1 || gradeNumber > 11) return null;
  let codes = SUBJECT_CODES[String(subjectLabel || '').trim()];
  if (!codes?.length) {
    const target = norm(subjectLabel);
    codes = Object.entries(coverageData.subjectLabels || {})
      .filter(([, label]) => norm(label) === target)
      .map(([code]) => code);
  }
  if (!codes?.length) return null;
  for (const code of codes) {
    const record = (coverageData.rows || []).find((row) => Number(row[0]) === gradeNumber && row[1] === code);
    if (record) return { ...asObject(record), subjectLabel: coverageData.subjectLabels?.[code] || String(subjectLabel || '') };
  }
  return null;
}

export function getCurriculumCoverageMetadata() {
  const records = (coverageData.rows || []).map(asObject);
  return {
    checkedAt: coverageData.checkedAt || null,
    recordCount: records.length,
    notProvenCount: records.filter((record) => record.completeCoverage === 'NOT_PROVEN').length,
    verifiedCompleteCount: records.filter((record) => record.completeCoverage === 'VERIFIED_COMPLETE').length,
    policy: coverageData.policy || '',
  };
}
