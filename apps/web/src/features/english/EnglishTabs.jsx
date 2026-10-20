// English is one subject among the school ones, so it lives in its own section (/english) with inner tabs:
// overview, lesson, conversation, games, exams, courses. Old links (/lesson, /talk, /games/..., /exams, /courses)
// keep working and open inside the same section. In the lyceum version the section is the advanced level.
// The tab bar has no visible title: each page keeps its own single heading; the section name is the nav label.
import { NavLink } from 'react-router-dom';
import { useApp, useT } from '../../core/store.js';
import { pickL } from '../../i18n/index.js';
import { sfx } from '../../audio/sfx.js';

export const ENGLISH_PATHS = ['/english', '/lesson', '/talk', '/games', '/exams', '/courses'];
export const isEnglishPath = (path = '') => ENGLISH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

const TITLE = {
  base: { ru: 'Английский язык', en: 'English' },
  lyceum: { ru: 'Английский язык · углублённый уровень', en: 'English · advanced level' },
};
export const englishTitle = (track, locale) => pickL(track === 'lyceum' ? TITLE.lyceum : TITLE.base, locale);

export const ENGLISH_TABS = [
  { to: '/english', icon: '🧭', label: { ru: 'Обзор', en: 'Overview' }, end: true },
  { to: '/lesson', icon: '📖', key: 'nav.lesson' },
  { to: '/talk', icon: '💬', key: 'nav.talk' },
  { to: '/games', icon: '🎮', key: 'nav.games' },
  { to: '/exams', icon: '📝', key: 'nav.exams' },
  { to: '/courses', icon: '🎓', key: 'nav.courses' },
];

export default function EnglishTabs() {
  const { prefs, locale } = useApp();
  const t = useT();
  const label = (tab) => (tab.label ? pickL(tab.label, locale) : t(tab.key));
  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" aria-label={englishTitle(prefs.track, locale)}>
      {ENGLISH_TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} onClick={() => sfx.click()}
          className={({ isActive }) => `chip whitespace-nowrap min-h-[44px] !px-4 transition ${isActive ? '!bg-primary !text-white shadow' : 'hover:brightness-95'}`}>
          <span aria-hidden="true">{tab.icon}</span>{label(tab)}
        </NavLink>
      ))}
    </nav>
  );
}

export function EnglishShell({ children }) {
  return (
    <>
      <EnglishTabs />
      {children}
    </>
  );
}
