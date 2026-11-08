#!/usr/bin/env node
// Offline build for СУВУ (специальные учебно-воспитательные учреждения).
// Генерирует автономный PWA-пакет со всеми игровыми данными, встроенными в бандл.
// Работает без интернета после установки.
//
// Использование:
//   node scripts/build-offline.js [--out <dir>] [--grade <N>] [--track <track>]
//
// Параметры:
//   --out    — выходная директория (по умолчанию dist-offline)
//   --grade  — включить только указанный класс (1-11); по умолчанию все
//   --track  — включить только указанный трек (base/cadet/lyceum/care); по умолчанию все
//
// Результат: директория с index.html, manifest.webmanifest, sw.js и встроенными данными.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, cpSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const WEB_DIR = join(ROOT, 'apps', 'web');
const PACKS_DIR = join(WEB_DIR, 'src', 'data', 'games', 'packs');
const MORE_DIR = join(WEB_DIR, 'src', 'data', 'games', 'more');

// ─── CLI args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
}

const OUT_DIR = resolve(flag('out') || join(ROOT, 'dist-offline'));
const ONLY_GRADE = flag('grade') ? Number(flag('grade')) : null;
const ONLY_TRACK = flag('track') || null;

if (ONLY_GRADE && (ONLY_GRADE < 1 || ONLY_GRADE > 11)) {
  console.error(`Error: --grade must be 1-11, got ${ONLY_GRADE}`);
  process.exit(1);
}
if (ONLY_TRACK && !['base', 'cadet', 'lyceum', 'care'].includes(ONLY_TRACK)) {
  console.error(`Error: --track must be base/cadet/lyceum/care, got ${ONLY_TRACK}`);
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

function readJsonSafe(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

// Фильтрует содержимое pack-файла по классу и треку.
function filterPack(data, grade, track) {
  if (!data || !data.grades) return data;
  const grades = grade ? { [String(grade)]: data.grades[String(grade)] } : data.grades;
  if (track && track !== 'base') {
    for (const [g, content] of Object.entries(grades)) {
      if (!content) continue;
      if (content.quiz) {
        content.quiz = content.quiz.filter((q) => {
          const qt = q.track || 'base';
          return qt === 'base' || qt === track;
        });
      }
      if (content.pairs) {
        content.pairs = content.pairs.filter((p) => {
          const pt = (Array.isArray(p) && p[2]) || 'base';
          return pt === 'base' || pt === track;
        });
      }
    }
  } else if (track === 'base') {
    for (const [g, content] of Object.entries(grades)) {
      if (!content) continue;
      if (content.quiz) content.quiz = content.quiz.filter((q) => !q.track || q.track === 'base');
      if (content.pairs) content.pairs = content.pairs.filter((p) => !p[2] || p[2] === 'base');
    }
  }
  return { ...data, grades };
}

// Собирает все pack-данные в единый объект.
function collectAllPacks() {
  const packs = {};
  if (!existsSync(PACKS_DIR)) return packs;
  for (const f of readdirSync(PACKS_DIR)) {
    if (extname(f) !== '.json') continue;
    const slug = f.replace('.json', '');
    const data = readJsonSafe(join(PACKS_DIR, f));
    if (data) packs[slug] = filterPack(data, ONLY_GRADE, ONLY_TRACK);
  }
  // More packs
  if (existsSync(MORE_DIR)) {
    for (const f of readdirSync(MORE_DIR)) {
      if (extname(f) !== '.json') continue;
      const slug = f.replace('.json', '');
      const data = readJsonSafe(join(MORE_DIR, f));
      if (data) {
        const filtered = filterPack(data, ONLY_GRADE, ONLY_TRACK);
        packs[`more:${slug}`] = filtered;
      }
    }
  }
  return packs;
}

// ─── Service Worker ─────────────────────────────────────────────────────────────
function generateServiceWorker(packsData) {
  const cacheVersion = `offline-v1-${Date.now()}`;
  const embeddedData = JSON.stringify(packsData);

  return `
// Auto-generated service worker for offline mode (СУВУ).
// Version: ${cacheVersion}
const CACHE_NAME = '${cacheVersion}';
const EMBEDDED_PACKS = ${embeddedData};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the shell
      return cache.addAll(['/', '/index.html', '/manifest.webmanifest']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Serve embedded packs for /api/packs/* requests
  if (url.pathname.startsWith('/api/packs/')) {
    const slug = url.pathname.replace('/api/packs/', '').replace('.json', '');
    const data = EMBEDDED_PACKS[slug];
    if (data) {
      event.respondWith(new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      }));
      return;
    }
  }
  // Cache-first for static assets, network-first for the rest
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp.ok && event.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return resp;
      }).catch(() => {
        // Fallback to offline page
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Message handler for dynamic pack queries
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PACKS') {
    event.ports[0].postMessage({ packs: EMBEDDED_PACKS });
  }
});
`;
}

// ─── Manifest ───────────────────────────────────────────────────────────────────
function generateManifest() {
  return JSON.stringify({
    name: 'Цифровая школа — офлайн',
    short_name: 'Школа',
    description: 'Автономная версия для СУВУ. Работает без интернета.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2);
}

// ─── Offline HTML shell ─────────────────────────────────────────────────────────
function generateIndexHtml(packsData) {
  const embeddedScript = `window.__OFFLINE_PACKS__ = ${JSON.stringify(packsData)};`;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Цифровая школа — офлайн</title>
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#6366f1">
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; color: #1e293b; }
    .card { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
    .badge { display: inline-block; background: #6366f1; color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .status { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; }
    .status.ok { background: #dcfce7; color: #166534; }
    .status.warn { background: #fef9c3; color: #854d0e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎓 Цифровая школа — офлайн-режим</h1>
    <span class="badge">СУВУ</span>
    <p style="margin-top:1rem;font-weight:600;color:#64748b;">
      Это автономная версия платформы. Все игровые данные встроены в пакет и работают без подключения к интернету.
    </p>
    <div class="status ok" id="status">✅ Офлайн-пакет загружен</div>
    <div id="pack-info" style="margin-top:1rem;font-size:0.875rem;color:#475569;"></div>
  </div>
  <div class="card">
    <h1>📦 Встроенные данные</h1>
    <div id="packs-list"></div>
  </div>
  <script>${embeddedScript}</script>
  <script>
    (function() {
      var packs = window.__OFFLINE_PACKS__ || {};
      var slugs = Object.keys(packs).filter(function(k) { return !k.startsWith('more:'); });
      var info = document.getElementById('pack-info');
      var list = document.getElementById('packs-list');
      info.textContent = 'Предметов: ' + slugs.length +
        ${ONLY_GRADE ? " | Класс: " + ONLY_GRADE : " | Классы: все"} +
        ${ONLY_TRACK ? " | Трек: " + ONLY_TRACK : " | Треки: все"};
      list.innerHTML = slugs.map(function(s) {
        var d = packs[s];
        var grades = d && d.grades ? Object.keys(d.grades).length : 0;
        return '<div style="padding:0.25rem 0;border-bottom:1px solid #e2e8f0;">📘 ' + s + ' — ' + grades + ' кл.</div>';
      }).join('');

      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function(reg) {
          document.getElementById('status').textContent = '✅ Service worker зарегистрирован, версия ' + reg.active?.state;
        }).catch(function(err) {
          document.getElementById('status').className = 'status warn';
          document.getElementById('status').textContent = '⚠️ SW: ' + err.message;
        });
      }
    })();
  </script>
</body>
</html>`;
}

// ─── Main build ─────────────────────────────────────────────────────────────────
async function build() {
  console.log('🔧 Building offline package for СУВУ...');
  console.log(`   Output: ${OUT_DIR}`);
  if (ONLY_GRADE) console.log(`   Grade filter: ${ONLY_GRADE}`);
  if (ONLY_TRACK) console.log(`   Track filter: ${ONLY_TRACK}`);

  ensureDir(OUT_DIR);

  // Collect and embed all pack data
  console.log('📦 Collecting game packs...');
  const packsData = collectAllPacks();
  const packCount = Object.keys(packsData).filter((k) => !k.startsWith('more:')).length;
  console.log(`   Found ${packCount} subject packs`);

  // Copy built web app if dist exists, otherwise generate standalone shell
  const distDir = join(WEB_DIR, 'dist');
  if (existsSync(distDir)) {
    console.log('📁 Copying built web app...');
    // Copy all files from dist
    for (const entry of readdirSync(distDir)) {
      const src = join(distDir, entry);
      const dest = join(OUT_DIR, entry);
      const stat = statSync(src);
      if (stat.isDirectory()) {
        cpSync(src, dest, { recursive: true });
      } else {
        cpSync(src, dest);
      }
    }
  }

  // Generate offline artifacts
  console.log('📝 Generating offline artifacts...');
  writeFileSync(join(OUT_DIR, 'sw.js'), generateServiceWorker(packsData));
  writeFileSync(join(OUT_DIR, 'manifest.webmanifest'), generateManifest());

  // If no dist was copied, generate standalone index
  if (!existsSync(join(OUT_DIR, 'index.html'))) {
    writeFileSync(join(OUT_DIR, 'index.html'), generateIndexHtml(packsData));
  } else {
    // Inject offline data into existing index.html
    const existing = readFileSync(join(OUT_DIR, 'index.html'), 'utf8');
    const injected = existing.replace(
      '</head>',
      `<script>window.__OFFLINE_MODE__=true;window.__OFFLINE_PACKS__=${JSON.stringify(packsData)};</script></head>`
    );
    writeFileSync(join(OUT_DIR, 'index.html'), injected);
  }

  // Generate a simple icon placeholder
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="32" fill="#6366f1"/><text x="96" y="120" text-anchor="middle" font-size="96" fill="white">🎓</text></svg>`;
  writeFileSync(join(OUT_DIR, 'icon.svg'), iconSvg);

  // Summary
  const totalSize = JSON.stringify(packsData).length;
  console.log(`\n✅ Offline build complete!`);
  console.log(`   Packs embedded: ${packCount}`);
  console.log(`   Data size: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`   Output: ${OUT_DIR}`);
  console.log(`\n   To use: serve the output directory with any static server.`);
  console.log(`   Example: npx serve ${relative(ROOT, OUT_DIR)}`);

  return { packCount, totalSize, outDir: OUT_DIR };
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
