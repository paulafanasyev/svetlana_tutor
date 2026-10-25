import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurriculumCoverage, getCurriculumCoverageMetadata } from './curriculumCoverage.js';

test('матрица содержит полный индекс 37 категорий × 11 классов', () => {
  const metadata = getCurriculumCoverageMetadata();
  assert.equal(metadata.recordCount, 407);
  assert.equal(metadata.notProvenCount, 407);
  assert.equal(metadata.verifiedCompleteCount, 0);
  assert.equal(metadata.checkedAt, '2026-10-22');
});

test('покрытие подбирается по предмету и классу без завышения полноты', () => {
  const math = getCurriculumCoverage('Математика', 7);
  assert.equal(math.grade, 7);
  assert.equal(math.subject, 'mathematics');
  assert.ok(math.indexedResourceCount > 0);
  assert.equal(math.completeCoverage, 'NOT_PROVEN');
  assert.equal(math.curriculumApplicability, 'SUPPORTED_BY_EXPLICIT_WORKING_PROGRAM');

  const algebra = getCurriculumCoverage('Алгебра', 7);
  assert.equal(algebra.subject, 'algebra');
  assert.equal(algebra.completeCoverage, 'NOT_PROVEN');
});

test('отсутствие точной пары не подменяется другой программой', () => {
  assert.equal(getCurriculumCoverage('Предмет которого нет в матрице', 7), null);
  assert.equal(getCurriculumCoverage('Математика', 0), null);
  assert.equal(getCurriculumCoverage('Математика', 12), null);
});

test('языковые алиасы выбирают более конкретную запись перед общей', () => {
  const english = getCurriculumCoverage('Английский язык', 2);
  assert.equal(english.subject, 'english-language');
  const foreign = getCurriculumCoverage('Иностранный язык', 2);
  assert.equal(foreign.subject, 'foreign-language');
});
