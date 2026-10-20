// Переключатель версий репетитора вверху экрана — инструмент для тестов. По аудиту 20.10 выключен: на телефоне
// он перекрывал шапку. Версию меняют в Настройках (TrackSettings) или на экране входа; школа — ссылкой ?track=…&lock=1.
// Вернуть для тестов: SHOW_TRACK_BAR = true. Если версию задала школа (&lock=1), переключатель скрыт всегда.
// Переключение версии не трогает выбранного учителя.
import { useApp } from '../core/store.js';
import { TRACKS, trackById, DEFAULT_TRACK } from '../data/tracks.js';
import { sfx } from '../audio/sfx.js';

export const SHOW_TRACK_BAR = false;

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
            className={`whitespace-nowrap rounded-full px-3 min-h-[44px] text-xs font-extrabold transition ${on ? 'text-white shadow' : 'text-ink/80 hover:bg-soft'}`}
            style={on ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : undefined}>
            {t.emoji} {(t.title && (t.title[locale] || t.title.ru)) || t.id}
          </button>
        );
      })}
    </div>
  );
}
