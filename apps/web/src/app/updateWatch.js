// New build detection for the PWA: an installed app can stay open for days and keep old code in memory.
// When the learner comes back to the app (tab visible again) or moves between sections, we compare the main
// script of the live index.html with the one this page runs; if a new deploy is out, the page reloads once.
// Progress is in local storage, so a reload loses nothing; we never reload in the middle of typing.
const MAIN = /assets\/index-[\w-]+\.js/;

function currentMain() {
  try {
    for (const s of document.querySelectorAll('script[src]')) {
      const m = s.getAttribute('src').match(MAIN);
      if (m) return m[0];
    }
  } catch { /* noop */ }
  return '';
}

let checking = false;
let last = 0;
async function check(force = false) {
  const mine = currentMain();
  if (!mine || checking) return;
  if (!force && Date.now() - last < 60 * 1000) return;
  checking = true; last = Date.now();
  try {
    const html = await (await fetch(`./index.html?v=${Date.now()}`, { cache: 'no-store' })).text();
    const live = (html.match(MAIN) || [])[0];
    const typing = document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (live && live !== mine && !typing) location.reload();
  } catch { /* offline: keep the running version */ }
  checking = false;
}

try {
  if (typeof window !== 'undefined' && !import.meta.env.DEV) {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(true); });
    window.addEventListener('hashchange', () => check(false));
    window.addEventListener('online', () => check(true));
  }
} catch { /* noop */ }

export const checkForUpdate = () => check(true);
