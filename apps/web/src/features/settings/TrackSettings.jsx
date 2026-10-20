import { useApp, useT } from '../../core/store.js';
import { TRACKS, trackById, DEFAULT_TRACK } from '../../data/tracks.js';
import { sfx } from '../../audio/sfx.js';

const COPY = {
  ru: { title: 'Версия репетитора', hint: 'Меняет тон, темп и сложность заданий Светланы.', who: 'Для кого', cadet: 'Наставник: капитан запаса Андрей Николаевич, офицер-воспитатель (вымышленный персонаж).', school: 'Ссылка для школы (версия закрепляется у ученика):', copy: 'Скопировать', copied: 'Скопировано' },
  en: { title: 'Tutor version', hint: 'Changes Svetlana’s tone, pace and task difficulty.', who: 'For', cadet: 'Mentor: Captain Andrey Nikolaevich (reserve), officer-educator (a fictional character).', school: 'Link for a school (fixes the version for the learner):', copy: 'Copy', copied: 'Copied' },
};
const pick = (v, locale) => (v && (v[locale] || v.en)) || '';

export default function TrackSettings() {
  const { prefs, setPref, locale, user } = useApp();
  const t = useT();
  const c = COPY[locale] || COPY.en;
  const current = trackById(prefs.track || DEFAULT_TRACK);
  const locked = !!prefs.trackLock;
  const staff = user && (user.role === 'ADMIN' || user.role === 'TEACHER');
  // The cadet version shows its own mentor on top of the learner's teacher: the saved teacher is never changed.
  const choose = (id) => {
    if (locked) return;
    sfx.click();
    setPref('track', id);
  };
  let link = '';
  try { link = `${location.origin}${location.pathname}?track=${current.id}&lock=1`; } catch { /* noop */ }
  const copy = (e) => { try { navigator.clipboard.writeText(link); e.currentTarget.textContent = c.copied; } catch { /* noop */ } };
  return (
    <div className="card p-5">
      <div className="label mb-1">🧭 {c.title}</div>
      <p className="text-sm font-semibold text-ink/55 mb-3">{c.hint}</p>
      {locked && <div className="chip mb-3">🔒 {t('cadet.locked') === 'cadet.locked' ? (locale === 'ru' ? 'Версию задала школа' : 'Version set by the school') : t('cadet.locked')}</div>}
      <div className="grid sm:grid-cols-2 gap-2">
        {TRACKS.map((tr) => (
          <button key={tr.id} onClick={() => choose(tr.id)} disabled={locked && current.id !== tr.id} aria-pressed={current.id === tr.id} className={`text-left rounded-2xl p-3 border-2 transition disabled:opacity-40 ${current.id === tr.id ? 'bg-surface shadow-sm' : 'border-black/5 hover:-translate-y-0.5'}`} style={current.id === tr.id ? { borderColor: 'rgb(var(--c-primary))' } : undefined}>
            <div className="font-black">{tr.emoji} {pick(tr.title, locale)}</div>
            <div className="text-xs font-semibold text-ink/60 mt-1">{pick(tr.desc, locale)}</div>
          </button>
        ))}
      </div>
      <div className="text-xs font-semibold text-ink/50 mt-3">{c.who}: {pick(current.audience, locale)}</div>
      {current.id === 'cadet' && <div className="text-xs font-bold text-ink/60 mt-1">🎖️ {c.cadet}</div>}
      {staff && link && (
        <div className="mt-3 text-xs font-semibold text-ink/60">
          {c.school}
          <div className="flex gap-2 mt-1"><code className="flex-1 truncate bg-soft rounded-lg px-2 py-1">{link}</code><button className="btn-ghost !px-3 !py-1 text-xs" onClick={copy}>{c.copy}</button></div>
        </div>
      )}
    </div>
  );
}
