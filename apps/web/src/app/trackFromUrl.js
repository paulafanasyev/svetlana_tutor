// Opens a tutor version straight from a link: ?track=cadet | lyceum | care | base.
// School link: ?track=cadet&lock=1 fixes the version (the top switcher is hidden, settings show it as set by the school);
// ?lock=0 removes the lock. Imported first in main.jsx, so the saved preference is in place before the store reads it.
// trackFromLink: the next learner who signs in on this device gets this version (store.applyUserTrack).
const ALLOWED = ['base', 'cadet', 'lyceum', 'care'];
try {
  const q = new URLSearchParams(window.location.search);
  const track = q.get('track');
  const lock = q.get('lock');
  if (ALLOWED.includes(track) || lock === '0' || lock === '1') {
    const prefs = JSON.parse(window.localStorage.getItem('aet_prefs') || '{}') || {};
    if (ALLOWED.includes(track)) { prefs.track = track; prefs.trackFromLink = true; }
    if (lock === '1' && ALLOWED.includes(track)) prefs.trackLock = true;
    if (lock === '0') prefs.trackLock = false;
    window.localStorage.setItem('aet_prefs', JSON.stringify(prefs));
  }
} catch { /* storage may be blocked in a sandboxed frame */ }
