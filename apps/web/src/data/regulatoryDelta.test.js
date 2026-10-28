import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = new URL('../../../../data/school-materials/regulatory-delta-2026-10-28.json', import.meta.url);
const delta = JSON.parse(readFileSync(file, 'utf8'));

test('2026 federal programme amendment is recorded with official publication evidence', () => {
  assert.equal(delta.reviewedAt, '2026-10-28');
  assert.equal(delta.status, 'AMENDMENT_SCOPE_REVIEW_PENDING');
  assert.equal(delta.act.title, 'Приказ Минпросвещения России от 19.08.2026 № 576');
  assert.equal(delta.act.registrationDate, '2026-10-12');
  assert.equal(delta.act.registrationNumber, '88710');
  assert.match(delta.act.officialPublicationUrl, /^https:\/\/publication\.pravo\.gov\.ru\//);
  assert.match(delta.act.officialReferencePage, /^https:\/\/edsoo\.ru\//);
  assert.equal(delta.act.effectiveDateException.effectiveFrom, '2027-09-01');
});

test('delayed foreign-language changes for grades 6–9 are tracked without early application', () => {
  const item = delta.verifiedScopeFromPublishedSummaries.find((x) => x.id === 'foreign-language-delayed-changes');
  assert.ok(item, 'missing foreign-language effective-date exception');
  assert.deepEqual(item.grades, [6, 7, 8, 9]);
  assert.equal(item.effectiveFrom, '2027-09-01');
  assert.equal(item.reviewStatus, 'DO_NOT_APPLY_EARLY');
});

test('amendment impact review remains unresolved and does not auto-resolve curriculum coverage', () => {
  assert.equal(delta.status, 'AMENDMENT_SCOPE_REVIEW_PENDING');
  assert.ok(delta.verifiedScopeFromPublishedSummaries.length >= 4);
  assert.ok(delta.repositoryReviewTargets.length >= 5);
  assert.equal(delta.metrics.automaticallyResolvedCurriculumCells, 0);
  assert.equal(delta.metrics.contentFilesAutomaticallyRewritten, 0);
  for (const area of delta.verifiedScopeFromPublishedSummaries) {
    assert.ok(area.reviewStatus, area.id);
    assert.ok(area.evidenceUrls.length >= 1, area.id);
    assert.ok(area.evidenceUrls.every((url) => url.startsWith('https://')), area.id);
  }
});

test('review target paths and evidence URLs are well formed', () => {
  for (const target of delta.repositoryReviewTargets) {
    assert.ok(target.path && target.reason, JSON.stringify(target));
    assert.ok(!target.path.startsWith('/'), target.path);
  }
  const urls = [
    delta.act.officialPublicationUrl,
    delta.act.officialReferencePage,
    delta.act.readableTextUrl,
    ...delta.verifiedScopeFromPublishedSummaries.flatMap((x) => x.evidenceUrls)
  ];
  assert.ok(urls.every((url) => /^https:\/\//.test(url)));
});
