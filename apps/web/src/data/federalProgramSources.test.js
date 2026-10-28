import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from './federalWorkingProgramCatalog.json' with { type: 'json' };
import {
  findOfficialProgramSources,
  listOfficialProgramSourcesForGrade,
  officialProgramSubjectCodes,
  getOfficialProgramCatalogMetadata,
} from './federalProgramSources.js';

test('federal catalog records have unique identifiers and valid source links', () => {
  assert.ok(catalog.programs.length >= 55);
  const ids = catalog.programs.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of catalog.programs) {
    assert.ok(item.id && item.title, 'id/title required');
    assert.ok(Array.isArray(item.gradeRange) && item.gradeRange.length === 2);
    assert.ok(item.gradeRange[0] >= 1 && item.gradeRange[1] <= 11 && item.gradeRange[0] <= item.gradeRange[1]);
    assert.match(item.url, /^https:\/\//);
    assert.ok(item.rightsStatus, 'rights status must remain explicit');
  }
});

test('catalog clearly distinguishes source links from content embedded in the app', () => {
  assert.ok(catalog.checkedAt);
  assert.match(catalog.note, /not embedded/i);
  assert.ok(catalog.programs.some((item) => item.contentStoredLocally === false));
  const metadata = getOfficialProgramCatalogMetadata();
  assert.equal(metadata.recordCount, 62);
  assert.ok(metadata.directPdfLinks >= 50);
});

test('official sources resolve by subject and grade with overlapping grade ranges', () => {
  const math = findOfficialProgramSources('Математика', 7);
  assert.ok(math.length > 0);
  assert.ok(math.every((item) => item.gradeRange[0] <= 7 && item.gradeRange[1] >= 7));
  assert.ok(math.every((item) => item.url.startsWith('https://')));
  const french = findOfficialProgramSources('Французский язык', 10);
  assert.ok(french.some((item) => /француз/i.test(item.title)));

  const orkse = findOfficialProgramSources('ОРКСЭ', 4);
  assert.ok(orkse.some((item) => item.subject === 'religious-cultures-ethics'));

  const dnkr = findOfficialProgramSources('Духовно-нравственная культура России', 5);
  assert.equal(dnkr.length, 1);
  assert.equal(dnkr[0].id, 'frp-ooo-dnkr-5-7');
  assert.equal(dnkr[0].contentStoredLocally, false);
  assert.equal(dnkr[0].mirrorAllowed, false);
  assert.deepEqual(dnkr[0].implementationSchedule, [
    { schoolYear: '2026/2027', startYear: 2026, grades: [5] },
    { schoolYear: '2027/2028', startYear: 2027, grades: [5, 6, 7] },
  ]);
  const algebra = findOfficialProgramSources('Алгебра', 8);
  assert.ok(algebra.length > 0);
  assert.deepEqual(findOfficialProgramSources('Астрономия', 10), []);
});

test('course aliases map to curriculum catalogue subject identifiers', () => {
  assert.deepEqual(officialProgramSubjectCodes('Алгебра'), ['mathematics']);
  assert.deepEqual(officialProgramSubjectCodes('Вероятность и статистика'), ['mathematics']);
  assert.deepEqual(officialProgramSubjectCodes('Основы безопасности и защиты Родины'), ['fundamentals-security-defense-homeland']);
  assert.deepEqual(officialProgramSubjectCodes('предмет неизвестен'), []);
});

test('the grade-wide fallback only shows valid sources applicable to the grade', () => {
  const sources = listOfficialProgramSourcesForGrade(3, 20);
  assert.ok(sources.length > 0);
  assert.ok(sources.every((item) => item.gradeRange[0] <= 3 && item.gradeRange[1] >= 3));
});
