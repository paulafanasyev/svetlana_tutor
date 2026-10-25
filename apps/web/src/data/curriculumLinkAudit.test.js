import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedCurriculumAuditUrl,
  createCurriculumAuditTargets,
  buildCurriculumAuditSummary,
  compareCurriculumPdfMirrorSizes,
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
  const unsafe = createCurriculumAuditTargets({ programs: [{ id: 'bad', url: 'javascript:alert(1)' }] });
  assert.equal(unsafe.length, 1);
  assert.equal(unsafe[0].trustedHost, false);
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

test('official PDF and release mirror sizes are compared without claiming byte identity', () => {
  const catalog = { programs: [
    { id: 'match', title: 'Совпадение', url: 'https://edsoo.ru/a.pdf', releaseUrl: 'https://github.com/release/a.pdf' },
    { id: 'mismatch', title: 'Размеры различаются', url: 'https://edsoo.ru/b.pdf', releaseUrl: 'https://github.com/release/b.pdf' },
    { id: 'unknown', title: 'Нет результата проверки', url: 'https://edsoo.ru/c.pdf', releaseUrl: 'https://github.com/release/c.pdf' },
    { id: 'page', title: 'Страница, не PDF', url: 'https://edsoo.ru/index/', releaseUrl: 'https://github.com/release/index/' },
  ] };
  const checked = (url, size) => ({
    url,
    status: 'reachable',
    expectedPdf: true,
    pdfSignature: 'valid',
    contentRange: 'bytes 0-7/' + size,
  });
  const result = compareCurriculumPdfMirrorSizes(catalog, [
    checked('https://edsoo.ru/a.pdf', 1024),
    checked('https://github.com/release/a.pdf', 1024),
    checked('https://edsoo.ru/b.pdf', 2048),
    checked('https://github.com/release/b.pdf', 4096),
  ]);
  assert.equal(result.pairedPdfCount, 3);
  assert.equal(result.comparablePairCount, 2);
  assert.equal(result.sizeMatchCount, 1);
  assert.equal(result.sizeMismatchCount, 1);
  assert.equal(result.notComparableCount, 1);
  assert.equal(result.contentIdentityProven, false);
  assert.match(result.note, /does not prove/i);
});

