import { useState } from 'react';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { LOCALES } from '../../i18n/index.js';
import { TEACHERS, CADET_TEACHER, introVideoUrl } from '../../data/teachers.js';
import { TRACKS, trackById } from '../../data/tracks.js';
import Avatar from '../../avatar/Avatar.jsx';
import { Modal } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';
import { track } from '../../core/analytics.js';

// Emma, Alex, Sofia (filter keeps the row safe if the teacher list changes).
const HERO_TEACHERS = ['emma', 'alex', 'sofia'].map((id) => TEACHERS.find((t) => t.id === id)).filter(Boolean);
const VERSION_LABEL = { ru: 'Версия', en: 'Version' };
const pick = (v, locale) => (v && (v[locale] || v.en)) || '';

// Consent texts (152-FZ art. 9: a child's data needs a parent's consent; under 14 the parent decides).
const CONSENT_VERSION = 1;
const L_CONSENT = {
  ru: 'Мне исполнилось 14 лет, или мой родитель (законный представитель) разрешил регистрацию и согласен на обработку моих данных',
  en: 'I am 14 or older, or my parent (legal guardian) allowed me to register and agrees to the processing of my data',
};
const L_PRIVACY = { ru: 'Как мы обращаемся с данными', en: 'How we handle data' };
const L_STATS = { ru: 'Разрешаю анонимную статистику посещений (можно не ставить)', en: 'Allow anonymous usage statistics (optional)' };
const L_AGE = { ru: 'Возрастная маркировка 6+', en: 'Age rating 6+' };

export default function Login() {
  const { setUser, locale, setLocale, prefs, setPref } = useApp();
  const t = useT();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [agree, setAgree] = useState(false);
  const [stats, setStats] = useState(!!prefs.analyticsConsent);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const version = trackById(prefs.track);
  const hero = version.id === 'cadet' ? [CADET_TEACHER] : HERO_TEACHERS;

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && !agree) return;
    setBusy(true); setErr(null);
    try {
      if (mode === 'register') {
        // Consent is recorded before anything else, analytics only if the box was ticked.
        setPref('consents', { ...(prefs.consents || {}), data: { at: new Date().toISOString(), v: CONSENT_VERSION } });
        setPref('analyticsConsent', !!stats);
      }
      const user = mode === 'login' ? await api.login(form) : await api.register(form);
      track(mode === 'register' ? 'sign_up' : 'login');
      sfx.levelUp();
      setUser(user);
    } catch (ex) { setErr('auth.err.' + (ex.message || 'credentials')); }
    setBusy(false);
  };
  const demo = async (email, password) => {
    setBusy(true); setErr(null);
    try { setUser(await api.login({ email, password })); sfx.levelUp(); }
    catch (ex) { setErr('auth.err.' + ex.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex justify-end p-4 gap-1">
        {LOCALES.map((l) => (
          <button key={l.id} onClick={() => setLocale(l.id)} aria-pressed={locale === l.id}
            className={`chip cursor-pointer ${locale === l.id ? '!bg-primary text-white' : ''}`}>{l.flag} {l.label}</button>
        ))}
      </div>
      <div className="flex-1 grid lg:grid-cols-2 gap-10 items-center max-w-6xl w-full mx-auto px-6 pb-10">
        {/* Brand side */}
        <div className="text-center lg:text-left">
          <div className="flex justify-center lg:justify-start items-end gap-[-10px] mb-6">
            {hero.map((tc, i) => (
              <div key={tc.id} className={`${hero.length === 1 ? 'w-36 md:w-44' : 'w-24 md:w-32'} ${hero.length > 1 && i === 1 ? 'z-10 scale-110 mx-[-14px]' : ''} anim-floaty`} style={{ animationDelay: i * 0.5 + 's' }}>
                <Avatar teacher={tc} />
              </div>
            ))}
          </div>
          <h1 className="h1">🎓 {t('app.name')}</h1>
          {version.id === 'cadet' && <p className="mt-2 font-black text-ink/70">🎖️ {pick(CADET_TEACHER.tagline, locale)} · {CADET_TEACHER.name}</p>}
          <p className="mt-3 text-lg font-semibold text-ink/60 max-w-md mx-auto lg:mx-0">{t('auth.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start items-center">
            <span className="text-xs font-black text-ink/50 uppercase tracking-wider">{pick(VERSION_LABEL, locale)}:</span>
            {TRACKS.map((v) => (
              <button key={v.id} onClick={() => { sfx.click(); setPref('track', v.id); }} aria-pressed={version.id === v.id}
                className={`chip cursor-pointer ${version.id === v.id ? '!bg-primary text-white' : ''}`}>{v.emoji} {pick(v.title, locale)}</button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
            <span className="chip font-black" title={pick(L_AGE, locale)} aria-label={pick(L_AGE, locale)}>6+</span>
            <span className="chip">🧑‍🏫 {t('auth.feature.avatars')}</span>
            <span className="chip">🧩 {t('auth.feature.tasks')}</span>
            <span className="chip">🎮 {t('auth.feature.games')}</span>
            <span className="chip">🎤 {t('auth.feature.talk')}</span>
          </div>
          <button className="btn-primary mt-5 !px-6" onClick={() => { sfx.click(); setIntroOpen(true); }}>
            🎬 {t('auth.intro')}
          </button>
        </div>

        <Modal open={introOpen} onClose={() => setIntroOpen(false)} wide>
          <video key={locale} src={introVideoUrl(locale)} controls autoPlay playsInline className="w-full rounded-2xl bg-black aspect-video" />
        </Modal>

        {/* Auth card */}
        <div className="card p-7 max-w-md w-full mx-auto">
          <h2 className="h2 mb-4">{t('auth.title')}</h2>
          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input className="input" placeholder={t('auth.name')} value={form.name} required
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            )}
            <input className="input" type="email" placeholder={t('auth.email')} value={form.email} required
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" type="password" placeholder={t('auth.password')} value={form.password} required minLength={6}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {mode === 'register' && (
              <div className="space-y-2 text-sm font-semibold text-ink/70">
                <label className="flex items-start gap-2 cursor-pointer min-h-[44px]">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={agree} required onChange={(e) => setAgree(e.target.checked)} />
                  <span>{pick(L_CONSENT, locale)}. <a href="./privacy.html" target="_blank" rel="noreferrer" className="underline text-primary">{pick(L_PRIVACY, locale)}</a></span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer min-h-[44px]">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={stats} onChange={(e) => setStats(e.target.checked)} />
                  <span>{pick(L_STATS, locale)}</span>
                </label>
              </div>
            )}
            {err && <div className="text-rose-500 font-bold text-sm anim-shake">{t(err)}</div>}
            <button className="btn-primary w-full" disabled={busy || (mode === 'register' && !agree)}>
              {mode === 'login' ? t('auth.login') : t('auth.register')}
            </button>
          </form>
          <button className="mt-3 w-full text-center font-bold text-primary text-sm min-h-[44px]"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(null); }}>
            {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
          </button>
          <div className="flex items-center gap-3 my-4 text-ink/40 font-bold text-xs uppercase tracking-wider">
            <div className="h-px bg-ink/10 flex-1" />{t('auth.or')}<div className="h-px bg-ink/10 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost text-sm" disabled={busy} onClick={() => demo('student@demo', 'demo123')}>🎒 {t('auth.demoStudent')}</button>
            <button className="btn-ghost text-sm" disabled={busy} onClick={() => demo('teacher@demo', 'teacher123')}>🧑‍🏫 {t('auth.demoTeacher')}</button>
            <button className="btn-ghost text-sm" disabled={busy} onClick={() => demo('parent@demo', 'parent123')}>👪 {t('auth.demoParent')}</button>
            <button className="btn-ghost text-sm" disabled={busy} onClick={() => demo('admin@demo', 'admin123')}>🛠️ {t('auth.demoAdmin')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
