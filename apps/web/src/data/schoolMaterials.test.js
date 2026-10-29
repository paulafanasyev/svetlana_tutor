// Школьные материалы (data/school-materials): индексы и манифесты.
// PDF лежат в GitHub Release, в git только JSON. Проверяем инварианты, а не точные количества,
// чтобы обновление каталога не роняло CI.
// Контрольная ревизия классов карточек ЕДСОО: сверка по страницам источника на 2026-10-22.
import test from 'node:test';
import assert from 'node:assert/strict';
import { flatSubtreeResults, isTransientSourceError, sourceFailureMode } from '../../frp-noo-content.js';
import { officialGradeRangeLabel, officialSubjectResourcesFor, officialLessonResourcesFor, unclassifiedOfficialLessonsFor } from './officialSubjectResources.js';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../../../../data/school-materials/', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8'));
const unique = (xs) => new Set(xs).size === xs.length;
const officialSubjectResourceItems = JSON.parse(readFileSync(new URL('./officialSubjectResources.json', import.meta.url), 'utf8')).items;
const officialLessonResourceItems = JSON.parse(readFileSync(new URL('./officialLessonResources.json', import.meta.url), 'utf8')).items;
const SHA = /^[0-9a-f]{64}$/;
const TAG = 'school-materials-2026-10';

const items = read('official-russian-school-material-items.json').items;
const lessonIndex = read('edsoo-official-lesson-index.json');
const lessons = lessonIndex.items;
const programs = read('federal-working-programs.json').programs;
const extracurricularCatalog = read('official-extracurricular-programs.json');
const componentCrosswalk = read('subject-component-crosswalk.json');
const appCoverage = JSON.parse(readFileSync(new URL('./schoolCurriculumCoverage.json', import.meta.url), 'utf8'));
const manifests = readdirSync(new URL('manifests/', DIR)).filter((f) => f.endsWith('.json')).map((f) => read('manifests/' + f));

test('все JSON читаются, id в общем каталоге уникальны', () => {
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) read(f);
  assert.ok(items.length > 0);
  assert.ok(unique(items.map((x) => x.id)));
  for (const it of items) if (it.url) assert.match(it.url, /^https:\/\//, it.id);
});

test('в индексах нет локальных путей к PDF (localPath)', () => {
  const text = readFileSync(new URL('official-russian-school-material-items.json', DIR), 'utf8')
    + readFileSync(new URL('federal-working-programs.json', DIR), 'utf8');
  assert.ok(!/"localPath"/.test(text), 'localPath остался');
});

test('каждый файл из релиза описан в манифесте: sha256, размер, уникальное имя', () => {
  const assets = new Map();
  for (const m of manifests) {
    const files = [...(m.files || []), ...['pdf', 'ocrPdf', 'text'].map((k) => m[k]).filter(Boolean)];
    for (const f of files) {
      if (!f.releaseAsset) continue;
      assert.ok(!assets.has(f.releaseAsset), 'дубль имени ' + f.releaseAsset);
      assert.match(f.sha256, SHA, f.releaseAsset);
      assert.ok(f.fileSizeBytes > 0, f.releaseAsset);
      assets.set(f.releaseAsset, f);
    }
  }
  for (const it of items.filter((x) => x.storedInRelease)) {
    assert.equal(it.releaseTag, TAG, it.id);
    assert.ok(assets.has(it.releaseAsset), 'нет в манифесте: ' + it.releaseAsset);
    assert.equal(assets.get(it.releaseAsset).sha256, it.sha256, it.id);
  }
});

test('имена PDF внеурочки строятся из id, без битой кириллицы', () => {
  const vd = manifests.find((m) => m.sourcePage?.includes('rabochie-programmy-vd'));
  assert.ok(vd, 'манифест внеурочки');
  for (const f of vd.files.filter((x) => x.releaseAsset)) assert.match(f.releaseAsset, /^vd-[0-9a-f]{12}\.pdf$/);
  assert.equal(vd.verified, vd.files.filter((x) => x.releaseAsset).length);
});

test('активный каталог внеурочных программ совпадает с текущими ссылками EDSOO и манифестом', () => {
  const vd = manifests.find((m) => m.sourcePage?.includes('rabochie-programmy-vd'));
  assert.ok(vd, 'манифест внеурочки');
  assert.equal(extracurricularCatalog.count, extracurricularCatalog.records.length);
  assert.ok(unique(extracurricularCatalog.records.map((x) => x.id)));
  const normalizeUrl = (url) => decodeURIComponent(String(url || '').split('?')[0]).replace(/\\/+$/g, '').toLowerCase();
  const catalogUrls = extracurricularCatalog.records.map((x) => normalizeUrl(x.url)).sort();
  const manifestUrls = vd.files.map((x) => normalizeUrl(x.sourceUrl)).sort();
  assert.deepEqual(catalogUrls, manifestUrls, 'активный каталог должен отражать все текущие ссылки из манифеста');
  assert.equal(extracurricularCatalog.records.length, vd.linksFound);
  const aiOoo = extracurricularCatalog.records.find((x) => x.url.endsWith('/rp_iiiib_ooo.pdf'));
  const aiSoo = extracurricularCatalog.records.find((x) => x.url.endsWith('/rp_iiiib_soo.pdf'));
  assert.deepEqual(aiOoo.gradeRange, [5, 9]);
  assert.deepEqual(aiSoo.gradeRange, [10, 11]);
  assert.equal(aiOoo.contentStoredLocally, false);
  assert.equal(aiSoo.contentStoredLocally, false);
  assert.ok(extracurricularCatalog.archivedRecords.some((x) => x.id === 'edsoo-vd-053'
    && x.archiveReason.includes('Not present on the current official EDSOO')));
});

test('ФРП с ЕДСОО помечены как корпус, не как сверенные с ФОП', () => {
  for (const p of programs.filter((x) => x.storedInRelease)) {
    assert.equal(p.provenance, 'corpus', p.id);
    assert.match(p.releaseAsset, /^frp-[a-z0-9-]+\.pdf$/);
  }
});

test('OCR-выгрузка ФПУ честно помечена черновиком', () => {
  const ocr = read('federal-textbook-bibliography-2026-full-extraction.json');
  assert.ok(unique(ocr.records.map((x) => x.id)));
  for (const r of ocr.records) {
    assert.equal(r.extractionStatus, 'OCR_EXTRACTED_NEEDS_RECHECK', r.id);
    assert.equal(r.fullTextStoredLocally, false, r.id);
  }
  const fpu = manifests.find((m) => m.pdf?.releaseAsset === 'fpu-436-2026.pdf');
  assert.ok(fpu, 'манифест ФПУ');
  if (fpu.text.characters < 100000) assert.match(fpu.text.status, /_SPARSE$/);
});

const garant = ['primary-1-4', 'basic-5-9', 'secondary-10-11'].flatMap((f) => read(`federal-textbooks-2026-${f}.json`).records);

test('сроки в выгрузке ФПУ: «До Д месяца ГГГГ» или «Бессрочно»', () => {
  for (const r of garant) {
    if (r.allowedUseUntil == null) continue;
    assert.match(r.allowedUseUntil, /^(?:До\s+\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+20\d\d(?:\s+года)?|[Бб]ессрочно)$/, r.id);
  }
});

// Коды позиций повторяются в разных таблицах приказа № 436, поэтому учебник = пара «номер + код».
test('выгрузка ФПУ не противоречит сверенным вручную срокам (fpu_status.json)', () => {
  const status = JSON.parse(readFileSync(new URL('./fpu_status.json', import.meta.url), 'utf8')).items;
  let matched = 0;
  for (const [key, st] of Object.entries(status)) {
    const number = Number(key.split('|')[0]);
    for (const r of garant.filter((x) => x.listRow === number && x.sectionCode === st.fpu_code)) {
      const year = /(20\d\d)/.exec(r.allowedUseUntil || '')?.[1];
      if (!year) continue;
      assert.equal(year, st.use_until.slice(0, 4), `${key} ${st.fpu_code}: ${r.allowedUseUntil}`);
      matched += 1;
    }
  }
  assert.ok(matched > 0, 'ни одной пары номер+код не нашлось');
});

test('банк заданий покрывает 1–11 классы, у каждого есть ответ и объяснение', () => {
  const ex = read('original-school-practice-bank.json').exercises;
  assert.ok(unique(ex.map((x) => x.id)));
  assert.deepEqual([...new Set(ex.map((x) => x.grade))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  for (const e of ex) assert.ok(e.prompt && e.answer && e.explanation, e.id);
});

test('матрица покрытия не заявляет полноту без доказательства', () => {
  const rows = read('school-curriculum-coverage.json').rows;
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.completeCoverage === 'NOT_PROVEN'));
});


test('матрица сверки охватывает все предметы каталога и не заявляет полноту', () => {
  const coverage = read('school-curriculum-coverage.json');
  const catalog = read('official-russian-school-materials.json');
  assert.deepEqual(coverage.subjects, catalog.subjects);
  assert.equal(coverage.rows.length, coverage.grades.length * catalog.subjects.length);
  const keys = coverage.rows.map((r) => String(r.grade) + '|' + r.subject);
  assert.equal(new Set(keys).size, keys.length, 'дубли сочетания класс—предмет');
  const sourceSubjects = new Set(catalog.subjects);
  for (const row of coverage.rows) {
    assert.ok(sourceSubjects.has(row.subject), row.subject);
    assert.ok(Number.isInteger(row.indexedResourceCount) && row.indexedResourceCount >= 0, row.subject);
    assert.ok(Number.isInteger(row.locallyStoredOriginalTaskCount) && row.locallyStoredOriginalTaskCount >= 0, row.subject);
    assert.equal(row.completeCoverage, 'NOT_PROVEN', String(row.grade) + '/' + row.subject);
    const key = String(row.grade) + '/' + row.subject;
    if (row.curriculumApplicability === 'LEGACY_NOT_IN_CURRENT_FEDERAL_PLAN') {
      assert.equal(row.status, 'LEGACY_ARCHIVAL_ONLY', key);
    } else if (row.curriculumApplicability === 'OUTSIDE_CURRENT_FEDERAL_PROGRAM_RANGE' && row.indexedResourceCount === 0) {
      assert.equal(row.status, 'OUTSIDE_OFFICIAL_PROGRAM_GRADE_RANGE', key);
    } else {
      assert.equal(row.status, row.indexedResourceCount > 0 ? 'LINKS_AVAILABLE' : 'NO_EXACT_GRADE_SUBJECT_RECORD', key);
    }
  }
  const missingRows = coverage.rows.filter((row) => row.indexedResourceCount === 0);
  assert.equal(coverage.summary.rowsWithoutExactGradeSubjectRecord, missingRows.length);
  assert.equal(coverage.summary.subjectsWithUnindexedGradePairs, coverage.summary.unindexedGradePairsBySubject.length);
  assert.equal(coverage.summary.rowsWithoutRecordsRequiringReview, coverage.summary.unindexedGradePairsBySubject.reduce((sum, group) => sum + group.count, 0));
  assert.ok(coverage.summary.rowsWithoutRecordsRequiringReview <= missingRows.length);
  const reconciliation = readFileSync(new URL('RECONCILIATION-' + coverage.checkedAt + '.md', DIR), 'utf8');
  assert.ok(reconciliation.includes('## Сочетания без точной индексной записи'));
  for (const group of coverage.summary.unindexedGradePairsBySubject) {
    const line = '| ' + group.subjectLabel + ' (`' + group.subject + '`) | ' + group.gradesWithoutExactRecord.join(', ') + ' | ' + group.count + ' |';
    assert.ok(reconciliation.includes(line), group.subject);
  }
});

test('счётчик авторских заданий в матрице соответствует банку по классу и предмету', () => {
  const coverage = read('school-curriculum-coverage.json').rows;
  const exercises = read('original-school-practice-bank.json').exercises;
  const foreignLanguages = new Set(['english-language', 'german-language', 'french-language', 'spanish-language', 'chinese-language']);
  for (const row of coverage) {
    const count = exercises.filter((e) => e.grade === row.grade
      && (e.subject === row.subject || (row.subject === 'foreign-language' && foreignLanguages.has(e.subject)))).length;
    assert.equal(row.locallyStoredOriginalTaskCount, count, String(row.grade) + '/' + row.subject);
  }
});

test('каталог содержит официальный список произведений для федеральных программ', () => {
  const sources = read('official-russian-school-materials.json').sources;
  const source = sources.find((x) => x.id === 'official-program-reading-list-2026');
  assert.ok(source, 'missing Ministry official reading list');
  assert.equal(source.url, 'https://docs.edu.gov.ru/document/9e6ddf2b6267693c0cecdd047768cafa/');
  assert.equal(source.storesFullTextLocally, false);
});


test('OCR-библиография не выдаётся за проверенный текст учебников', () => {
  const ocr = read('federal-textbook-bibliography-2026-full-extraction.json');
  assert.ok(ocr.records.length > 0);
  for (const row of ocr.records) {
    assert.equal(row.extractionStatus, 'OCR_EXTRACTED_NEEDS_RECHECK', row.id);
    assert.equal(row.fullTextAvailable, false, row.id);
    assert.equal(row.fullTextStoredLocally, false, row.id);
    assert.equal(row.rightsStatus, 'NOT_PROVEN_FOR_REPUBLICATION', row.id);
  }
});


test('счётчик индексных записей равен сумме источников матрицы', () => {
  const rows = read('school-curriculum-coverage.json').rows;
  const fields = [
    'federalBibliographyRecordCount', 'verifiedOfficialLessonIndexCount',
    'officialWorkingProgramCount', 'officialExtracurricularProgramCount',
    'locallyStoredOriginalTaskCount', 'openReferenceResourceCount',
    'officialExamResourceCount', 'publicLessonPlatformResourceCount',
    'additionalOfficialSubjectResourceCount', 'officialPlatformEntryPointCount'
  ];
  for (const row of rows) {
    const sum = fields.reduce((total, field) => total + (row[field] || 0), 0);
    assert.equal(row.indexedResourceCount, sum, String(row.grade) + '/' + row.subject);
    const extra = [
      'openReferenceResourceCount', 'officialExamResourceCount',
      'publicLessonPlatformResourceCount', 'additionalOfficialSubjectResourceCount',
      'officialPlatformEntryPointCount'
    ].reduce((total, field) => total + (row[field] || 0), 0);
    assert.equal(row.additionalCatalogResourceCount || 0, extra, row.subject);
  }
});


test('идентификаторы библиографических записей ФПУ уникальны между всеми этапами', () => {
  const files = [
    'federal-textbooks-2026-primary-1-4.json',
    'federal-textbooks-2026-basic-5-9.json',
    'federal-textbooks-2026-secondary-10-11.json'
  ];
  const records = files.flatMap((file) => read(file).records);
  assert.equal(records.length, 746);
  assert.equal(new Set(records.map((row) => row.id)).size, records.length,
    'повторяются id в библиографических выгрузках ФПУ');
});


test('результаты уровня ООО извлекаются, даже если отсутствует заголовок родительского пункта', () => {
  const lines = [
    '163.9.1. В результате изучения физической культуры на уровне основного общего образования обучающийся приобретает систематизированные знания и умения, которые применяются в учебной деятельности и самостоятельных занятиях физическими упражнениями.',
    '163.9.2. Предметные результаты освоения программы по физической культуре.',
    '163.9.2.1. У обучающегося будут сформированы следующие умения.',
    'Оценивать физическую нагрузку, выбирать безопасные упражнения и анализировать собственные результаты с учётом индивидуальных особенностей организма и правил здорового образа жизни.',
    '163.10. Содержание обучения.'
  ];
  const results = flatSubtreeResults(lines, '163.9');
  assert.ok(results.length >= 2);
  assert.ok(results.some((x) => x.includes('физической культуры')));
  assert.ok(results.some((x) => x.includes('физическую нагрузку')));
  assert.ok(results.every((x) => !x.includes('Содержание обучения')));
});

test('временные сетевые ограничения источника не смешиваются с ошибками разбора', () => {
  assert.equal(isTransientSourceError('КонсультантПлюс: документ доступен только по расписанию'), true);
  assert.equal(isTransientSourceError('ООО 163.3: HTTP 418'), true);
  assert.equal(isTransientSourceError('ООО 150.6: The operation was aborted due to timeout'), true);
  assert.equal(isTransientSourceError('ООО 163.9: нет результатов 5 кл.'), false);
  assert.equal(isTransientSourceError('163.9 пункты: разделы не найдены'), false);
});

test('новые официальные предметные материалы имеют уникальные ID, класс и прямую ссылку на источник', () => {
  const ids = [
    'edsoo-math-interactive-lessons-grade3',
    'edsoo-chemistry-context-tasks-grade8',
    'edsoo-geography-methodical-grade5',
    'edsoo-biology-methodical-grade5',
    'edsoo-physics-resh-case-grade7',
    'edsoo-biology-methodical-letter-2026-2027',
    'edsoo-geography-methodical-letter-2026-2027',
    'edsoo-math-methodical-letter-2026-2027',
    'edsoo-physics-methodical-letter-2025-2026',
    'edsoo-geography-methodical-letter-2025-2026',
    'edsoo-history-methodical-letter-2026-2027',
    'edsoo-history-assessment-bank-5-9',
    'edsoo-literature-interactive-lessons-grade5',
    'edsoo-literature-methodical-letter-2026-2027',
    'edsoo-informatics-ai-methodology-7-9',
    'edsoo-foreign-language-methodical-resources',
    'edsoo-functional-literacy-5-9-methodical',
    'edsoo-social-studies-demography-10-11',
    'edsoo-music-methodical-letter-2026-2027',
    'edsoo-visual-arts-methodical-letter-2026-2027',
    'edsoo-physical-education-methodical-letter-2026-2027',
    'edsoo-obzr-methodical-letter-2026-2027',
    'edsoo-technology-methodical-letter-2026-2027',
    'edsoo-chemistry-assessment-bank-8-11',
    'edsoo-physics-hydrostatic-pressure-grade7'
  ];
  const catalog = read('official-russian-school-material-items.json').items;
  for (const id of ids) {
    const item = catalog.find((x) => x.id === id);
    assert.ok(item, 'missing official subject resource: ' + id);
    assert.match(item.url, /^https:\/\//, id);
    assert.equal(item.contentStoredLocally, false, id);
    assert.ok(Array.isArray(item.gradeRange) && item.gradeRange.length > 0, id);
    assert.match(item.rightsStatus, /LINK_ONLY/, id);
  }
});

test('перекрёстная сверка OCR охватывает все записи и не снимает статус ручной проверки', () => {
  const crosswalk = read('federal-textbook-ocr-crosswalk-2026.json');
  assert.equal(crosswalk.records.length, 934);
  assert.equal(new Set(crosswalk.records.map((x) => x.ocrId)).size, crosswalk.records.length);
  assert.equal(crosswalk.summary.totalRecords, 934);
  assert.equal(crosswalk.summary.structuredRecordCount, 746);
  assert.equal(crosswalk.summary.matchedByNumberAndSectionCount, 626);
  assert.equal(crosswalk.summary.uniqueCandidateMatches, 620);
  assert.equal(crosswalk.summary.allRemainUnverified, true);
  assert.ok(crosswalk.records.every((x) => x.status.includes('NEEDS_') || x.status.includes('NEEDS_RECHECK')), 'crosswalk must not mark any OCR record verified');
  assert.ok(crosswalk.records.every((x) => x.ocrExtractionStatus === 'OCR_EXTRACTED_NEEDS_RECHECK'));
});


test('записи ЕДСОО с подтверждением класса содержат ссылку и доказательство', () => {
  const verified = lessons.filter((item) => item.gradeStatus === 'GRADE_VERIFIED_ON_SOURCE_PAGE');
  assert.ok(verified.length > 0, 'нет записей с проверкой по странице');
  assert.equal(verified.length, lessonIndex.gradeVerificationSummary.verifiedOnSourcePage);
  assert.equal(lessons.filter((item) => item.gradeStatus === 'GRADE_NOT_FOUND_RECHECK_REQUIRED').length, lessonIndex.gradeVerificationSummary.stillNeedsReview);
  for (const item of verified) {
    assert.equal(item.gradeEvidenceUrl, item.url, item.id);
    assert.ok(['page-text', 'page-title'].includes(item.gradeEvidenceType), item.id);
    assert.match(item.gradeEvidence || '', /(?:Класс\s*(?::|№)?\s*(?:[1-9]|1[01])|(?:[1-9]|1[01])\s*класс)/iu, item.id);
    assert.ok(Array.isArray(item.gradeRange) && item.gradeRange.length === 2, item.id);
    assert.equal(item.gradeRange[0], item.gradeRange[1], item.id);
  }
});

test('официальные дополнительные материалы ЕДСОО отображаются по предмету и классу', () => {
  const items = officialSubjectResourceItems;
  const itemsForUi = officialSubjectResourceItems;
  assert.equal(items.length, 26);
  assert.ok(unique(items.map((x) => x.id)));
  for (const item of items) {
    assert.match(item.url, /^https:\/\//, item.id);
    assert.equal(item.sourceId, 'edsoo-subject-materials', item.id);
    assert.equal(item.contentStoredLocally, false, item.id);
    assert.ok(Array.isArray(item.gradeRange) && item.gradeRange.length > 0, item.id);
    assert.ok(item.gradeRange.every((g) => Number.isInteger(g) && g >= 1 && g <= 11), item.id);
    assert.match(item.rightsStatus, /link.only|reuse.terms.not.confirmed/i, item.id);
  }
  assert.equal(officialSubjectResourcesFor(itemsForUi, 'Химия', 8).length, 2);
  assert.equal(officialSubjectResourcesFor(itemsForUi, 'Химия', 7).length, 0);
  assert.ok(officialSubjectResourcesFor(itemsForUi, 'Физика', 7).some((x) => x.id === 'edsoo-physics-hydrostatic-pressure-grade7'));
  assert.ok(officialSubjectResourcesFor(itemsForUi, 'Математика', 5).some((x) => x.id === 'edsoo-math-methodical-letter-2026-2027'));
  assert.equal(officialSubjectResourcesFor(itemsForUi, 'Иностранный язык', 1).length, 0);
  assert.ok(officialSubjectResourcesFor(itemsForUi, 'Иностранный язык', 2).length > 0);
  assert.equal(officialSubjectResourcesFor(itemsForUi, 'Неизвестный предмет', 5).length, 0);
  assert.equal(officialGradeRangeLabel([5, 11]), '5–11 классы');
  assert.equal(officialGradeRangeLabel([8]), '8 класс');
});

test('карточки уроков ЕДСОО доступны в UI по предмету и классу, а неразмеченные не приписываются предметам', () => {
  assert.equal(officialLessonResourceItems.length, lessons.length);
  assert.deepEqual(officialLessonResourceItems.map((x) => x.id), lessons.map((x) => x.id), 'compact UI index must stay aligned with official lesson index');
  assert.ok(unique(officialLessonResourceItems.map((x) => x.id)));
  for (const item of officialLessonResourceItems) {
    assert.match(item.url, /^https:\/\//, item.id);
    assert.ok(Array.isArray(item.gradeRange) && item.gradeRange.length > 0, item.id);
    assert.ok(item.gradeRange.every((grade) => Number.isInteger(grade) && grade >= 1 && grade <= 11), item.id);
    assert.ok(['GRADE_FOUND_IN_INDEX', 'GRADE_VERIFIED_ON_SOURCE_PAGE'].includes(item.gradeStatus), item.id);
    assert.equal(item.contentStoredLocally, false, item.id);
    assert.match(item.rightsStatus, /LINK_ONLY_REUSE_TERMS_NOT_CONFIRMED/i, item.id);
  }
  assert.ok(officialLessonResourcesFor(officialLessonResourceItems, 'Русский язык', 3).some((x) => x.id === 'edsoo-lesson-006'));
  assert.ok(officialLessonResourcesFor(officialLessonResourceItems, 'История', 5).some((x) => x.id === 'edsoo-lesson-005'));
  assert.ok(officialLessonResourcesFor(officialLessonResourceItems, 'Биология', 3).some((x) => x.subject === 'biology'));
  assert.equal(officialLessonResourcesFor(officialLessonResourceItems, 'Физика', 7).length, 0);
  assert.ok(unclassifiedOfficialLessonsFor(officialLessonResourceItems, 3).length > 0);
  assert.ok(unclassifiedOfficialLessonsFor(officialLessonResourceItems, 3).every((x) => x.subject === 'all-school-subjects'));
  assert.equal(unclassifiedOfficialLessonsFor(officialLessonResourceItems, 12).length, 0);
});


test('обычные сборки используют корпус при ограничении источника, scheduled-аудит требует живой источник', () => {
  const transient = [
    'КонсультантПлюс: документ доступен только по расписанию',
    'The operation was aborted due to timeout',
  ];
  assert.equal(sourceFailureMode([], 'schedule'), 'no-error');
  assert.equal(sourceFailureMode(transient, 'pull_request'), 'fallback-with-warning');
  assert.equal(sourceFailureMode(transient, 'push'), 'fallback-with-warning');
  assert.equal(sourceFailureMode(transient, 'schedule'), 'fail-live-source-check');
  assert.equal(sourceFailureMode(['163.9: разделы не найдены'], 'schedule'), 'fail-build');
});

test('math component crosswalk cites official FRPs and does not claim curriculum completeness', () => {
  assert.equal(componentCrosswalk.checkedAt, '2026-10-29');
  assert.equal(componentCrosswalk.mappings.length, 4);
  assert.equal(new Set(componentCrosswalk.mappings.map((item) => item.id)).size, 4);
  const currentDnkr = programs.find((item) => item.id === 'frp-ooo-dnkr-5-7');
  assert.ok(currentDnkr, 'current DNKR source must be indexed');
  assert.equal(currentDnkr.subject, 'spiritual-moral-culture-russia');
  assert.equal(currentDnkr.mirrorAllowed, false);
  assert.equal(currentDnkr.contentStoredLocally, false);
  assert.deepEqual(currentDnkr.implementationSchedule, [
    { schoolYear: '2026/2027', startYear: 2026, grades: [5] },
    { schoolYear: '2027/2028', startYear: 2027, grades: [5, 6, 7] },
  ]);
  assert.equal(programs.find((item) => item.id === 'frp-noo-orkse-4').subject, 'religious-cultures-ethics');

  const obzr8 = programs.find((item) => item.id === 'frp-ooo-obzr-8-9');
  const obzr10 = programs.find((item) => item.id === 'frp-soo-obzr-10-11');
  assert.ok(obzr8 && obzr10, 'official OBZR programmes must be indexed');
  assert.deepEqual(obzr8.gradeRange, [8, 9]);
  assert.deepEqual(obzr10.gradeRange, [10, 11]);
  for (const program of [obzr8, obzr10]) {
    assert.equal(program.subject, 'fundamentals-security-defense-homeland');
    assert.equal(program.mirrorAllowed, false);
    assert.equal(program.contentStoredLocally, false);
    assert.match(program.curriculumStatus, /order 576 pending/i);
  }

  const ids = new Set(programs.map((program) => program.id));
  const sourceIds = new Set(componentCrosswalk.sources.map((source) => source.id));
  assert.equal(sourceIds.size, componentCrosswalk.sources.length);
  for (const source of componentCrosswalk.sources) {
    assert.ok(source.url.startsWith('https://edsoo.ru/'), source.id);
    const program = programs.find((item) => item.id === source.id);
    assert.ok(program, 'crosswalk source must exist in the official catalogue: ' + source.id);
    assert.equal(source.url, program.url, source.id);
    assert.deepEqual(source.gradeRange, program.gradeRange, source.id);
  }
  for (const mapping of componentCrosswalk.mappings) {
    assert.ok(ids.has(mapping.sourceIds[0]));
    assert.ok(mapping.sourceIds.every((id) => ids.has(id)));
    assert.ok(['algebra', 'geometry', 'probability-statistics', 'astronomy'].includes(mapping.targetSubject));
    assert.equal(mapping.sourceProgramSubject, mapping.targetSubject === 'astronomy' ? 'physics' : 'mathematics');
    assert.ok(mapping.gradeRelationships.length > 0);
  }
  assert.ok(appCoverage.columns.includes('officialProgramRelationship'));
  const row = (grade, subject) => appCoverage.rows.find((item) => item[0] === grade && item[1] === subject);
  assert.equal(row(3, 'geometry')[9], 'PARENT_MATH_PROGRAM_REFERENCE');
  assert.equal(row(8, 'geometry')[9], 'EXPLICIT_MATH_SUBCOURSE');
  assert.equal(row(3, 'probability-statistics')[9], 'PARENT_MATH_PROGRAM_REFERENCE');
  assert.equal(row(3, 'probability-statistics')[5], 'RELATED_PARENT_PROGRAM_ONLY');
  assert.equal(row(6, 'probability-statistics')[9], 'PARENT_MATH_PROGRAM_REFERENCE');
  assert.equal(row(10, 'probability-statistics')[9], 'EXPLICIT_MATH_SUBCOURSE');
  assert.equal(row(10, 'astronomy')[9], 'PARENT_PHYSICS_PROGRAM_REFERENCE');
  assert.equal(row(10, 'astronomy')[5], 'RELATED_PARENT_PROGRAM_ONLY');
  assert.equal(row(11, 'astronomy')[4], 'NOT_PROVEN');
  assert.equal(row(3, 'fundamentals-security-defense-homeland')[3], 'OUTSIDE_OFFICIAL_PROGRAM_GRADE_RANGE');
  assert.equal(row(3, 'fundamentals-security-defense-homeland')[5], 'OUTSIDE_CURRENT_FEDERAL_PROGRAM_RANGE');
  assert.equal(row(5, 'fundamentals-security-defense-homeland')[5], 'OPTIONAL_VARIANT_PROGRAM_RANGE');
  assert.equal(row(5, 'fundamentals-security-defense-homeland')[9], 'OPTIONAL_VARIANT_PROGRAM_REFERENCE');
  assert.equal(row(8, 'fundamentals-security-defense-homeland')[6], 1);
  assert.equal(row(8, 'fundamentals-security-defense-homeland')[4], 'NOT_PROVEN');
  assert.ok(appCoverage.rows.every((item) => item[4] === 'NOT_PROVEN'));
  assert.equal(appCoverage.rows.filter((item) => item[4] === 'VERIFIED_COMPLETE').length, 0);
});
