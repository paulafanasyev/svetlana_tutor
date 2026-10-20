// «Уроки»: the student's school day in one place.
// 1) live video lessons of the student's classes; 2) all homework from every class (submit right here,
// Svetlana checks, the teacher marks); 3) the subjects of the student's grade from the federal curriculum (ФОП),
// each split into lessons (the same split the teacher's planner uses). If the class teacher saved a lesson plan
// for that program, its dates and homework are shown; otherwise lessons are just numbered (no invented dates).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../core/store.js';
import { school } from './schoolStore.js';
import { PLANS, findPrograms, fmtHours, buildPlan } from './fop.js';
import HomeworkAnswer from './HomeworkAnswer.jsx';
import RuOnly from './RuOnly.jsx';

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// Where to practise a subject interactively right now.
const PRACTICE = {
  'Математика': ['/math', '🧮 Решать со Светланой'],
  'Алгебра': ['/math', '🧮 Решать со Светланой'],
  'Геометрия': ['/math', '🧮 Решать со Светланой'],
  'Алгебра и начала математического анализа': ['/math', '🧮 Решать со Светланой'],
  'Иностранный язык': ['/english', '🔤 Английский: упражнения и разговор'],
};
const ICON = {
  'Русский язык': '✍️', 'Литературное чтение': '📖', 'Литература': '📖', 'Иностранный язык': '🔤', 'Математика': '🧮', 'Алгебра': '🧮',
  'Геометрия': '📐', 'Вероятность и статистика': '🎲', 'Информатика': '💻', 'История': '🏛️', 'Обществознание': '⚖️', 'География': '🌍',
  'Физика': '🧲', 'Химия': '⚗️', 'Биология': '🌿', 'Окружающий мир': '🌳', 'Изобразительное искусство': '🎨', 'Музыка': '🎵',
  'Труд (технология)': '🛠️', 'Физическая культура': '⚽', 'Основы безопасности и защиты Родины': '🛡️',
  'Основы религиозных культур и светской этики': '🕊️', 'Духовно-нравственная культура России': '🕊️',
};

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayRu = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '');
const planOf = (g) => Object.values(PLANS).find((p) => p.grades.includes(g)) || PLANS['ООО'];
const readJson = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full storage */ } };

function useSchoolDb() {
  const [db, setDb] = useState(() => school.get());
  useEffect(() => school.subscribe(setDb), []);
  return db;
}

// Lessons of a program: the class teacher's saved plan if there is one, otherwise the ФОП split.
function lessonsOf(program, classes) {
  for (const c of classes) {
    const saved = school.getPlan(c.teacherId, program.id);
    if (saved?.lessons?.length) return { lessons: saved.lessons, by: c };
  }
  return { lessons: buildPlan(program, { start: '', days: [] }), by: null };
}

function HomeworkBlock({ db, user, classes }) {
  const ids = new Set(classes.map((c) => c.id));
  const list = db.homework.filter((h) => ids.has(h.classId)).map((h) => {
    const sub = db.submissions.find((x) => x.hwId === h.id && x.studentId === String(user.id)) || null;
    return { h, sub, cls: classes.find((c) => c.id === h.classId), late: !!(h.due && !sub && h.due < today()) };
  }).sort((a, b) => (!!a.sub - !!b.sub) || (a.h.due || '9999').localeCompare(b.h.due || '9999') || b.h.createdAt - a.h.createdAt);
  const open = list.filter((x) => !x.sub).length;
  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-black text-lg">🏠 Домашние задания{open ? ` · не сдано: ${open}` : ''}</div>
        <Link to="/classroom" className="text-sm font-bold text-primary underline">Мой класс и чат</Link>
      </div>
      {classes.length === 0 && (
        <p className="text-sm font-semibold text-ink/60">Задания приходят от учителя. Войди в свой класс по коду в разделе <Link to="/classroom" className="underline text-primary">«Мой класс»</Link>, и они появятся здесь.</p>
      )}
      {classes.length > 0 && list.length === 0 && <p className="text-sm font-semibold text-ink/50">Учителя пока не задали домашних заданий.</p>}
      {list.map(({ h, sub, cls, late }) => (
        <details key={h.id} className="rounded-2xl bg-soft/60 p-3" open={!sub && list.indexOf(list.find((x) => !x.sub)) === list.findIndex((x) => x.h.id === h.id)}>
          <summary className="cursor-pointer font-black">
            {sub ? (sub.mark ? `✅ ${sub.mark} · ` : '📨 ') : late ? '⏰ ' : '📝 '}{cls?.subject ? `${cls.subject}: ` : ''}{h.title}
            <span className="text-sm font-bold text-ink/50">{h.due ? ` · до ${dayRu(h.due)}` : ''}{late ? ' · срок прошёл' : sub && !sub.mark ? ' · ждёт оценки' : ''}</span>
          </summary>
          <div className="mt-2 space-y-3">
            <div className="text-xs font-bold text-ink/50">{cls?.title} · учитель {cls?.teacherName}</div>
            {h.text && <p className="whitespace-pre-wrap text-sm font-semibold">{h.text}</p>}
            {cls && <HomeworkAnswer hw={h} cls={cls} user={user} sub={sub} />}
          </div>
        </details>
      ))}
    </div>
  );
}

function SubjectView({ subject, grade, hours, classes, done, toggle, onBack }) {
  const programs = findPrograms(subject, grade);
  const [mod, setMod] = useState(0);
  const program = programs[mod] || programs[0] || null;
  const practice = PRACTICE[subject];
  const { lessons, by } = useMemo(() => (program ? lessonsOf(program, classes.filter((c) => c.subject === subject)) : { lessons: [], by: null }), [program, classes, subject]);
  const mine = new Set(program ? done[program.id] || [] : []);
  const next = lessons.find((l) => !mine.has(l.n));
  const sections = [];
  lessons.forEach((l) => { const last = sections[sections.length - 1]; if (last && last.title === l.section) last.items.push(l); else sections.push({ title: l.section, items: [l] }); });
  const t0 = today();
  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button className="text-sm font-bold text-primary" onClick={onBack}>← Все предметы</button>
          <div className="font-black text-xl mt-1">{ICON[subject] || '📘'} {subject}, {grade} класс</div>
          <div className="text-sm font-bold text-ink/60">{fmtHours(hours)} ч в неделю{program ? ` · уроков в списке: ${lessons.length} · пройдено: ${lessons.filter((l) => mine.has(l.n)).length}` : ''}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {practice && <Link to={practice[0]} className="btn-primary !py-2 text-sm">{practice[1]}</Link>}
          <Link to="/programs" className="btn-ghost !py-2 text-sm">📋 Программа и учебники</Link>
        </div>
      </div>
      {programs.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Модуль">
          {programs.map((p, i) => (
            <button key={p.id} onClick={() => setMod(i)} aria-pressed={p.id === program?.id} className={`rounded-full px-4 py-1.5 text-sm font-black ${p.id === program?.id ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`}>{p.subject.split(': ').slice(1).join(': ') || p.subject}</button>
          ))}
        </div>
      )}
      {!program && <p className="font-semibold text-ink/60">Уроки этого предмета пока не добавлены: ждём полный текст федеральной программы.</p>}
      {program && (
        <p className="rounded-xl bg-soft/60 px-3 py-2 text-sm font-semibold text-ink/70">
          {by ? `🗓️ По плану учителя (${by.teacherName}, ${by.title}): даты и домашние задания из его плана.` : 'Уроки по федеральной рабочей программе, в порядке её разделов. Когда учитель составит план, здесь появятся даты и домашние задания.'}
          {next ? ` Следующий: урок ${next.n}.` : lessons.length ? ' Все уроки отмечены, молодец!' : ''}
        </p>
      )}
      {sections.map((s, si) => (
        <details key={`${si}-${s.title}`} className="rounded-2xl bg-soft/60 p-3" open={s.items.some((l) => l === next)}>
          <summary className="cursor-pointer font-black">{s.title} <span className="text-sm font-bold text-ink/50">· {s.items.filter((l) => mine.has(l.n)).length}/{s.items.length}</span></summary>
          <ul className="mt-2 space-y-1.5">
            {s.items.map((l) => {
              const isDone = mine.has(l.n);
              const isToday = l.date && l.date === t0;
              return (
                <li key={l.n} className={`flex items-start gap-3 rounded-xl px-3 py-2 ${l === next ? 'bg-white shadow-sm ring-2 ring-primary/40' : 'bg-white/60'}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-primary,#2563eb)]" checked={isDone} onChange={() => toggle(program.id, l.n)} aria-label={`Урок ${l.n} пройден`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-ink/50">Урок {l.n}{l.date ? ` · ${dayRu(l.date)}` : ''}{isToday ? ' · сегодня' : ''}{l === next ? ' · следующий' : ''}</div>
                    <div className={`text-sm font-semibold ${isDone ? 'text-ink/50 line-through' : 'text-ink/90'}`}>{l.topic}</div>
                    {l.hw && <div className="mt-1 text-xs font-bold text-amber-700">🏠 ДЗ: {l.hw}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
      {program && <a href={program.source_url} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-primary underline">Источник: {program.source_doc}</a>}
    </div>
  );
}

export default function Lessons() {
  const { user } = useApp();
  const db = useSchoolDb();
  const gKey = `aet_grade_${user.id}`, dKey = `aet_done_lessons_${user.id}`;
  const [grade, setGradeState] = useState(() => { const g = Number(readJson(gKey, 5)); return GRADES.includes(g) ? g : 5; });
  const [done, setDone] = useState(() => { const v = readJson(dKey, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; });
  const [subject, setSubject] = useState(null);
  const setGrade = (g) => { setGradeState(g); writeJson(gKey, g); setSubject(null); };
  const toggle = (pid, n) => setDone((d) => {
    const cur = new Set(Array.isArray(d[pid]) ? d[pid] : []);
    if (cur.has(n)) cur.delete(n); else cur.add(n);
    const nextDone = { ...d, [pid]: [...cur] };
    writeJson(dKey, nextDone);
    return nextDone;
  });

  const classes = db.classes.filter((c) => c.members.some((m) => m.id === String(user.id)));
  const live = classes.filter((c) => c.lesson);
  const plan = planOf(grade);
  const gi = plan.grades.indexOf(grade);
  const rows = plan.rows.filter(([, h]) => h[gi] > 0);
  const progressOf = (s) => {
    const p = findPrograms(s, grade)[0];
    if (!p) return null;
    const total = buildPlan(p, { start: '', days: [] }).length;
    return { total, done: (done[p.id] || []).length };
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">📖 Уроки</h1>
        <p className="text-sm font-semibold text-ink/60 mt-1">Домашние задания из всех твоих классов и уроки по предметам твоего класса по федеральной программе. Отмечай пройденные уроки, чтобы видеть, что дальше.</p>
      </div>
      <RuOnly />

      {live.map((c) => (
        <div key={c.id} className="card p-4 flex flex-wrap items-center justify-between gap-3 !border-2 !border-rose-300">
          <div className="font-black">🔴 Идёт урок: {c.subject}{c.lesson.topic ? ` · ${c.lesson.topic}` : ''} <span className="text-sm font-bold text-ink/50">({c.title}, {c.teacherName})</span></div>
          <a className="btn-primary !py-2" href={c.lesson.url} target="_blank" rel="noreferrer">Войти в видеоурок</a>
        </div>
      ))}

      <HomeworkBlock db={db} user={user} classes={classes} />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Класс">
        <span className="font-black mr-1">📚 Предметы · класс:</span>
        {GRADES.map((g) => (
          <button key={g} onClick={() => setGrade(g)} aria-pressed={g === grade} className={`rounded-full min-w-[2.5rem] px-3 py-1.5 text-sm font-black ${g === grade ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`}>{g}</button>
        ))}
      </div>

      {subject ? (
        <SubjectView key={`${grade}-${subject}`} subject={subject} grade={grade} hours={(rows.find(([s]) => s === subject) || [null, []])[1][gi] || 0} classes={classes} done={done} toggle={toggle} onBack={() => setSubject(null)} />
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {rows.map(([s, h]) => {
            const pr = progressOf(s);
            const hwOpen = db.homework.filter((x) => classes.some((c) => c.id === x.classId && c.subject === s) && !db.submissions.some((y) => y.hwId === x.id && y.studentId === String(user.id))).length;
            return (
              <button key={s} onClick={() => setSubject(s)} className="card p-4 text-left hover:brightness-95 transition flex flex-col gap-1">
                <span className="text-3xl" aria-hidden="true">{ICON[s] || '📘'}</span>
                <span className="font-black leading-tight">{s}</span>
                <span className="text-xs font-bold text-ink/50">{fmtHours(h[gi])} ч/нед.{pr ? ` · ${pr.done}/${pr.total} ур.` : ' · скоро'}</span>
                {pr && pr.total > 0 && <span className="mt-1 h-1.5 rounded-full bg-soft overflow-hidden"><span className="block h-full bg-primary" style={{ width: `${Math.round((pr.done / pr.total) * 100)}%` }} /></span>}
                {hwOpen > 0 && <span className="text-xs font-black text-amber-700">🏠 ДЗ: {hwOpen}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
