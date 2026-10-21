// Школьные материалы (data/school-materials): индексы и манифесты.
// PDF лежат в GitHub Release, в git только JSON. Проверяем инварианты, а не точные количества,
// чтобы обновление каталога не роняло CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { flatSubtreeResults } from '../../frp-noo-content.js';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../../../../data/school-materials/', import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, DIR), 'utf8'));
const unique = (xs) => new Set(xs).size === xs.length;
const SHA = /^[0-9a-f]{64}$/;
const TAG = 'school-materials-2026-10';

const items = read('official-russian-school-material-items.json').items;
const programs = read('federal-working-programs.json').programs;
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
    assert.match(r.allowedUseUntil, /^До\s+\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+20\d\d|[Бб]ессрочно/, r.id);
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
    assert.equal(row.status, row.indexedResourceCount > 0 ? 'LINKS_AVAILABLE' : 'NO_EXACT_GRADE_SUBJECT_RECORD', String(row.grade) + '/' + row.subject);
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
    'edsoo-geography-methodical-letter-2025-2026'
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
  assert.equal(crosswalk.summary.allRemainUnverified, true);
  assert.equal(crosswalk.records.reduce((n, x) => n + (x.status.includes('NEEDS_') || x.status.includes('NEEDS_RECHECK') || x.status.includes('NEEDS_MANUAL_CONFIRMATION') ? 1 : 0), 0), 0);
  assert.ok(crosswalk.records.every((x) => x.ocrExtractionStatus === 'OCR_EXTRACTED_NEEDS_RECHECK'));
});
