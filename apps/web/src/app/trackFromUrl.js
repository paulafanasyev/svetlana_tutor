// Opens a tutor version straight from a link: ?track=cadet | lyceum | care | base.
// Imported first in main.jsx, so the saved preference is in place before the store reads it.
const ALLOWED = ['base', 'cadet', 'lyceum', 'care'];
try {
  const track = new URLSearchParams(window.location.search).get('track');
  if (ALLOWED.includes(track)) {
    const prefs = JSON.parse(window.localStorage.getItem('aet_prefs') || '{}') || {};
    prefs.track = track;
    window.localStorage.setItem('aet_prefs', JSON.stringify(prefs));
  }
} catch { /* storage may be blocked in a sandboxed frame */ }
