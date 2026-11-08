import { useState } from 'react';
import { useT } from '../../core/store.js';
import { Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';
import { useHomework } from './useHomework.js';

function timeOf(at, locale) {
  try { return new Date(at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function AssignForm({ t, onAssign }) {
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [studentIds, setStudentIds] = useState('');
  const [dueDate, setDueDate] = useState('');

  const submit = () => {
    const ids = studentIds.split(',').map((s) => s.trim()).filter(Boolean);
    const due = new Date(dueDate).getTime();
    const res = onAssign({ title, className, subject, description, studentIds: ids, dueDate: due });
    if (res.ok) {
      setTitle(''); setClassName(''); setSubject(''); setDescription(''); setStudentIds(''); setDueDate('');
    }
    return res;
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="label">➕ {t('hw.assign')}</div>
      <input className="input w-full" placeholder={t('hw.title')} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" placeholder={t('hw.class')} value={className} onChange={(e) => setClassName(e.target.value)} />
        <input className="input" placeholder={t('hw.subject')} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <textarea className="input w-full" rows={2} placeholder={t('hw.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
      <input className="input w-full" placeholder={t('hw.students')} value={studentIds} onChange={(e) => setStudentIds(e.target.value)} />
      <input className="input w-full" type="datetime-local" value={dueDate} onChange = {(e) => setDueDate(e.target.value)} />
      <button type="button" className="btn-primary w-full" disabled={!title || !className || !subject || !description || !studentIds || !dueDate} onClick={submit}>{t('hw.submit')}</button>
    </div>
  );
}

export default function HomeworkCabinet() {
  const t = useT();
  const hw = useHomework();
  const [msg, setMsg] = useState(null);

  const flash = (res, okText) => {
    if (res.ok) { setMsg({ ok: true, text: okText }); setTimeout(() => setMsg(null), 2500); sfx.correct?.(); return; }
    sfx.wrong?.();
    setMsg({ ok: false, text: res.error?.message || String(res.error) });
    setTimeout(() => setMsg(null), 3500);
  };

  const list = hw.list();
  const stats = hw.stats();

  return (
    <div>
      <h1 className="h1 mb-1">📝 {t('hw.title_main')}</h1>
      <p className="font-semibold text-ink/55 mb-4">{t('hw.sub')}</p>

      {msg && <div className={`card p-3 mb-4 font-bold anim-pop ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.ok ? '✅' : '😿'} {msg.text}</div>}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon="📋" label={t('hw.stats.total')} value={stats.total} />
        <Stat icon="✅" label={t('hw.stats.completed')} value={stats.completed} />
        <Stat icon="⏰" label={t('hw.stats.overdue')} value={stats.overdue} />
      </div>

      {hw.isTeacher && <AssignForm t={t} onAssign={(raw) => flash(hw.assign(raw), t('hw.assigned'))} />}

      <div className="label mt-6 mb-2">📝 {t('hw.list')}</div>
      <div className="space-y-2">
        {list.length === 0 && <div className="card p-6 text-center font-bold text-ink/40">{t('hw.empty')}</div>}
        {list.map((item) => (
          <div key={item.id} className="card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black">{item.title}</span>
              <span className="chip !bg-soft text-ink/60 !text-[10px]">{item.className} · {item.subject}</span>
              {hw.isStudent && item.completions[hw.userId] && <span className="chip !bg-emerald-100 text-emerald-700 !text-[10px]">✓ {t('hw.done')}</span>}
              {hw.isStudent && !item.completions[hw.userId] && item.dueDate < Date.now() && <span className="chip !bg-rose-100 text-rose-600 !text-[10px]">⏰ {t('hw.overdue')}</span>}
            </div>
            <div className="text-xs font-semibold text-ink/55 mt-1">{item.description}</div>
            <div className="text-[11px] font-bold text-ink/40 mt-1">{t('hw.due')}: {timeOf(item.dueDate, 'ru')}</div>
            {hw.isStudent && !item.completions[hw.userId] && (
              <button type="button" className="btn-primary !py-1 !px-3 text-xs mt-2" onClick={() => flash(hw.complete(item.id), t('hw.completed'))}>✓ {t('hw.markDone')}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
