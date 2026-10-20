// /english: the English section overview. The tiles that used to sit on the home page live here now.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT } from '../../core/store.js';
import { teacherById } from '../../data/teachers.js';
import { vocabulary, pickOne } from '../../data/index.js';
import { pickL } from '../../i18n/index.js';
import { sfx } from '../../audio/sfx.js';
import { englishTitle } from './EnglishTabs.jsx';

const L_SUB = {
  base: { ru: 'Уроки, разговор с учителем, игры на слова и грамматику, подготовка к экзаменам.', en: 'Lessons, conversation with your teacher, word and grammar games, exam prep.' },
  lyceum: { ru: 'Углублённый уровень: сложнее задания, олимпиадные вопросы, подготовка к экзаменам.', en: 'Advanced level: harder tasks, olympiad-style questions, exam prep.' },
};

export default function EnglishHub() {
  const { user, locale, prefs } = useApp();
  const t = useT();
  const cadet = prefs.track === 'cadet';
  const teacher = teacherById(user.teacherId);
  const [tip] = useState(() => pickOne(vocabulary.filter((w) => w.level === (user.level || 'A1'))));
  const TILES = [
    { to: '/lesson', icon: cadet ? '🎯' : '📖', title: t('home.startLesson'), desc: t('home.lessonDesc'), cls: 'from-violet-500 to-fuchsia-500' },
    { to: '/talk', icon: cadet ? '📻' : '🎤', title: t('home.quickTalk', { name: teacher.name }), desc: t('home.talkDesc'), cls: 'from-sky-500 to-cyan-400' },
    { to: '/games', icon: cadet ? '🧭' : '🎮', title: t('home.playGames'), desc: t('home.gamesDesc'), cls: 'from-amber-500 to-orange-500' },
    { to: '/exams', icon: '📝', title: t('home.exams'), desc: t('home.examsDesc'), cls: 'from-rose-500 to-red-500' },
    { to: '/courses', icon: '🎓', title: t('home.courses'), desc: t('home.coursesDesc'), cls: 'from-emerald-500 to-teal-500' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">🔤 {englishTitle(prefs.track, locale)}</h1>
        <p className="mt-1 font-semibold text-ink/60">{pickL(prefs.track === 'lyceum' ? L_SUB.lyceum : L_SUB.base, locale)}</p>
        <div className="mt-2 chip">🎯 {t('home.level')}: <b>{user.level || 'A1'}</b></div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {TILES.map((c) => (
          <Link key={c.to} to={c.to} onClick={() => sfx.click()}
            className={`rounded-3xl p-5 text-white bg-gradient-to-br ${c.cls} shadow-xl hover:-translate-y-1 transition block`}>
            <div className="text-4xl">{c.icon}</div>
            <div className="mt-2 text-lg font-black leading-tight">{c.title}</div>
            <div className="text-sm font-semibold text-white/80 mt-1">{c.desc}</div>
          </Link>
        ))}
      </div>
      {tip && (
        <div className="card p-5 flex items-center gap-4">
          <div className="text-3xl">{cadet ? '📌' : '💡'}</div>
          <div>
            <div className="label">{t('home.tip.title')}</div>
            <div className="font-black text-lg">{tip.en} — {tip.ru}</div>
            <div className="text-sm font-semibold text-ink/50 italic">{tip.exEn}</div>
          </div>
        </div>
      )}
    </div>
  );
}
