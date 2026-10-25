import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedCurriculumAuditUrl,
  createCurriculumAuditTargets,
  buildCurriculumAuditSummary,
} from './curriculumLinkAudit.js';

test('only HTTPS links to explicitly approved official and GitHub hosts are audited', () => {
  assert.equal(isAllowedCurriculumAuditUrl('https://edsoo.ru/rabochie-programmy/'), true);
  assert.equal(isAllowedCurriculumAuditUrl('https://fgosreestr.edsoo.ru/educational-programs'), true);
  assert.equal(isAllowedCurriculumAuditUrl('https://github.com/paulafanasyev/svetlana_tutor/releases/file.pdf'), true);
  assert.equal(isAllowedCurriculumAuditUrl('http://edsoo.ru/file.pdf'), false);
  assert.equal(isAllowedCurriculumAuditUrl('https://edsoo.ru.example.org/file.pdf'), false);
  assert.equal(isAllowedCurriculumAuditUrl('https://example.org/file.pdf'), false);
  assert.equal(isAllowedCurriculumAuditUrl('not a URL'), false);
});

test('catalog URLs are deduplicated while all program IDs and roles are retained', () => {
  const targets = createCurriculumAuditTargets({
    programs: [
      { id: 'one', url: 'https://edsoo.ru/program.pdf', sourceLandingPage: 'https://edsoo.ru/index/' },
      { id: 'two', url: 'https://edsoo.ru/program.pdf', sourceLandingPage: 'https://edsoo.ru/index/', releaseUrl: 'https://github.com/example/release.pdf' },
    ],
  });
  const officialPdf = targets.find((item) => item.url === 'https://edsoo.ru/program.pdf');
  const landing = targets.find((item) => item.url === 'https://edsoo.ru/index/');
  assert.equal(targets.length, 3);
  assert.equal(officialPdf.expectedPdf, true);
  assert.deepEqual(officialPdf.programIds, ['one', 'two']);
  assert.deepEqual(officialPdf.roles, ['url']);
  assert.deepEqual(landing.programIds, ['one', 'two']);
  assert.equal(targets.every((item) => item.trustedHost), true);
});

test('malformed catalog entries fail closed rather than being fetched', () => {
  assert.throws(() => createCurriculumAuditTargets({}), /массив programs/);
  assert.throws(() => createCurriculumAuditTargets({ programs: [{ url: 'https://edsoo.ru/file.pdf' }] }), /id/);
  assert.throws(() => createCurriculumAuditTargets({ programs: [{ id: 'bad', url: 'javascript:alert(1)' }] }), /Некорректный URL/);
});

test('summary separates verified reachability, broken links and inconclusive checks', () => {
  const summary = buildCurriculumAuditSummary([
    { status: 'reachable', expectedPdf: false },
    { status: 'reachable', expectedPdf: true, pdfSignature: 'valid' },
    { status: 'http_error', expectedPdf: false },
    { status: 'reachable', expectedPdf: true, pdfSignature: 'unverified' },
    { status: 'reachable', expectedPdf: true, pdfSignature: 'missing' },
    { status: 'untrusted_host', expectedPdf: false },
  ]);
  assert.equal(summary.linkCount, 6);
  assert.equal(summary.reachableAndCheckedCount, 2);
  assert.equal(summary.failedOrUntrustedCount, 3);
  assert.equal(summary.notProvenCount, 1);
  assert.match(summary.completenessPolicy, /do not prove curriculum completeness/i);
});
