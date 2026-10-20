import { create } from 'zustand';
import { api } from './api.js';
import { storage } from './storage.js';
import { translate, normalizeLocale } from '../i18n/index.js';
import { resolveUserTrack } from '../data/tracks.js';

const savedPrefs = storage.get('aet_prefs', {});
const initialLocale = normalizeLocale(savedPrefs.locale);

export const useApp = create((set, get) => ({
  user: null,
  booted: false,
  locale: initialLocale,
  prefs: {
    musicOn: false,
    musicStyle: 'lofi',
    musicVol: 0.45,
    sfxOn: true,
    voiceOn: true,
    theme: 'candy',
    ...savedPrefs,
    locale: initialLocale,
  },

  async boot() {
    const user = await api.current();
    if (user?.theme) get().applyTheme(user.theme);
    set({ user, booted: true });
    get().applyUserTrack(user);
  },
  async refresh() {
    const user = await api.current();
    set({ user });
    get().applyUserTrack(user);
  },
  setUser(user) {
    set({ user });
    get().applyUserTrack(user);
  },

  // Tutor version is kept per learner on this device (see resolveUserTrack in data/tracks.js).
  applyUserTrack(user) {
    if (!user || !user.id) return;
    const prefs = get().prefs;
    const track = resolveUserTrack(prefs, user.id);
    const map = prefs.trackByUser || {};
    if (prefs.track === track && map[user.id] === track && !prefs.trackFromLink) return;
    const next = { ...prefs, track, trackByUser: { ...map, [user.id]: track }, trackFromLink: false };
    set({ prefs: next });
    get().savePrefs(next);
  },

  setLocale(locale) {
    const next = normalizeLocale(locale);
    set({ locale: next });
    get().savePrefs({ locale: next });
  },
  setPref(key, value) {
    let prefs = { ...get().prefs, [key]: value };
    const user = get().user;
    if (key === 'track' && user && user.id) prefs = { ...prefs, trackByUser: { ...(prefs.trackByUser || {}), [user.id]: value }, trackFromLink: false };
    set({ prefs });
    get().savePrefs(prefs);
    if (key === 'theme') get().applyTheme(value);
  },
  savePrefs(patch) {
    const cur = storage.get('aet_prefs', {});
    storage.set('aet_prefs', { ...cur, ...patch, locale: normalizeLocale(patch.locale || get().locale) });
  },
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'candy');
  },
}));

// Translation hook bound to current locale
export function useT() {
  const locale = useApp((s) => s.locale);
  return (key, params) => translate(locale, key, params);
}
export function useLocale() {
  return useApp((s) => s.locale);
}
