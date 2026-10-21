// Student homework answer + Svetlana's check. Shared by «Уроки» (Lessons.jsx) and «Мой класс» (ClassRoom.jsx).
import { useState } from 'react';
import { school } from './schoolStore.js';
import { useAI } from '../../ai/useAI.js';

const input = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold';
const time = (t) => new Date(t).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function SvetlanaCheck({ check }) {
  if (!check) return <p className="text-xs font-semibold text-ink/50">Светлана ещё не проверяла этот ответ.</p>;
  return (
    <div className="rounded-xl bg-violet-50 px-3 py-2 text-sm space-y-1">
      <div className="font-black">👩‍🏫 Светлана{check.mark ? `: предварительно ${check.mark}` : ''}<span className="ml-1 text-[11px] font-bold text-ink/40">{check.source === 'llm' ? '(локальный ИИ)' : '(проверка по правилам)'}</span></div>
      <p className="font-semibold">{check.verdict}</p>
      {check.fixes?.length > 0 && (
        <ul className="space-y-0.5">
          {check.fixes.map((f, i) => (
            <li key={i} className="font-semibold"><span className="line-through text-red-600">{f.wrong}</span>{f.right && <> → <span className="text-green-700">{f.right}</span></>}{f.why && <span className="text-ink/60"> · {f.why}</span>}</li>
          ))}
        </ul>
      )}
      {check.advice && <p className="text-xs font-semibold text-ink/60">💡 {check.advice}</p>}
    </div>
  );
}

export default function HomeworkAnswer({ hw, cls, user, sub }) {
  const ai = useAI();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(!sub);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    let check = null;
    try {
      const r = await ai.runTask('check_homework', { subject: cls.subject, task: `${hw.title}\n${hw.text}`, answer: text, expected: hw.expected }, { locale: 'ru', timeoutMs: 40000 });
      check = r?.data || null;
    } catch { check = null; }
    if (school.submitHomework(hw.id, user, text, check)) { setText(''); setEditing(false); }
    setBusy(false);
  };
  if (sub && !editing) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-black text-ink/50">Твой ответ · {time(sub.at)}</div>
        <p className="whitespace-pre-wrap rounded-xl bg-white px-3 py-2 text-sm font-semibold">{sub.text}</p>
        <SvetlanaCheck check={sub.check} />
        {sub.mark ? (
          <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-black">✅ Оценка учителя: {sub.mark}{sub.comment ? ` · ${sub.comment}` : ''}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink/50">Учитель ещё не поставил оценку.</span>
            <button className="btn-ghost !py-1.5 text-sm" onClick={() => { setText(sub.text); setEditing(true); }}>Исправить и сдать заново</button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <textarea aria-label={`Ответ: ${hw.title}`} className={input} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Напиши решение или ответ…" disabled={busy} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary !py-2" disabled={!text.trim() || busy} onClick={send}>{busy ? 'Светлана проверяет…' : 'Сдать на проверку Светлане'}</button>
        {sub && !busy && <button className="btn-ghost !py-2" onClick={() => setEditing(false)}>Отмена</button>}
      </div>
    </div>
  );
}
