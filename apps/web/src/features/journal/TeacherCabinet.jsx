import { useEffect, useState } from 'react';
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

const GAME_MODE_NAMES = Object.fromEntries(MODES.map((mode) => [mode.id, mode.name]));
function schoolGameSubject(result) {
  if (result.subjectSlug === 'algebra') return Number(result.grade) >= 10 ? 'Алгебра и начала математического анализа' : 'Алгебра';
  return Object.entries(SLUGS).find(([, slug]) => slug === result.subjectSlug)?.[0] || result.subjectSlug;
}
function gameLastAt(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function TeacherCabinet() {
  const t = useT();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [journal, setJournal] = useState([]);
  const [form, setForm] = useState({ studentId: '', kind: 'lesson', topic: 'basics', mark: '5', comment: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => { api.myClasses().then((c) => { setClasses(c); if (c[0]) setClassId(c[0].id); }).catch(() => {}); }, []);
  const loadClass = (id) => {
    api.classRoster(id).then((r) => { setRoster(r); setForm((f) => ({ ...f, studentId: r[0]?.id || '' })); }).catch(() => {});
    api.listJournal({ classId: id }).then(setJournal).catch(() => {});
  };
  useEffect(() => { if (classId) loadClass(classId); }, [classId]);

  const cls = classes.find((c) => c.id === classId);
  const topics = ['basics', 'family', 'food', 'travel', 'school', 'hobbies', 'nature', 'city'];

  const add = async (e) => {
    e.preventDefault();
    if (!form.studentId) return;
    sfx.click();
    await api.addJournalEntry({ ...form, classId, mark: form.kind === 'note' ? null : form.mark });
    setForm((f) => ({ ...f, comment: '' }));
    setMsg(t('cab.added')); setTimeout(() => setMsg(null), 2000);
    api.listJournal({ classId }).then(setJournal).catch(() => {});
    sfx.levelUp();
  };
  const del = async (id) => { sfx.wrong(); await api.deleteJournalEntry(id); api.listJournal({ classId }).then(setJournal).catch(() => {}); };

  return (
    <div>
      <h1 className="h1 mb-1">🧑‍🏫 {t('cab.title')}</h1>
      <p className="font-semibold text-ink/55 mb-5">{cls?.name}</p>

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
          <thead>
            <tr className="text-left border-b border-black/5">
              {[t('cab.student'), t('home.level'), 'XP', t('home.accuracy'), t('cab.lastActive')].map((h, i) => (
                <th key={i} className="label !text-[10px] p-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => (
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
      </div>

      {/* Detailed school-game results are scoped to the teacher's own class roster. */}
      <section className="card p-4 mb-6 space-y-3" aria-label="Результаты школьных игр">
        <div>
          <h2 className="font-black text-lg">🎮 Результаты игр, заданий и тестов</h2>
          <p className="text-xs font-semibold text-ink/55 mt-1">Ответы сгруппированы по предмету, классу, режиму игры и теме. Точность считается по сохранённым ответам, а не по наградам.</p>
        </div>
        {!roster.some((student) => (student.gameResults || []).length > 0) && (
          <p className="text-sm font-semibold text-ink/50">Пока нет результатов школьных игр. После первых прохождений здесь появятся верные ответы, точность, темы и время последней попытки.</p>
        )}
        {roster.filter((student) => (student.gameResults || []).length > 0).map((student) => {
          const results = student.gameResults || [];
          const total = results.reduce((sum, result) => sum + result.total, 0);
          const correct = results.reduce((sum, result) => sum + result.correct, 0);
          return (
            <details key={student.id} className="rounded-2xl bg-soft/60 p-3">
              <summary className="cursor-pointer font-black">
                {student.name} · {total} ответов · {total ? Math.round(correct / total * 100) : 0}% точность
              </summary>
              <div className="space-y-2 mt-3">
                {results.map((result) => (
                  <div key={result.subjectSlug + '-' + result.grade + '-' + result.mode + '-' + result.topic} className="rounded-xl bg-white p-3">
                    <div className="font-black text-sm">{schoolGameSubject(result)}, {result.grade} класс · {GAME_MODE_NAMES[result.mode] || result.mode}</div>
                    <div className="text-sm font-semibold mt-1">{result.topic}</div>
                    <div className="text-xs font-bold text-ink/65 mt-1">
                      Верно {result.correct} из {result.total} · точность {Math.round(result.accuracy * 100)}% · среднее время {Math.round(result.avgDurationMs / 100) / 10} с
                    </div>
                    <div className="text-[11px] font-semibold text-ink/45 mt-1">Последняя попытка: {gameLastAt(result.lastAt)}</div>
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
      <form onSubmit={add} className="card p-5 mb-5 grid md:grid-cols-6 gap-2 items-end">
        <div className="md:col-span-2">
          <div className="label mb-1">{t('cab.student')}</div>
          <select className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            {roster.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <div className="label mb-1">{t('cab.kind')}</div>
          <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {['lesson', 'quiz', 'homework', 'note'].map((k) => <option key={k} value={k}>{t('kind.' + k)}</option>)}
          </select>
        </div>
        <div>
          <div className="label mb-1">{t('cab.topic')}</div>
          <select className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
            {topics.map((tp) => <option key={tp} value={tp}>{t('common.topic.' + tp)}</option>)}
          </select>
        </div>
        <div>
          <div className="label mb-1">{t('cab.mark')}</div>
          <select className="input" value={form.mark} disabled={form.kind === 'note'} onChange={(e) => setForm({ ...form, mark: e.target.value })}>
            {['5', '4', '3', '2'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button className="btn-primary" type="submit">➕ {t('cab.save')}</button>
        <div className="md:col-span-6">
          <input className="input" placeholder={t('cab.comment')} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        </div>
        {msg && <div className="md:col-span-6 chip !bg-emerald-100 text-emerald-700 text-xs">✅ {msg}</div>}
      </form>

      {/* Journal list */}
      <div className="label mb-2">🗒️ {t('cab.journal')}</div>
      <div className="space-y-2">
        {!journal.length && <div className="card p-5 text-center font-bold text-ink/40">{t('cab.noEntries')}</div>}
        {journal.map((e) => (
          <div key={e.id} className="card p-3 flex items-center gap-3">
            <span className="text-2xl">{KIND_ICON[e.kind]}</span>
            <div className="min-w-0 flex-1">
              <div className="font-black truncate">{e.studentName} · <span className="font-bold text-ink/60">{t('kind.' + e.kind)}</span>{e.topic ? ' · ' + t('common.topic.' + e.topic) : ''}</div>
              {e.comment && <div className="text-xs font-semibold text-ink/55">{e.comment}</div>}
              <div className="text-[11px] font-bold text-ink/40">{ago(e.at, t)}</div>
            </div>
            {e.mark != null && <span className={`chip ${MARK_CLS(e.mark)} font-black`}>{e.mark}</span>}
            <button className="text-rose-400 text-lg" onClick={() => del(e.id)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}
