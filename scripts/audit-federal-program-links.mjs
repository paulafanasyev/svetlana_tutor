#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createCurriculumAuditTargets,
  buildCurriculumAuditSummary,
  compareCurriculumPdfMirrorSizes,
} from '../apps/web/src/data/curriculumLinkAudit.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_INPUT = path.join(ROOT, 'apps/web/src/data/federalWorkingProgramCatalog.json');
const DEFAULT_OUTPUT_DIR = path.join(ROOT, 'artifacts');
const USER_AGENT = 'SvetlanaTutor-CurriculumLinkAudit/1.0 (+https://github.com/paulafanasyev/svetlana_tutor)';
const DEFAULT_TIMEOUT_MS = 12_000;
const CONCURRENCY = 4;

function parseArgs(argv) {
  const options = { input: DEFAULT_INPUT, output: '', timeoutMs: DEFAULT_TIMEOUT_MS };
  for (const arg of argv) {
    if (arg.startsWith('--input=')) options.input = path.resolve(ROOT, arg.slice('--input='.length));
    else if (arg.startsWith('--output=')) options.output = path.resolve(ROOT, arg.slice('--output='.length));
    else if (arg.startsWith('--timeout-ms=')) {
      const parsed = Number(arg.slice('--timeout-ms='.length));
      if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 60_000) {
        throw new Error('--timeout-ms должен быть целым числом от 1000 до 60000.');
      }
      options.timeoutMs = parsed;
    } else if (arg === '--help') {
      console.log('Usage: node scripts/audit-federal-program-links.mjs [--input=path] [--output=path] [--timeout-ms=12000]');
      process.exit(0);
    } else {
      throw new Error('Неизвестный аргумент: ' + arg);
    }
  }
  return options;
}

function errorText(error) {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}

async function fetchWithTimeout(url, method, headers, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      headers: { 'user-agent': USER_AGENT, ...headers },
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function probeHead(url, timeoutMs) {
  try {
    const response = await fetchWithTimeout(url, 'HEAD', { accept: '*/*' }, timeoutMs);
    return {
      statusCode: response.status,
      finalUrl: response.url,
      contentType: response.headers.get('content-type') || '',
      contentLength: response.headers.get('content-length') || '',
      method: 'HEAD',
      error: '',
    };
  } catch (error) {
    return {
      statusCode: null,
      finalUrl: url,
      contentType: '',
      contentLength: '',
      method: 'HEAD',
      error: error?.name === 'AbortError' ? 'timeout' : errorText(error),
    };
  }
}

async function probeRange(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/pdf,application/octet-stream,text/html,*/*',
        range: 'bytes=0-7',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    let signature = 'unverified';
    if (response.body) {
      const reader = response.body.getReader();
      try {
        const { value, done } = await reader.read();
        if (!done && value) {
          const prefix = new TextDecoder('latin1').decode(value.slice(0, 5));
          signature = prefix === '%PDF-' ? 'valid' : 'missing';
        }
      } finally {
        try { await reader.cancel(); } catch {}
      }
    }
    return {
      statusCode: response.status,
      finalUrl: response.url,
      contentType: response.headers.get('content-type') || '',
      contentLength: response.headers.get('content-length') || '',
      contentRange: response.headers.get('content-range') || '',
      method: 'GET_RANGE',
      pdfSignature: signature,
      error: '',
    };
  } catch (error) {
    return {
      statusCode: response?.status ?? null,
      finalUrl: response?.url || url,
      contentType: response?.headers.get('content-type') || '',
      contentLength: response?.headers.get('content-length') || '',
      contentRange: response?.headers.get('content-range') || '',
      method: 'GET_RANGE',
      pdfSignature: 'unverified',
      error: error?.name === 'AbortError' ? 'timeout' : errorText(error),
    };
  } finally {
    clearTimeout(timer);
  }
}
async function auditOne(target, timeoutMs) {
  const base = {
    url: target.url,
    host: target.host,
    programIds: target.programIds,
    roles: target.roles,
    expectedPdf: target.expectedPdf,
    trustedHost: target.trustedHost,
    checkedAt: new Date().toISOString(),
  };
  if (!target.trustedHost) {
    return { ...base, status: 'untrusted_host', method: '', statusCode: null, error: 'URL не входит в список разрешённых HTTPS-доменов.' };
  }

  let head = await probeHead(target.url, timeoutMs);
  let chosen = head;
  const headOk = head.statusCode !== null && head.statusCode >= 200 && head.statusCode < 400;
  const fallbackCandidate = !headOk && (
    head.statusCode === null
    || [403, 405, 408, 429, 500, 502, 503, 504].includes(head.statusCode)
  );

  // PDF paths always get a bounded Range read so a 200/HTML error page is not mistaken for a valid PDF.
  // Range response bodies are cancelled immediately after the first chunk.
  if (target.expectedPdf && (headOk || fallbackCandidate)) {
    const ranged = await probeRange(target.url, timeoutMs);
    if (ranged.statusCode !== null && ranged.statusCode >= 200 && ranged.statusCode < 400) {
      chosen = ranged;
      if (ranged.pdfSignature === 'missing') {
        return {
          ...base, ...ranged, status: 'reachable', pdfSignature: 'missing',
          error: 'Ссылка ответила успешно, но первые байты не содержат сигнатуру PDF.',
        };
      }
      return {
        ...base, ...ranged, status: 'reachable',
        warning: ranged.statusCode === 200 && !/^bytes\s/i.test(ranged.contentRange)
          ? 'Сервер не подтвердил частичный ответ; тело было отменено после первого фрагмента.'
          : '',
      };
    }
    // A successful HEAD is useful evidence of reachability, but does not prove the PDF body is valid.
    if (headOk) {
      return { ...base, ...head, status: 'reachable', pdfSignature: 'unverified', warning: 'HEAD успешен, но ограниченная проверка PDF не завершилась.' };
    }
    chosen = ranged;
  } else if (!headOk && fallbackCandidate) {
    chosen = await probeRange(target.url, timeoutMs);
  }

  if (chosen.statusCode !== null && chosen.statusCode >= 200 && chosen.statusCode < 400) {
    return { ...base, ...chosen, status: 'reachable' };
  }
  const status = chosen.error === 'timeout' || head.error === 'timeout'
    ? 'timeout'
    : chosen.statusCode === null ? 'network_error' : 'http_error';
  return {
    ...base,
    ...chosen,
    status,
    error: chosen.error || ('HTTP ' + chosen.statusCode),
  };
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const raw = await readFile(options.input, 'utf8');
  const catalog = JSON.parse(raw);
  const targets = createCurriculumAuditTargets(catalog);
  const checkedAt = new Date().toISOString();
  console.log('Каталог:', options.input);
  console.log('Уникальных HTTPS-ссылок:', targets.length);
  console.log('Проверяю с параллелизмом', CONCURRENCY, 'и тайм-аутом', options.timeoutMs, 'мс…');

  const results = await mapLimit(targets, CONCURRENCY, (target) => auditOne(target, options.timeoutMs));
  const summary = buildCurriculumAuditSummary(results);
  summary.checkedAt = checkedAt;
  const mirrorConsistency = compareCurriculumPdfMirrorSizes(catalog, results);
  const report = {
    schemaVersion: 1,
    checkedAt,
    sourceCatalog: path.relative(ROOT, options.input),
    sourceCatalogCheckedAt: catalog.checkedAt || null,
    note: 'A successful link check does not prove curriculum completeness, legal applicability, PDF text accuracy, or school-specific approval.',
    summary,
    mirrorConsistency,
    results,
  };
  const date = checkedAt.slice(0, 10);
  const outputPath = options.output || path.join(DEFAULT_OUTPUT_DIR, 'federal-program-link-audit-' + date + '.json');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('Отчёт:', path.relative(ROOT, outputPath));
  console.log(JSON.stringify({
    links: summary.linkCount,
    reachableAndChecked: summary.reachableAndCheckedCount,
    failedOrUntrusted: summary.failedOrUntrustedCount,
    notProven: summary.notProvenCount,
    pairedPdfs: mirrorConsistency.pairedPdfCount,
    matchingByteSizes: mirrorConsistency.sizeMatchCount,
    mismatchedByteSizes: mirrorConsistency.sizeMismatchCount,
    uncomparableByteSizes: mirrorConsistency.notComparableCount,
  }, null, 2));
  // Link outages are reported, not made a release gate. Invalid catalog/schema and script errors still fail the job.
}

main().catch((error) => {
  console.error('Аудит ссылок завершился ошибкой:', errorText(error));
  process.exitCode = 1;
});
