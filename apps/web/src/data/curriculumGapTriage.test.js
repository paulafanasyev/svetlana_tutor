import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const triageUrl = new URL('../../../../data/school-materials/curriculum-gap-triage-2026-10-28.json', import.meta.url);
const triage = JSON.parse(await readFile(triageUrl, 'utf8'));
const regulatoryDeltaUrl = new URL('../../../../data/school-materials/regulatory-delta-2026-10-28.json', import.meta.url);
const regulatoryDelta = JSON.parse(await readFile(regulatoryDeltaUrl, 'utf8'));
const currentTriageUrl = new URL('../../../../data/school-materials/curriculum-gap-triage-2026-10-29.json', import.meta.url);
const currentTriage = JSON.parse(await readFile(currentTriageUrl, 'utf8'));

test('gap-triage preserves all 166 unresolved grade/subject rows without duplicates', () => {
  assert.equal(triage.items.length, 166);
  const keys = triage.items.map((item) => `${item.grade}:${item.subject}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(triage.items.every((item) => Number.isInteger(item.grade) && item.grade >= 1 && item.grade <= 11));
});

test('gap-triage never converts index gaps into resolved curriculum applicability or completeness', () => {
  assert.equal(triage.metrics.gapRows, 166);
  assert.equal(triage.metrics.outsideListedProgramRanges, 61);
  assert.equal(triage.metrics.noExactSubjectProgramEntry, 105);
  assert.equal(triage.metrics.resolvedApplicability, 0);
  assert.equal(triage.metrics.completenessVerified, 0);
  assert.ok(triage.items.every((item) =>
    item.decision === 'NEEDS_MANUAL_REVIEW' &&
    item.completeCoverage === 'NOT_PROVEN' &&
    item.currentApplicability === 'NOT_ESTABLISHED_BY_CURRENT_PROGRAM_INDEX'
  ));
});

test('all referenced exact and related programs resolve to evidence records', () => {
  const evidenceIds = new Set(triage.programEvidence.map((program) => program.id));
  assert.ok(evidenceIds.size > 0);
  for (const item of triage.items) {
    for (const id of [...item.exactProgramIds, ...item.relatedProgramHintIds]) {
      assert.ok(evidenceIds.has(id), `Missing source evidence for ${id} at grade ${item.grade}/${item.subject}`);
    }
  }
  assert.ok(triage.programEvidence.every((program) =>
    typeof program.url === 'string' &&
    program.url.startsWith('https://') &&
    typeof program.title === 'string' &&
    Array.isArray(program.gradeRange)
  ));
});

test('official source hints use the curated registry and never auto-resolve a gap', () => {
  const sources = new Map(triage.officialSourceRegistry.map((source) => [source.id, source]));
  assert.equal(sources.size, triage.officialSourceRegistry.length);
  assert.ok(sources.has('edsoo-program-catalog'));
  assert.ok(sources.has('edsoo-fop-faq'));
  assert.equal(triage.metrics.officialScopeHintRows, 166);
  assert.equal(triage.metrics.rowsWithOfficialPdfScopeHint, 48);
  assert.equal(triage.metrics.rowsResolvedByHints, 0);
  assert.equal(triage.metrics.allHintsAreNonResolving, true);

  for (const source of triage.officialSourceRegistry) {
    assert.ok(source.url.startsWith('https://edsoo.ru/'), `Untrusted official-source host: ${source.url}`);
    assert.ok(['OFFICIAL_CATALOG', 'OFFICIAL_GUIDANCE', 'OFFICIAL_FRP_PDF'].includes(source.sourceType));
    assert.ok(typeof source.scopeNote === 'string' && source.scopeNote.length > 20);
  }

  for (const item of triage.items) {
    assert.ok(item.officialScopeHintIds.includes('edsoo-program-catalog'));
    assert.ok(item.officialScopeHintIds.includes('edsoo-fop-faq'));
    for (const id of item.officialScopeHintIds) {
      assert.ok(sources.has(id), `Missing official scope source ${id} for ${item.grade}/${item.subject}`);
    }
    assert.equal(item.decision, 'NEEDS_MANUAL_REVIEW');
    assert.equal(item.completeCoverage, 'NOT_PROVEN');
  }
});


test('2026 FOP amendment is tracked without treating current corpus as updated', () => {
  assert.equal(regulatoryDelta.act.title, 'Приказ Минпросвещения России от 19.08.2026 № 576');
  assert.equal(regulatoryDelta.act.registrationDate, '2026-10-12');
  assert.equal(regulatoryDelta.act.registrationNumber, '88710');
  assert.equal(regulatoryDelta.act.officialReferencePage, 'https://edsoo.ru/normativnye-dokumenty-_/');
  assert.equal(regulatoryDelta.act.effectiveDateException.effectiveFrom, '2027-09-01');

  const areas = new Map(regulatoryDelta.verifiedScopeFromPublishedSummaries.map((area) => [area.id, area]));
  assert.ok(areas.has('obzr-course-structure'));
  assert.ok(areas.has('foreign-language-delayed-changes'));
  assert.ok(areas.has('native-language-programs'));
  assert.ok(areas.has('senior-secondary-programs'));
  assert.equal(areas.get('foreign-language-delayed-changes').reviewStatus, 'DO_NOT_APPLY_EARLY');
  assert.equal(regulatoryDelta.metrics.automaticallyResolvedCurriculumCells, 0);
  assert.equal(regulatoryDelta.metrics.contentFilesAutomaticallyRewritten, 0);

  for (const target of regulatoryDelta.repositoryReviewTargets) {
    assert.ok(target.path && target.reason.length > 20);
  }
});

test('current gap queue separates unresolved pairs from archived ODNKNR taxonomy', () => {
  assert.equal(currentTriage.items.length, 141);
  assert.equal(currentTriage.metrics.gapRows, 141);
  assert.equal(currentTriage.metrics.rowsResolvedByOfficialComponentCrosswalk, 15);
  assert.equal(currentTriage.metrics.rowsResolvedBySubjectTaxonomy, 10);
  assert.equal(currentTriage.metrics.candidateSourceRangeMismatchRows, 51);
  assert.equal(currentTriage.metrics.candidateSourceRangesVerified, 51);
  assert.equal(currentTriage.metrics.sourceApplicabilityResolvedByRangeCheck, 0);
  assert.equal(currentTriage.sourceRangeReview.length, 51);
  for (const item of currentTriage.sourceRangeReview) {
    assert.equal(item.findingStatus, 'VERIFIED_CANDIDATE_PROGRAMMES_DO_NOT_INCLUDE_GRADE');
    assert.equal(item.completeCoverage, 'NOT_PROVEN');
    assert.ok(item.candidates.length > 0);
    assert.ok(item.candidates.every((source) =>
      source.url.startsWith('https://edsoo.ru/')
      && (item.grade < source.gradeRange[0] || item.grade > source.gradeRange[1])
    ));
    assert.match(item.remainingQuestion, /NOT_PROVEN/);
  }
  assert.equal(currentTriage.metrics.completenessVerified, 0);
  assert.equal(currentTriage.metrics.resolvedApplicability, 0);
  assert.equal(currentTriage.resolvedComponentRows.length, 15);
  assert.equal(currentTriage.taxonomyResolutions.length, 10);
  assert.equal(new Set(currentTriage.items.map((item) => `${item.grade}:${item.subject}`)).size, 141);
  assert.ok(currentTriage.items.every((item) =>
    item.decision === 'NEEDS_MANUAL_REVIEW'
    && item.completeCoverage === 'NOT_PROVEN'
    && item.currentApplicability === 'NOT_ESTABLISHED_BY_CURRENT_PROGRAM_INDEX'
    && item.subject !== 'fundamentals-spiritual-culture'
  ));
  for (const item of currentTriage.resolvedComponentRows) {
    assert.equal(item.completeCoverage, 'NOT_PROVEN');
    assert.ok(item.evidenceUrls.length > 0);
    assert.ok(item.evidenceUrls.every((url) => url.startsWith('https://edsoo.ru/')));
  }
  for (const item of currentTriage.taxonomyResolutions) {
    assert.equal(item.status, 'LEGACY_NOT_IN_CURRENT_FEDERAL_PLAN');
    assert.ok(item.evidenceUrls.includes('https://edsoo.ru/otvety-na-chasto-zadavaemye-voprosy/'));
  }
  const dnkr = currentTriage.currentProgramScopes.find((item) => item.subject === 'spiritual-moral-culture-russia');
  assert.ok(dnkr);
  assert.deepEqual(dnkr.schedule, [
    { schoolYear: '2026/2027', grades: [5] },
    { schoolYear: '2027/2028', grades: [5, 6, 7] },
  ]);
});
