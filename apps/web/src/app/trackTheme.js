// Оформление версии репетитора: <html data-track="cadet"> включает военный стиль (см. styles.css, блок «Кадетская версия»),
// слова интерфейса версии (i18n/trackWords.js) и полевое оформление цветных плиток (EXTRA_CSS ниже).
// Работает до первого кадра (из сохранённых настроек) и сразу при смене версии в настройках.
import { useApp } from '../core/store.js';
import { currentTrack } from '../data/tracks.js';
import { setTrackWords } from '../i18n/trackWords.js';

const COLORS = { cadet: '#3a461c' };
// Цветные плитки (bg-gradient-to-br: главная, игры) в кадетской версии: олива и хаки с шевроном и латунной окантовкой.
const EXTRA_CSS = `
html[data-track='cadet'] .bg-gradient-to-br,
html[data-track='cadet'] .bg-gradient-to-r {
  background-image:
    linear-gradient(135deg, transparent 0 calc(100% - 46px), rgb(201 162 39 / 0.85) calc(100% - 46px) calc(100% - 40px), transparent calc(100% - 40px) calc(100% - 32px), rgb(201 162 39 / 0.85) calc(100% - 32px) calc(100% - 26px), transparent calc(100% - 26px)),
    linear-gradient(160deg, #5c6a2c 0%, #3a461c 60%, #262c14 100%) !important;
  box-shadow: inset 0 0 0 2px rgb(201 162 39 / 0.55), 0 12px 24px -14px rgb(0 0 0 / 0.7) !important;
  color: #f3ead0 !important;
}
html[data-track='cadet'] a.bg-gradient-to-br:nth-child(3n+2), html[data-track='cadet'] button.bg-gradient-to-br:nth-child(3n+2) {
  background-image:
    linear-gradient(135deg, transparent 0 calc(100% - 46px), rgb(201 162 39 / 0.85) calc(100% - 46px) calc(100% - 40px), transparent calc(100% - 40px) calc(100% - 32px), rgb(201 162 39 / 0.85) calc(100% - 32px) calc(100% - 26px), transparent calc(100% - 26px)),
    linear-gradient(160deg, #7a7448 0%, #5a5532 60%, #3b3820 100%) !important;
}
html[data-track='cadet'] a.bg-gradient-to-br:nth-child(3n), html[data-track='cadet'] button.bg-gradient-to-br:nth-child(3n) {
  background-image:
    linear-gradient(135deg, transparent 0 calc(100% - 46px), rgb(201 162 39 / 0.85) calc(100% - 46px) calc(100% - 40px), transparent calc(100% - 40px) calc(100% - 32px), rgb(201 162 39 / 0.85) calc(100% - 32px) calc(100% - 26px), transparent calc(100% - 26px)),
    linear-gradient(160deg, #4a5a3a 0%, #2f3b25 60%, #1c2416 100%) !important;
}
html[data-track='cadet'] .bg-gradient-to-br .text-lg, html[data-track='cadet'] .bg-gradient-to-br .font-black { font-family: var(--cadet-stencil); font-weight: 400; text-transform: uppercase; letter-spacing: 0.04em; }
html[data-track='cadet'] .bg-gradient-to-br .text-white\\/80 { color: rgb(243 234 208 / 0.8) !important; }
.cadet-order { border-left: 4px solid rgb(201 162 39); }
`;
function injectCss() {
  try {
    if (document.getElementById('aet-track-css')) return;
    const el = document.createElement('style');
    el.id = 'aet-track-css';
    el.textContent = EXTRA_CSS;
    document.head.appendChild(el);
  } catch { /* noop */ }
}

let last = null;
function apply(id) {
  setTrackWords(id);
  if (id === last) return;
  last = id;
  try {
    document.documentElement.setAttribute('data-track', id);
    let meta = document.querySelector('meta[name="theme-color"]');
    if (COLORS[id]) {
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'theme-color'); document.head.appendChild(meta); }
      if (!meta.dataset.orig) meta.dataset.orig = meta.getAttribute('content') || '';
      meta.setAttribute('content', COLORS[id]);
    } else if (meta && meta.dataset.orig !== undefined) meta.setAttribute('content', meta.dataset.orig);
  } catch { /* noop */ }
}

injectCss();
try { apply(currentTrack().id); } catch { /* noop */ }
try {
  const sync = (s) => apply((s && s.prefs && s.prefs.track) || currentTrack().id);
  sync(useApp.getState());
  useApp.subscribe(sync);
} catch { /* noop */ }
