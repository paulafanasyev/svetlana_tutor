import demoUrls from './assetUrls.demo.json';

// Published Pages builds use the repository's local media. Remote demo media is
// opt-in only, so a production build never depends on a hyperagent host.
const PUBLISHED = import.meta.env.VITE_REMOTE_ASSETS === '1' && import.meta.env.VITE_PUBLISHED === '1';

export const spriteUrl = (id) => (PUBLISHED ? demoUrls.avatars[id] : `assets/avatars/${id}.webp`);
// Old recorded greetings use the previous English names, so the picker speaks `greeting` with TTS instead.
export const greetingUrl = (id) => (PUBLISHED ? demoUrls.voices[id] : `assets/voice/${id}.mp3`);
// Intro video matches the interface language (ru / en)
export const introVideoUrl = (locale = 'ru') => {
  const lang = ['en', 'ru'].includes(locale) ? locale : 'ru';
  return PUBLISHED ? (demoUrls.introVideo[lang] || demoUrls.introVideo.ru) : `assets/video/intro-${lang}.mp4`;
};

// Sprite sheet layout (2×2): TL neutral · TR talking · BL happy · BR encouraging
// Ids stay the same (avatars, saved choices, purchases); only the names are Russian.
export const TEACHERS = [
  { id: 'emma',  name: 'Светлана', nameEn: 'Svetlana', emoji: '☀️', bg: '#FBE3CF', accent: '#E9A23B', gender: 'f',
    voice: { pitch: 1.12, rate: 1.0 },
    tagline: { en: 'Warm & supportive', ru: 'Тёплая и поддерживающая' },
    greeting: "Hi! I'm Svetlana, your English teacher. Learning English is like making a new friend — let's have some fun together!" },
  { id: 'james', name: 'Дмитрий', nameEn: 'Dmitry', emoji: '🎧', bg: '#DCEFE3', accent: '#3E9B6C', gender: 'm',
    voice: { pitch: 0.85, rate: 0.97 },
    tagline: { en: 'Calm & confident', ru: 'Спокойный и уверенный' },
    greeting: "Hello there! My name is Dmitry. Step by step, word by word — we're going to make English feel easy." },
  { id: 'sofia', name: 'Ольга', nameEn: 'Olga', emoji: '💃', bg: '#D9E8F5', accent: '#C0533E', gender: 'f',
    voice: { pitch: 1.02, rate: 1.02 },
    tagline: { en: 'Bold & inspiring', ru: 'Смелая и вдохновляющая' },
    greeting: "Hello! I'm Olga. Every mistake is a step forward, so don't be shy. Let's speak English!" },
  { id: 'alex',  name: 'Алексей', nameEn: 'Alexey', emoji: '⚡', bg: '#D8E9F7', accent: '#D96A2B', gender: 'm',
    voice: { pitch: 1.05, rate: 1.1 },
    tagline: { en: 'Energetic & fun', ru: 'Энергичный и заводной' },
    greeting: "Hey! Alexey here! Ready to level up your English like a video game? Let's go — first quest starts now!" },
];

// Cadet version: Dmitry serves as a reserve major, an officer-educator of a cadet corps.
// The saved id stays 'james' (no server changes); only the look, name, voice and greeting change.
// Until a portrait is uploaded, Avatar draws the 'cadet' face from avatar/faces.js (uniform, short haircut).
export const CADET_TEACHER = {
  id: 'cadet', baseId: 'james', name: 'Андрей Николаевич', nameEn: 'Major Andrey', emoji: '🎖️', bg: '#E4E8DA', accent: '#4F6B3A', gender: 'm',
  voice: { pitch: 0.8, rate: 0.95 },
  tagline: { en: 'Reserve major, cadet corps officer-educator', ru: 'Майор запаса, офицер-воспитатель' },
  greeting: "Good day, cadet! I'm Major Andrey Nikolaevich, your English instructor. A little practice every day, and English will become your strong side. Ready? Let's begin!",
};

const trackId = () => {
  try { return (JSON.parse(localStorage.getItem('aet_prefs') || '{}') || {}).track || 'base'; } catch { return 'base'; }
};
const forTrack = (t) => (t && t.id === CADET_TEACHER.baseId && trackId() === 'cadet' ? CADET_TEACHER : t);

// Teachers as shown in the current tutor version.
export const teachersForTrack = () => TEACHERS.map(forTrack);

// Unknown or removed teacher ids (e.g. old saved choices) fall back to Svetlana.
export const teacherById = (id) => {
  const key = id === CADET_TEACHER.id ? CADET_TEACHER.baseId : id;
  return forTrack(TEACHERS.find((t) => t.id === key) || TEACHERS[0]);
};
