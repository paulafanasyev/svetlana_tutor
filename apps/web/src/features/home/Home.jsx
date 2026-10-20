import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { teacherById } from '../../data/teachers.js';
import { greetingFor } from '../../data/index.js';
import { pickL } from '../../i18n/index.js';
import { rankOf } from '../../i18n/cadet.js';
import Avatar, { SpeechBubble, useEmotion } from '../../avatar/Avatar.jsx';
import { tts } from '../../audio/tts.js';
import { Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';

// Home is the school desk: curriculum subjects, maths, class, diary. English has its own section (/english, see Layout).
const L_SUB = { ru: 'Чем займёмся сегодня? Выбирай предмет.', en: 'What shall we study today? Pick a subject.', vi: 'Hôm nay học gì? Chọn môn học.' };
const L_SCHOOL = {
  title: { ru: 'Мои предметы 1–11', en: 'My subjects 1–11', vi: 'Môn học của tôi 1–11' },
  desc: { ru: 'Темы ФОП по классам, учебники ФПУ, ЭОР и китайский язык', en: 'Topics by grade, approved textbooks, e-resources, Chinese', vi: 'Chủ đề theo lớp, sách giáo khoa, tài nguyên số, tiếng Trung' },
};
const L_MATH = {
  title: { ru: 'Математика', en: 'Math', vi: 'Toán' },
  desc: { ru: 'Разбор задач с репетитором', en: 'Solve problems with a tutor', vi: 'Giải bài cùng gia sư' },
};
const L_CLASS = {
  title: { ru: 'Мой класс', en: 'My class', vi: 'Lớp của tôi' },
  desc: { ru: 'Класс, задания и чат', en: 'Class, assignments and chat', vi: 'Lớp, bài tập và trò chuyện' },
};
const L_DIARY = { title: { ru: 'Дневник', en: 'Diary' }, desc: { ru: 'Оценки, домашние задания и расписание', en: 'Grades, homework and timetable' } };
// Кадетская версия: те же разделы, уставные названия.
const L_CADET = {
  school: { ru: 'Учебная часть: программа 1–11', en: 'Academic programme 1–11' },
  class: { ru: 'Мой взвод', en: 'My platoon' },
  classDesc: { ru: 'Взвод, задания и связь', en: 'Platoon, assignments and chat' },
  diary: { ru: 'Журнал успеваемости', en: 'Progress log' },
};
const L_ORDERS = [
  { to: '/programs', title: { ru: 'Самоподготовка по программе', en: 'Self-study' }, desc: { ru: 'Тема по ФОП твоего класса', en: 'A curriculum topic for your grade' } },
  { to: '/math', title: { ru: 'Математика', en: 'Maths' }, desc: { ru: 'Задачи с разбором, около 10 минут', en: 'Problems with explanations, about 10 minutes' } },
  { to: '/classroom', title: { ru: 'Задания взвода', en: 'Platoon tasks' }, desc: { ru: 'Проверь объявления и домашнее задание', en: 'Check notices and homework' } },
];

export default function Home() {
  const { user, locale, prefs } = useApp();
  const t = useT();
  const cadet = prefs?.track === 'cadet';
  const teacher = teacherById(user.teacherId);
  const [stats, setStats] = useState(null);
  const [talking, setTalking] = useState(false);
  const [bubble, setBubble] = useState(null);
  const [emotion, flash] = useEmotion();

  useEffect(() => { api.getStats().then(setStats).catch(() => {}); }, [user.xp]);

  const sayHello = () => {
    sfx.pop();
    const text = cadet && teacher.greeting ? teacher.greeting : greetingFor(user.name);
    setBubble(text);
    flash('happy', 1200);
    const ok = tts.speak(text, teacher, { onStart: () => setTalking(true), onEnd: () => { setTalking(false); setTimeout(() => setBubble(null), 2500); } });
    if (!ok) setTimeout(() => setBubble(null), 3500);
  };

  const CTA = [
    { to: '/programs', icon: cadet ? '🎖️' : '📚', title: cadet ? pickL(L_CADET.school, locale) : pickL(L_SCHOOL.title, locale), desc: pickL(L_SCHOOL.desc, locale), cls: 'from-blue-600 to-sky-500' },
    { to: '/math', icon: cadet ? '📐' : '🧮', title: pickL(L_MATH.title, locale), desc: pickL(L_MATH.desc, locale), cls: 'from-lime-600 to-emerald-500' },
    { to: '/classroom', icon: cadet ? '🪖' : '👥', title: cadet ? pickL(L_CADET.class, locale) : pickL(L_CLASS.title, locale), desc: cadet ? pickL(L_CADET.classDesc, locale) : pickL(L_CLASS.desc, locale), cls: 'from-slate-600 to-slate-500' },
    { to: '/diary', icon: '📔', title: cadet ? pickL(L_CADET.diary, locale) : pickL(L_DIARY.title, locale), desc: pickL(L_DIARY.desc, locale), cls: 'from-indigo-500 to-violet-500' },
  ];
  const rank = rankOf(user.xp, locale);
  const mentorName = cadet && teacher.rank ? (locale === 'ru' ? `${teacher.rank.ru} ${teacher.name}` : (teacher.nameEn || teacher.name)) : teacher.name;

  return (
    <div className="space-y-6">
      {/* Hero with live avatar */}
      <div className="card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-visible">
        <button onClick={sayHello} className="w-40 md:w-48 shrink-0 relative group" title="👋">
          <Avatar teacher={teacher} talking={talking} emotion={emotion} frame={user.frame} />
          <span className="absolute -bottom-1 -right-1 text-2xl bg-surface rounded-full p-1.5 shadow group-hover:scale-110 transition">{cadet ? '🫡' : '👋'}</span>
        </button>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {bubble
            ? <SpeechBubble className="inline-block">{bubble}</SpeechBubble>
            : (
              <>
                <h1 className="h1">{t('home.hello', { name: user.name })}</h1>
                <p className="mt-1 font-semibold text-ink/60">{cadet ? t('home.subtitle') : pickL(L_SUB, locale)}</p>
              </>
            )}
          <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
            {cadet && <span className="chip">🎖️ {t('cadet.rank')}: <b>{rank.name}</b></span>}
            <span className="chip">🧑‍🏫 {t('home.myTeacher')}: <b>{mentorName}</b></span>
            {!cadet && <Link to="/teacher" className="chip hover:bg-primary hover:text-white transition cursor-pointer">🔄 {t('home.changeTeacher')}</Link>}
          </div>
        </div>
      </div>

      {/* Кадетская версия: задача на сегодня */}
      {cadet && (
        <div className="card p-5 cadet-order">
          <div className="label mb-2">{t('cadet.task.title')}</div>
          <div className="grid md:grid-cols-3 gap-3">
            {L_ORDERS.map((o, i) => (
              <Link key={o.to} to={o.to} onClick={() => sfx.click()} className="flex gap-3 items-start rounded-xl p-3 bg-soft hover:brightness-95 transition">
                <span className="shrink-0 w-8 h-8 flex items-center justify-center font-black text-sm" style={{ background: 'rgb(var(--c-primary))', color: '#f3ead0', clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)' }}>{i + 1}</span>
                <span className="min-w-0"><span className="block font-black leading-tight">{pickL(o.title, locale)}</span><span className="block text-xs font-semibold text-ink/60 mt-0.5">{pickL(o.desc, locale)}</span></span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cadet
          ? <Stat icon="🎖️" label={t('cadet.rank')} value={rank.name} sub={rank.next ? t('cadet.toNext', { rank: rank.nextName, xp: rank.next }) : t('cadet.maxRank')} />
          : <Stat icon="🎯" label={t('home.level')} value={user.level} sub={`LVL ${1 + Math.floor(user.xp / 250)}`} />}
        <Stat icon={cadet ? '🎞️' : '⭐'} label={t('home.xp')} value={user.xp} sub={cadet ? `${t('home.level')} ${user.level || 'A1'}` : undefined} />
        <Stat icon={cadet ? '🎗️' : '🪙'} label={t('home.coins')} value={user.coins} />
        <Stat icon="🔥" label={t('home.streak')} value={(stats?.streak ?? 0) + (locale === 'ru' && cadet ? ' дн.' : 'd')} />
        <Stat icon={cadet ? '🎯' : '✅'} label={t('home.accuracy')} value={stats ? Math.round(stats.accuracy * 100) + '%' : '—'} sub={stats ? `${stats.total} ${t('home.attempts').toLowerCase()}` : ''} />
      </div>

      {/* Subjects and school sections */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CTA.map((c) => (
          <Link key={c.to} to={c.to} onClick={() => sfx.click()}
            className={`rounded-3xl p-5 text-white bg-gradient-to-br ${c.cls} shadow-xl hover:-translate-y-1 transition block`}>
            <div className="text-4xl">{c.icon}</div>
            <div className="mt-2 text-lg font-black leading-tight">{c.title}</div>
            <div className="text-sm font-semibold text-white/80 mt-1">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
