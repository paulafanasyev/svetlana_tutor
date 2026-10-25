const ALLOWED_HOSTS = new Set([
  'edsoo.ru',
  'www.edsoo.ru',
  'fgosreestr.edsoo.ru',
  'github.com',
]);

export function isAllowedCurriculumAuditUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function createCurriculumAuditTargets(catalog) {
  if (!catalog || !Array.isArray(catalog.programs)) {
    throw new Error('Каталог должен содержать массив programs.');
  }
  const targets = new Map();
  for (const program of catalog.programs) {
    if (!program || typeof program.id !== 'string' || !program.id.trim()) {
      throw new Error('Каждая запись программы должна иметь id.');
    }
    for (const field of ['url', 'sourceLandingPage', 'releaseUrl']) {
      const rawUrl = program[field];
      if (!rawUrl) continue;
      if (typeof rawUrl !== 'string') {
        throw new Error('Поле ' + field + ' должно быть URL-строкой: ' + program.id);
      }
      const canonicalUrl = rawUrl.trim();
      let target = targets.get(canonicalUrl);
      if (!target) {
        let parsed;
        try { parsed = new URL(canonicalUrl); } catch {
          throw new Error('Некорректный URL в записи ' + program.id + ': ' + canonicalUrl);
        }
        target = {
          url: canonicalUrl,
          host: parsed.hostname.toLowerCase(),
          roles: [],
          programIds: [],
          expectedPdf: /\.pdf$/i.test(parsed.pathname),
        };
        targets.set(canonicalUrl, target);
      }
      if (!target.roles.includes(field)) target.roles.push(field);
      if (!target.programIds.includes(program.id)) target.programIds.push(program.id);
    }
  }
  return [...targets.values()].map((target) => ({
    ...target,
    trustedHost: isAllowedCurriculumAuditUrl(target.url),
  })).sort((a, b) => a.url.localeCompare(b.url));
}

export function buildCurriculumAuditSummary(results) {
  const list = Array.isArray(results) ? results : [];
  const passCount = list.filter((item) => item.status === 'reachable' && (!item.expectedPdf || item.pdfSignature === 'valid')).length;
  const unreachableCount = list.filter((item) => ['http_error', 'network_error', 'timeout', 'invalid_url', 'untrusted_host'].includes(item.status)
    || (item.expectedPdf && item.pdfSignature === 'missing')).length;
  const unverifiedCount = list.length - passCount - unreachableCount;
  return {
    linkCount: list.length,
    reachableAndCheckedCount: passCount,
    failedOrUntrustedCount: unreachableCount,
    notProvenCount: unverifiedCount,
    checkedAt: new Date().toISOString(),
    completenessPolicy: 'Link reachability and PDF signature checks do not prove curriculum completeness, legal applicability, text extraction quality, or editorial correctness.',
  };
}

function pdfTotalBytes(result) {
  if (!result || result.status !== 'reachable' || (result.expectedPdf && result.pdfSignature !== 'valid')) return null;
  const contentRange = String(result.contentRange || '').match(/^bytes\s+\d+-\d+\/(\d+)$/i);
  if (contentRange) return Number(contentRange[1]);
  const contentLength = Number(result.contentLength);
  return Number.isSafeInteger(contentLength) && contentLength > 0 ? contentLength : null;
}

function isDirectPdfUrl(rawUrl) {
  try { return /\.pdf$/i.test(new URL(rawUrl).pathname); } catch { return false; }
}

export function compareCurriculumPdfMirrorSizes(catalog, results) {
  if (!catalog || !Array.isArray(catalog.programs)) throw new Error('Каталог должен содержать массив programs.');
  const byUrl = new Map((Array.isArray(results) ? results : []).map((item) => [item.url, item]));
  const comparisons = [];
  for (const program of catalog.programs) {
    if (!program?.url || !program?.releaseUrl
        || !isDirectPdfUrl(program.url) || !isDirectPdfUrl(program.releaseUrl)) continue;
    const official = byUrl.get(program.url);
    const release = byUrl.get(program.releaseUrl);
    const officialBytes = pdfTotalBytes(official);
    const releaseBytes = pdfTotalBytes(release);
    let status = 'not_comparable';
    if (officialBytes !== null && releaseBytes !== null) {
      status = officialBytes === releaseBytes ? 'size_match' : 'size_mismatch';
    }
    comparisons.push({
      programId: program.id,
      title: program.title || program.id,
      officialUrl: program.url,
      releaseUrl: program.releaseUrl,
      officialBytes,
      releaseBytes,
      status,
    });
  }
  const comparable = comparisons.filter((item) => item.status !== 'not_comparable');
  return {
    pairedPdfCount: comparisons.length,
    comparablePairCount: comparable.length,
    sizeMatchCount: comparisons.filter((item) => item.status === 'size_match').length,
    sizeMismatchCount: comparisons.filter((item) => item.status === 'size_mismatch').length,
    notComparableCount: comparisons.filter((item) => item.status === 'not_comparable').length,
    contentIdentityProven: false,
    note: 'Matching byte size is only a coarse consistency check. It does not prove that the official PDF and release copy contain identical bytes or the same text.',
    comparisons,
  };
}
