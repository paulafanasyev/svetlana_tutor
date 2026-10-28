import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const triageUrl = new URL('../../../../data/school-materials/curriculum-gap-triage-2026-10-28.json', import.meta.url);
const triage = JSON.parse(await readFile(triageUrl, 'utf8'));

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
