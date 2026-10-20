// ВРЕМЕННО: переключатель версий репетитора вверху экрана (потом спрячем в настройки: там уже есть TrackSettings).
// Убрать: SHOW_TRACK_BAR = false. Если версию задала школа (ссылка с &lock=1), переключатель скрыт.
// Переключение версии не трогает выбранного учителя: в кадетской версии капитан показывается поверх него,
// а при возврате в обычную версию ученик снова видит своего учителя.
import { useApp } from '../core/store.js';
import { TRACKS, trackById, DEFAULT_TRACK } from '../data/tracks.js';
import { sfx } from '../audio/sfx.js';

export const SHOW_TRACK_BAR = true;

export default function TrackBar() {
  const { prefs, setPref, locale } = useApp();
  if (!SHOW_TRACK_BAR || prefs.trackLock) return null;
  const current = trackById(prefs.track || DEFAULT_TRACK);
  const choose = (id) => {
    try { sfx.click(); } catch { /* noop */ }
    setPref('track', id);
  };
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[9995] flex gap-1 rounded-full p-1 bg-surface/95 backdrop-blur border border-black/10 shadow-lg max-w-[calc(100vw-16px)] overflow-x-auto aet-trackbar"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      role="radiogroup" aria-label={locale === 'ru' ? 'Версия репетитора' : 'Tutor version'}>
      {TRACKS.map((t) => {
        const on = current.id === t.id;
        return (
          <button key={t.id} role="radio" aria-checked={on} onClick={() => choose(t.id)}
            className={`whitespace-nowrap rounded-full px-3 min-h-[36px] text-xs font-extrabold transition ${on ? 'text-white shadow' : 'text-ink/80 hover:bg-soft'}`}
            style={on ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : undefined}>
            {t.emoji} {(t.title && (t.title[locale] || t.title.ru)) || t.id}
          </button>
        );
      })}
    </div>
  );
}
