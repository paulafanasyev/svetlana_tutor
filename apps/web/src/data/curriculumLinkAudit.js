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
