import { useApp } from '../../core/store.js';
import { api } from '../../core/api.js';
import { TRACKS, trackById, DEFAULT_TRACK } from '../../data/tracks.js';
import { CADET_TEACHER } from '../../data/teachers.js';
import { sfx } from '../../audio/sfx.js';

const COPY = {
  ru: { title: 'Версия репетитора', hint: 'Меняет тон, темп и сложность заданий Светланы.', who: 'Для кого', cadet: 'Наставник: капитан запаса Андрей Николаевич, офицер-воспитатель.' },
  en: { title: 'Tutor version', hint: 'Changes Svetlana’s tone, pace and task difficulty.', who: 'For', cadet: 'Mentor: Captain Andrey Nikolaevich (reserve), officer-educator.' },
};
const pick = (v, locale) => (v && (v[locale] || v.en)) || '';

export default function TrackSettings() {
  const { prefs, setPref, locale, user, setUser } = useApp();
  const c = COPY[locale] || COPY.en;
  const current = trackById(prefs.track || DEFAULT_TRACK);
  const choose = async (id) => {
    sfx.click();
    setPref('track', id);
    // The cadet version comes with its own mentor (Dmitry in uniform), free of charge.
    if (id === 'cadet' && user && user.teacherId !== CADET_TEACHER.baseId) {
      const u = await api.updateProfile({ teacherId: CADET_TEACHER.baseId }).catch(() => null);
      if (u) setUser(u);
    }
  };
  return (
    <div className="card p-5">
      <div className="label mb-1">🧭 {c.title}</div>
      <p className="text-sm font-semibold text-ink/55 mb-3">{c.hint}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {TRACKS.map((t) => (
          <button key={t.id} onClick={() => choose(t.id)} aria-pressed={current.id === t.id} className={`text-left rounded-2xl p-3 border-2 transition ${current.id === t.id ? 'bg-surface shadow-sm' : 'border-black/5 hover:-translate-y-0.5'}`} style={current.id === t.id ? { borderColor: 'rgb(var(--c-primary))' } : undefined}>
            <div className="font-black">{t.emoji} {pick(t.title, locale)}</div>
            <div className="text-xs font-semibold text-ink/60 mt-1">{pick(t.desc, locale)}</div>
          </button>
        ))}
      </div>
      <div className="text-xs font-semibold text-ink/50 mt-3">{c.who}: {pick(current.audience, locale)}</div>
      {current.id === 'cadet' && <div className="text-xs font-bold text-ink/60 mt-1">🎖️ {c.cadet}</div>}
    </div>
  );
}
