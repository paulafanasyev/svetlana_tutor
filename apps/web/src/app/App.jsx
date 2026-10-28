import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp, useT } from '../core/store.js';
import { music } from '../audio/music.js';
import { setSfxEnabled } from '../audio/sfx.js';
import { setVoiceEnabled } from '../audio/tts.js';
import Layout from './Layout.jsx';
import TrackBar from './TrackBar.jsx';
import { publicAssetUrl } from './cadetWelcomeAsset.js';
import Login from '../features/auth/Login.jsx';
import TeacherPicker from '../features/picker/TeacherPicker.jsx';
import Home from '../features/home/Home.jsx';
import { EnglishShell } from '../features/english/EnglishTabs.jsx';

// Everything except the first screens is loaded on demand: the school programs
// (ФОП data for grades 1–11), exams, courses and games are large and most
// children never open all of them in one visit.
// If a chunk fails to load (new deploy, flaky network) one reload fixes it.
const retryLazy = (factory) => lazy(() => factory().catch((error) => {
  const key = 'aet_chunk_reload';
  if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); location.reload(); }
  throw error;
}));
const EnglishHub = retryLazy(() => import('../features/english/EnglishHub.jsx'));
const Lesson = retryLazy(() => import('../features/lessons/Lesson.jsx'));
const Talk = retryLazy(() => import('../features/talk/Talk.jsx'));
const GamesHub = retryLazy(() => import('../features/games/GamesHub.jsx'));
const WordBattle = retryLazy(() => import('../features/games/WordBattle.jsx'));
const GrammarShooter = retryLazy(() => import('../features/games/GrammarShooter.jsx'));
const Quest = retryLazy(() => import('../features/games/Quest.jsx'));
const Memory = retryLazy(() => import('../features/games/Memory.jsx'));
const SchoolGames = retryLazy(() => import('../features/games/school/SchoolGames.jsx'));
const Shop = retryLazy(() => import('../features/shop/Shop.jsx'));
const Progress = retryLazy(() => import('../features/progress/Progress.jsx'));
const Admin = retryLazy(() => import('../features/admin/Admin.jsx'));
const Settings = retryLazy(() => import('../features/settings/Settings.jsx'));
const TeacherCabinet = retryLazy(() => import('../features/journal/TeacherCabinet.jsx'));
const ParentCabinet = retryLazy(() => import('../features/journal/ParentCabinet.jsx'));
const ExamCenter = retryLazy(() => import('../features/exams/ExamCenter.jsx'));
const Courses = retryLazy(() => import('../features/courses/Courses.jsx'));
const StudentDiary = retryLazy(() => import('../features/journal/StudentDiary.jsx'));
const MathTutor = retryLazy(() => import('../features/math/MathTutor.jsx'));
const Programs = retryLazy(() => import('../features/school/Programs.jsx'));
const Lessons = retryLazy(() => import('../features/school/Lessons.jsx'));
const Planner = retryLazy(() => import('../features/school/Planner.jsx'));
const ClassRoom = retryLazy(() => import('../features/school/ClassRoom.jsx'));
const AssistantChat = retryLazy(() => import('../features/assistant/AssistantChat.jsx'));

const DEV = !!import.meta.env.DEV;

class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null, stack: '' }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { this.setState({ stack: info?.componentStack || '' }); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="card p-6 max-w-xl text-center">
          <div className="text-5xl">😵</div>
          <div className="h2 mt-2">Oops!</div>
          {DEV && <p className="font-semibold text-ink/60 mt-1 text-sm break-all">{String(this.state.err?.message || this.state.err)}</p>}
          {DEV && this.state.stack && <pre className="text-left text-[10px] leading-tight mt-2 max-h-60 overflow-auto bg-soft rounded-xl p-3 whitespace-pre-wrap">{this.state.stack}</pre>}
          <button className="btn-primary w-full mt-4" onClick={() => { this.setState({ err: null, stack: '' }); location.hash = '#/'; }}>↻ Reload</button>
        </div>
      </div>
    );
  }
}

function Splash() {
  const t = useT();
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center anim-pop">
        <div className="text-6xl anim-floaty">🎓</div>
        <div className="h2 mt-3">{t('app.name')}</div>
        <div className="text-ink/50 font-semibold mt-1">{t('common.loading')}</div>
      </div>
    </div>
  );
}

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Splash />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// English screens share one section with inner tabs (features/english/EnglishTabs.jsx).
const En = ({ children }) => <EnglishShell>{children}</EnglishShell>;

// ВРЕМЕННО: переключатель версий над всеми экранами (включая вход), см. TrackBar.jsx.
export default function App() {
  const track = useApp((s) => s.prefs.track);
  return (
    <>
      <TrackBar />
      <AppScreens />
      <CadetWelcomeGate track={track} />
    </>
  );
}

// Opening greeting for the locked cadet-school experience. The video is an optional
// public asset resolved relative to Vite's configured base path. Speech synthesis is
// the fallback until that asset is supplied or when browser media playback is unavailable.
const CADET_WELCOME_VIDEO_URL = publicAssetUrl(import.meta.env.BASE_URL, 'assets/cadet-general-chuikov.mp4');
function CadetWelcomeGate({ track }) {
  const [dismissed, setDismissed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [started, setStarted] = useState(false);
  const videoRef = useRef(null);
  const utteranceRef = useRef(null);
  const active = track === 'cadet' && !dismissed;

  useEffect(() => {
    if (track !== 'cadet') return;
    setDismissed(false);
    setVideoReady(false);
    setVideoFailed(false);
    setStarted(false);
    try {
      const video = videoRef.current;
      if (video) { video.pause(); video.currentTime = 0; }
    } catch { /* The media element may not be mounted yet. */ }
  }, [track]);

  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  if (!active) return null;

  const enter = () => {
    try { window.speechSynthesis?.cancel(); } catch {}
    setDismissed(true);
  };

  const begin = async () => {
    setStarted(true);
    const video = videoRef.current;
    if (video && !videoFailed) {
      try {
        video.muted = false;
        video.currentTime = 0;
        await video.play();
        return;
      } catch { /* Browser policy/network: use the spoken fallback below. */ }
    }
    if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(
        'Кадет! Приветствую тебя в Репетиторе для кадетов. Здесь ценятся дисциплина, знания и уважение. Будь настойчив, думай самостоятельно и каждый день становись сильнее. Приступай к занятиям!'
      );
      utterance.lang = 'ru-RU';
      utterance.rate = 0.92;
      utterance.pitch = 0.82;
      utterance.onend = enter;
      utterance.onerror = enter;
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      return;
    }
    enter();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cadet-welcome-title"
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-[#151a0d] p-4 text-[#f4edcf]"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 20%, #46502a 0%, #222916 55%, #11150b 100%)' }}>
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border-2 border-[#c9a227] text-3xl text-[#e0c35c]" aria-hidden="true">★</div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d5c783]">Кадетский корпус · Вводный инструктаж</p>
        <h1 id="cadet-welcome-title" className="mb-4 text-3xl font-black uppercase tracking-wide sm:text-4xl">Генерал Чуйков приветствует кадета</h1>
        <div className="relative mx-auto mb-4 aspect-[2/3] w-full max-w-[260px] overflow-hidden border-4 border-[#c9a227] bg-[#303824] shadow-2xl">
          <video ref={videoRef} src={CADET_WELCOME_VIDEO_URL} playsInline preload="metadata"
            className={`h-full w-full object-cover ${videoFailed ? 'hidden' : ''}`}
            onCanPlay={() => setVideoReady(true)} onError={() => setVideoFailed(true)}
            onEnded={enter} aria-label="Видео-приветствие генерала Чуйкова" />
          {(videoFailed || !videoReady) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#596343] to-[#1b2112] p-5">
              <div className="text-7xl" aria-hidden="true">🎖</div>
              <div className="text-lg font-black uppercase leading-snug">Служу знаниям.<br/>Готовься к занятиям.</div>
              <div className="text-xs uppercase tracking-widest text-[#d5c783]">Репетитор для кадетов</div>
            </div>
          )}
        </div>
        <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-[#e4dfc8]">
          «Кадет, приветствую тебя! Здесь ценятся дисциплина, знания и уважение. Будь настойчив, думай самостоятельно и каждый день становись сильнее. Приступай к занятиям!»
        </p>
        {!started ? (
          <button type="button" onClick={begin} className="w-full border-2 border-[#e0c35c] bg-[#5b642f] px-6 py-4 font-black uppercase tracking-widest text-white shadow-lg hover:bg-[#6d7838]">
            ▶ Начать приветствие
          </button>
        ) : (
          <button type="button" onClick={enter} className="w-full border border-[#b8b08b] bg-black/20 px-6 py-3 font-bold uppercase tracking-widest text-[#f4edcf] hover:bg-black/40">
            Пропустить и войти
          </button>
        )}
        <p className="mt-3 text-[11px] text-[#c9c5ad]">Приветствие появляется при каждом новом запуске кадетской версии.</p>
      </div>
    </div>
  );
}

function AppScreens() {
  const { user, booted, prefs } = useApp();

  useEffect(() => { setSfxEnabled(prefs.sfxOn); }, [prefs.sfxOn]);
  useEffect(() => { setVoiceEnabled(prefs.voiceOn); }, [prefs.voiceOn]);
  useEffect(() => { try { music.setVolume(prefs.musicVol); } catch {} }, [prefs.musicVol]);
  useEffect(() => {
    try {
      if (prefs.musicOn) { music.setStyle(prefs.musicStyle); music.start(); music.setVolume(prefs.musicVol); }
      else music.stop();
    } catch {}
  }, [prefs.musicOn, prefs.musicStyle]);
  useEffect(() => () => music.stop(), []);
  // A successful render means chunks load fine again: allow the one-time reload next time.
  useEffect(() => { try { sessionStorage.removeItem('aet_chunk_reload'); } catch {} }, []);

  if (!booted) return <Splash />;
  if (!user) return <Login />;

  if (user.role === 'TEACHER') {
    return (
      <Layout>
        <Page>
          <Routes>
            <Route path="/teacher" element={<TeacherCabinet />} />
            <Route path="/assistant" element={<AssistantChat />} />
            <Route path="/classroom" element={<ClassRoom />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/teacher" replace />} />
          </Routes>
        </Page>
      </Layout>
    );
  }
  if (user.role === 'PARENT') {
    return (
      <Layout>
        <Page>
          <Routes>
            <Route path="/child" element={<ParentCabinet />} />
            <Route path="/assistant" element={<AssistantChat />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/child" replace />} />
          </Routes>
        </Page>
      </Layout>
    );
  }
  if (!user.teacherId) return <TeacherPicker firstTime />;

  return (
    <Layout>
      <Page>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/assistant" element={<AssistantChat />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/play" element={<SchoolGames />} />
          <Route path="/english" element={<En><EnglishHub /></En>} />
          <Route path="/lesson" element={<En><Lesson /></En>} />
          <Route path="/math" element={<MathTutor />} />
          <Route path="/talk" element={<En><Talk /></En>} />
          <Route path="/games" element={<En><GamesHub /></En>} />
          <Route path="/games/wordbattle" element={<En><WordBattle /></En>} />
          <Route path="/games/shooter" element={<En><GrammarShooter /></En>} />
          <Route path="/games/quest" element={<En><Quest /></En>} />
          <Route path="/games/memory" element={<En><Memory /></En>} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/exams" element={<En><ExamCenter /></En>} />
          <Route path="/courses" element={<En><Courses /></En>} />
          <Route path="/diary" element={<StudentDiary />} />
          <Route path="/classroom" element={<ClassRoom />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/teacher" element={<TeacherPicker />} />
          {user.role === 'ADMIN' && <Route path="/admin" element={<Admin />} />}
          {user.role === 'ADMIN' && <Route path="/planner" element={<Planner />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Page>
    </Layout>
  );
}
