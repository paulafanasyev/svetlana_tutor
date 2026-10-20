// Оформление версии репетитора: <html data-track="cadet"> включает военный стиль (см. styles.css, блок «Кадетская версия»).
// Работает до первого кадра (из сохранённых настроек) и сразу при смене версии в настройках.
import { useApp } from '../core/store.js';
import { currentTrack } from '../data/tracks.js';

const COLORS = { cadet: '#3f4f1f' };
let last = null;
function apply(id) {
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

try { apply(currentTrack().id); } catch { /* noop */ }
try {
  const sync = (s) => apply((s && s.prefs && s.prefs.track) || currentTrack().id);
  sync(useApp.getState());
  useApp.subscribe(sync);
} catch { /* noop */ }
