import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { Stat, ProgressBar } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';
import MathCabinet from '../math/MathCabinet.jsx';
import { SLUGS, MODES } from '../../data/games/subjects.js';

const KIND_ICON = { lesson: '📘', quiz: '📝', homework: '🏠', note: '📌' };
const MARK_CLS = (m) => (m >= 5 ? '!bg-emerald-100 text-emerald-700' : m === 4 ? '!bg-sky-100 text-sky-700' : m === 3 ? '!bg-amber-100 text-amber-700' : '!bg-rose-100 text-rose-600');

function ago(at, t) {
  const d = Math.floor((Date.now() - at) / 86400000);
  return d <= 0 ? t('cab.today') : d + ' ' + t('cab.daysAgo');
}

const GAME_MODE_NAME_KEYS = Object.fromEntries(MODES.map((mode) => [mode.id, mode.nameKey]));
function schoolGameSubject(result) {
  if (result.subjectSlug === 'algebra') return Number(result.grade) >= 10 ? 'Алгебра и начала математического анализа' : 'Алгебра';
  return Object.entries(SLUGS).find(([, slug]) => slug === result.subjectSlug)?.[0] || result.subjectSlug;
}
function gameLastAt(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-black/5 last:border-0 animate-pulse">
      <td className="p-3"><div className="h-4 bg-ink/10 rounded w-24" /></td>
      <td className="p-3"><div className="h-4 bg-ink/10 rounded w-8" /></td>
      <td className="p-3"><div className="h-4 bg-ink/10 rounded w-12" /></td>
      <td className="p-3"><div className="h-4 bg-ink/10 rounded w-20" /></td>
      <td className="p-3"><div className="h-4 bg-ink/10 rounded w-16" /></td>
    </tr>
  );
}

export default function TeacherCabinet() {
  const t = useT();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [journal, setJournal] = useState([]);
  const [form, setForm] = useState({ studentId: '', kind: 'lesson', topic: 'basics', mark: '5', comment: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rosterError, setRosterError] = useState(null);
  const [journalError, setJournalError] = useState(null);
  const [classesError, setClassesError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const formIdPrefix = 'tc-form-';

  const loadClasses = useCallback(() => {
    setClassesError(null);
    setLoading(true);
    api.myClasses()
      .then((c) => { setClasses(c); if (c[0]) setClassId(c[0].id); setLoading(false); })
      .catch((err) => { setClassesError(err?.message || t('cab.loadError')); setLoading(false); });
  }, [t]);

  const loadClass = useCallback((id) => {
    setRosterError(null);
    setJournalError(null);
    api.classRoster(id)
      .then((r) => { setRoster(r); setForm((f) => ({ ...f, studentId: r[0]?.id || '' })); })
      .catch((err) => { setRosterError(err?.message || t('cab.loadError')); });
    api.listJournal({ classId: id })
      .then(() => setJournalError(null))
      .then((j) => setJournal(j))
      .catch((err) => { setJournalError(err?.message || t('cab.loadError')); });
  }, [t]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { if (classId) loadClass(classId); }, [classId, loadClass]);

  const cls = classes.find((c) => c.id === classId);
  const topics = ['basics', 'family', 'food', 'travel', 'school', 'hobbies', 'nature', 'city'];

  const add = async (e) => {
    e.preventDefault();
    if (!form.studentId) return;
    sfx.click();
    setFormError(null);
    try {
      await api.addJournalEntry({ ...form, classId, mark: form.kind === 'note' ? null : form.mark });
      setForm((f) => ({ ...f, comment: '' }));
      setMsg(t('cab.added')); setTimeout(() => setMsg(null), 2000);
      api.listJournal({ classId }).then(setJournal).catch(() => {});
      sfx.levelUp();
    } catch (err) {
      setFormError(err?.message || t('cab.addError'));
    }
  };

  const confirmDelete = (id) => {
    setDeleteTarget(id);
    setDeleteError(null);
  };

  const del = async () => {
    if (!deleteTarget) return;
    sfx.wrong();
    setDeleteError(null);
    try {
      await api.deleteJournalEntry(deleteTarget);
      setDeleteTarget(null);
      api.listJournal({ classId }).then(setJournal).catch(() => {});
    } catch (err) {
      setDeleteError(err?.message || t('cab.deleteError'));
    }
  };

  const hasGameResults = useMemo(() => roster.some((student) => (student.gameResults || []).length > 0), [roster]);
  const studentsWithGames = useMemo(() => roster.filter((student) => (student.gameResults || []).length > 0), [roster]);

  return (
    <div>
      <h1 className="h1 mb-1">🧑‍🏫 {t('cab.title')}</h1>
      <p className="font-semibold text-ink/55 mb-5">{cls?.name}</p>

      {classesError && (
        <div className="card p-4 mb-4 text-rose-500 font-bold flex items-center gap-3" role="alert">
          <span>{classesError}</span>
          <button className="btn-primary !py-1 !px-3 text-sm ml-auto" onClick={loadClasses}>{t('cab.retry')}</button>
        </div>
      )}

      {classes.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {classes.map((c) => (
            <button key={c.id} onClick={() => { sfx.click(); setClassId(c.id); }}
              className={`btn !py-2 ${c.id === classId ? 'btn-primary' : 'btn-ghost'}`}>{c.name}</button>
          ))}
        </div>
      )}

      {cls && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Stat icon="👥" label={t('cab.roster')} value={cls.students} />
          <Stat icon="🎯" label={t('cab.avgAcc')} value={Math.round(cls.avgAccuracy * 100) + '%'} />
          <Stat icon="🗒️" label={t('cab.journal')} value={journal.length} />
        </div>
      )}

      {/* Roster */}
      <div className="card overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <caption className="sr-only">{t('cab.roster')}</caption>
          <thead>
            <tr className="text-left border-b border-black/5">
              {[t('cab.student'), t('home.level'), 'XP', t('home.accuracy'), t('cab.lastActive')].map((h, i) => (
                <th key={i} className="label !text-[10px] p-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && roster.length === 0
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : roster.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="p-3 font-black">{s.name}</td>
                  <td className="p-3 font-bold">{s.level}</td>
                  <td className="p-3 font-bold">⭐ {s.xp}</td>
                  <td className="p-3 w-28">
                    <div className="font-bold text-xs mb-1">{Math.round(s.accuracy * 100)}% · {s.attempts}</div>
                    <ProgressBar value={s.accuracy} className="!h-1.5" />
                  </td>
                  <td className="p-3 text-xs font-semibold text-ink/50">{ago(s.lastActive, t)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        {rosterError && (
          <div className="p-4 text-rose-500 font-bold text-center flex items-center justify-center gap-3" role="alert">
            <span>{rosterError}</span>
            <button className="btn-primary !py-1 !px-3 text-sm" onClick={() => classId && loadClass(classId)}>{t('cab.retry')}</button>
          </div>
        )}
      </div>

      {/* Detailed school-game results are scoped to the teacher's own class roster. */}
      <section className="card p-4 mb-6 space-y-3" aria-label={t('cab.gameResults')}>
        <div>
          <h2 className="font-black text-lg">🎮 {t('cab.gameResults')}</h2>
          <p className="text-xs font-semibold text-ink/55 mt-1">{t('cab.gameResultsDesc')}</p>
        </div>
        {!hasGameResults && (
          <p className="text-sm font-semibold text-ink/50">{t('cab.gameResultsEmpty')}</p>
        )}
        {studentsWithGames.map((student) => {
          const results = student.gameResults || [];
          const total = results.reduce((sum, result) => sum + result.total, 0);
          const correct = results.reduce((sum, result) => sum + result.correct, 0);
          return (
            <details key={student.id} className="rounded-2xl bg-soft/60 p-3">
              <summary className="cursor-pointer font-black">
                {student.name} · {total} {t('cab.gameAnswers')} · {total ? Math.round(correct / total * 100) : 0}% {t('cab.gameAccuracyShort')}
              </summary>
              <div className="space-y-2 mt-3">
                {results.map((result) => (
                  <div key={result.subjectSlug + '-' + result.grade + '-' + result.mode + '-' + result.topic} className="rounded-xl bg-white p-3">
                    <div className="font-black text-sm">{schoolGameSubject(result)}, {result.grade} {t('cab.grade')} · {GAME_MODE_NAME_KEYS[result.mode] ? t(GAME_MODE_NAME_KEYS[result.mode]) : result.mode}</div>
                    <div className="text-sm font-semibold mt-1">{result.topic}</div>
                    <div className="text-xs font-bold text-ink/65 mt-1">
                      {t('cab.gameCorrectOf', { correct: result.correct, total: result.total })} · {t('cab.gameAccuracy')} {Math.round(result.accuracy * 100)}% · {t('cab.gameAvgTime')} {Math.round(result.avgDurationMs / 100) / 10} {t('cab.seconds')}
                    </div>
                    <div className="text-[11px] font-semibold text-ink/45 mt-1">{t('cab.gameLastAttempt')} {gameLastAt(result.lastAt)}</div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </section>

      {/* Math: per-student stats and homework (demo mode) */}
      {classId && <MathCabinet classId={classId} />}

      {/* Add entry */}
      <form onSubmit={add} className="card p-5 mb-5 grid md:grid-cols-6 gap-2 items-end" aria-describedby={formError ? 'tc-form-error' : undefined}>
        <div className="md:col-span-2">
          <label htmlFor={`${formIdPrefix}student`} className="label mb-1 block">{t('cab.student')}</label>
          <select id={`${formIdPrefix}student`} className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            {roster.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${formIdPrefix}kind`} className="label mb-1 block">{t('cab.kind')}</label>
          <select id={`${formIdPrefix}kind`} className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {['lesson', 'quiz', 'homework', 'note'].map((k) => <option key={k} value={k}>{t('kind.' + k)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${formIdPrefix}topic`} className="label mb-1 block">{t('cab.topic')}</label>
          <select id={`${formIdPrefix}topic`} className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
            {topics.map((tp) => <option key={tp} value={tp}>{t('common.topic.' + tp)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${formIdPrefix}mark`} className="label mb-1 block">{t('cab.mark')}</label>
          <select id={`${formIdPrefix}mark`} className="input" value={form.mark} disabled={form.kind === 'note'} onChange={(e) => setForm({ ...form, mark: e.target.value })}>
            {['5', '4', '3', '2'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button className="btn-primary" type="submit" disabled={!form.studentId}>➕ {t('cab.save')}</button>
        <div className="md:col-span-6">
          <input className="input" placeholder={t('cab.comment')} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        </div>
        {msg && <div className="md:col-span-6 chip !bg-emerald-100 text-emerald-700 text-xs">✅ {msg}</div>}
        {formError && <div id="tc-form-error" className="md:col-span-6 chip !bg-rose-100 text-rose-600 text-xs" role="alert">❌ {formError}</div>}
      </form>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="card w-full max-w-sm p-6 anim-pop" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg mb-3">🗑 {t('cab.deleteConfirm')}</h3>
            {deleteError && <div className="chip !bg-rose-100 text-rose-600 text-xs mb-3" role="alert">❌ {deleteError}</div>}
            <div className="flex gap-2 justify-end">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>{t('cab.cancel')}</button>
              <button className="btn-primary !bg-rose-500" onClick={del}>{t('cab.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Journal list */}
      <div className="label mb-2">🗒️ {t('cab.journal')}</div>
      {journalError && (
        <div className="card p-4 mb-3 text-rose-500 font-bold flex items-center gap-3" role="alert">
          <span>{journalError}</span>
          <button className="btn-primary !py-1 !px-3 text-sm ml-auto" onClick={() => classId && loadClass(classId)}>{t('cab.retry')}</button>
        </div>
      )}
      <div className="space-y-2">
        {!journal.length && !journalError && <div className="card p-5 text-center font-bold text-ink/40">{t('cab.noEntries')}</div>}
        {journal.map((e) => (
          <div key={e.id} className="card p-3 flex items-center gap-3">
            <span className="text-2xl">{KIND_ICON[e.kind]}</span>
            <div className="min-w-0 flex-1">
              <div className="font-black truncate">{e.studentName} · <span className="font-bold text-ink/60">{t('kind.' + e.kind)}</span>{e.topic ? ' · ' + t('common.topic.' + e.topic) : ''}</div>
              {e.comment && <div className="text-xs font-semibold text-ink/55">{e.comment}</div>}
              <div className="text-[11px] font-bold text-ink/40">{ago(e.at, t)}</div>
            </div>
            {e.mark != null && <span className={`chip ${MARK_CLS(e.mark)} font-black`}>{e.mark}</span>}
            <button className="text-rose-400 text-lg" onClick={() => confirmDelete(e.id)} aria-label={`${t('cab.delete')}: ${e.studentName}`}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}
