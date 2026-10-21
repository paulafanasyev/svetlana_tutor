import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readJson = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));

const sources = readJson('./official-russian-school-materials.json');
const items = readJson('./official-russian-school-material-items.json');
const programs = readJson('./federal-working-programs.json');
const historical = readJson('./historical-school-textbooks-library.json');
const federalSections = readJson('./federal-textbook-list-2026-sections.json');
const textbookBibliography = readJson('./federal-textbook-bibliography-2026.json');
const fullTextbookExtraction = readJson('./federal-textbook-bibliography-2026-full-extraction.json');
const practice = readJson('./original-school-practice-bank.json');
const coverage = readJson('./school-curriculum-coverage.json');

const unique = (values) => new Set(values).size === values.length;

test('school materials source IDs are unique', () => {
  assert.ok(unique(sources.sources.map((x) => x.id)));
});

test('unified school material item IDs are unique', () => {
  assert.ok(unique(items.items.map((x) => x.id)));
  for (const item of items.items) {
    if (item.url) assert.match(item.url, /^https:\/\//, item.id);
  }
});

test('official working programmes have identifiable grades and source links', () => {
  assert.ok(programs.programs.length >= 50);
  assert.ok(programs.directPdfLinks >= 50);
  for (const programme of programs.programs) {
    assert.ok(programme.id && programme.title && programme.subject && programme.sourceId);
    assert.ok(Array.isArray(programme.gradeRange) && programme.gradeRange.length === 2);
    assert.match(programme.url, /^https:\/\//);
  }
});

test('every original practice task for grades 1-11 has a unique ID, answer and explanation', () => {
  assert.ok(unique(practice.exercises.map((x) => x.id)));
  assert.deepEqual([...new Set(practice.exercises.map((x) => x.grade))].sort((a,b)=>a-b),
    [1,2,3,4,5,6,7,8,9,10,11]);
  for (const exercise of practice.exercises) {
    assert.ok(exercise.prompt && exercise.answer && exercise.explanation, exercise.id);
  }
  assert.ok(items.items.filter((x) => x.kind?.includes('original-practice-task')).length >= practice.exercises.length);
});

test('federal textbook list index points to order No. 436 and keeps link/file distinction explicit', () => {
  assert.equal(federalSections.officialDocument.registration, 'Зарегистрирован Минюстом России 22.07.2026 № 87563');
  assert.equal(federalSections.sections.length, federalSections.discoveredSectionLinksCount);
  assert.ok(federalSections.sections.every((x) => x.contentStoredLocally === false));
});

test('historical textbook bibliography does not assume republication rights', () => {
  assert.ok(historical.books.length >= 100);
  for (const book of historical.books) {
    assert.ok(book.url && book.title);
    assert.equal(book.contentStoredLocally, false);
    assert.match(book.rightsStatus, /NOT_PROVEN/);
  }
});

test('coverage matrix does not claim completeness without full inventory proof', () => {
  assert.equal(coverage.rows.length, 275);
  assert.ok(coverage.rows.every((row) => row.completeCoverage === 'NOT_PROVEN'));
});


test('partial 2026 federal textbook bibliography has unique records and explicit rights status', () => {
  assert.equal(textbookBibliography.extractionStatus, 'PARTIAL_NOT_COMPLETE');
  assert.ok(textbookBibliography.records.length >= 100);
  assert.equal(textbookBibliography.totalRecords, textbookBibliography.records.length);
  assert.ok(unique(textbookBibliography.records.map((x) => x.id)));
  for (const book of textbookBibliography.records) {
    assert.ok(book.title && book.subject && book.sourceUrl);
    assert.equal(book.fullTextStoredLocally, false);
    assert.equal(book.rightsStatus, 'NOT_PROVEN_FOR_REPUBLICATION');
    assert.match(book.sourceUrl, /^https:\/\//);
  }
});

test('unified catalog includes federal textbook bibliographic entries without duplicate IDs', () => {
  assert.ok(items.items.filter((x) => x.kind?.includes('federal-textbook-bibliographic-record')).length >= 100);
  assert.ok(unique(items.items.map((x) => x.id)));
});


test('full OCR extraction indexes active K-11 textbook records without claiming verified OCR', () => {
  assert.ok(fullTextbookExtraction.records.length >= 900);
  assert.equal(fullTextbookExtraction.extraction.records, fullTextbookExtraction.records.length);
  assert.equal(fullTextbookExtraction.extraction.status, 'OCR_EXTRACTED_NEEDS_RECHECK');
  assert.ok(unique(fullTextbookExtraction.records.map((x) => x.id)));
  for (const book of fullTextbookExtraction.records) {
    assert.ok(book.title && book.sectionCode && book.sourceUrl);
    assert.equal(book.fullTextStoredLocally, false);
    assert.equal(book.rightsStatus, 'NOT_PROVEN_FOR_REPUBLICATION');
    assert.equal(book.extractionStatus, 'OCR_EXTRACTED_NEEDS_RECHECK');
  }
});

test('unified index includes the OCR textbook records', () => {
  assert.ok(items.items.filter((x) => x.kind?.includes('ocr-extracted-record')).length >= 900);
  assert.ok(unique(items.items.map((x) => x.id)));
});
