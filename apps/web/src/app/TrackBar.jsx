// ВРЕМЕННО: переключатель версий репетитора вверху экрана (потом спрячем в настройки: там уже есть TrackSettings).
// Убрать: SHOW_TRACK_BAR = false.
import { useApp } from '../core/store.js';
import { api } from '../core/api.js';
import { TRACKS, trackById, DEFAULT_TRACK } from '../data/tracks.js';
import { CADET_TEACHER } from '../data/teachers.js';
import { sfx } from '../audio/sfx.js';

export const SHOW_TRACK_BAR = true;

export default function TrackBar() {
  const { prefs, setPref, locale, user, setUser } = useApp();
  if (!SHOW_TRACK_BAR) return null;
  const current = trackById(prefs.track || DEFAULT_TRACK);
  const choose = async (id) => {
    try { sfx.click(); } catch { /* noop */ }
    setPref('track', id);
    if (id === 'cadet' && user && user.teacherId && user.teacherId !== CADET_TEACHER.baseId) {
      const u = await api.updateProfile({ teacherId: CADET_TEACHER.baseId }).catch(() => null);
      if (u) setUser(u);
    }
  };
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-2 z-[9995] flex gap-1 rounded-full p-1 bg-surface/90 backdrop-blur border border-black/10 shadow-lg max-w-[calc(100vw-16px)] overflow-x-auto" role="radiogroup" aria-label={locale === 'ru' ? 'Версия репетитора' : 'Tutor version'}>
      {TRACKS.map((t) => {
        const on = current.id === t.id;
        return (
          <button key={t.id} role="radio" aria-checked={on} onClick={() => choose(t.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-extrabold transition ${on ? 'text-white shadow' : 'text-ink/70 hover:bg-soft'}`}
            style={on ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : undefined}>
            {t.emoji} {(t.title && (t.title[locale] || t.title.ru)) || t.id}
          </button>
        );
      })}
    </div>
  );
}
