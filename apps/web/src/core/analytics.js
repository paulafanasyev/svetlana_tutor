// Лёгкая обёртка аналитики (GA4). Выключена, пока нет ОБОИХ условий:
//   1) задан Measurement ID (VITE_GA_ID при сборке или window.__AET_GA_ID__ до app.js);
//   2) родитель/пользователь согласился на аналитику (aet_prefs.analyticsConsent === true).
// Это трансграничная передача данных (152-ФЗ ст. 12): для детского пилота по умолчанию выключена.
function gaId() {
  try {
    if (import.meta && import.meta.env && import.meta.env.VITE_GA_ID) return import.meta.env.VITE_GA_ID;
  } catch { /* import.meta.env недоступен в офлайн-сборке — идём дальше */ }
  if (typeof window !== 'undefined' && window.__AET_GA_ID__) return window.__AET_GA_ID__;
  return '';
}

function consented() {
  try { return (JSON.parse(localStorage.getItem('aet_prefs') || '{}') || {}).analyticsConsent === true; } catch { return false; }
}

let ready = false;

export function initAnalytics() {
  if (ready || typeof window === 'undefined' || typeof document === 'undefined') return;
  const id = gaId();
  if (!id || !consented()) return; // нет ID или нет согласия — тихо выключена
  ready = true;
  try {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false, anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
    const pageview = () => track('page_view', { page_path: (location.hash || '#/').replace(/^#/, '') || '/' });
    pageview();
    window.addEventListener('hashchange', pageview); // hash-роутинг SPA
  } catch { /* не ломаем приложение из-за аналитики */ }
}

// Универсальный трекер события. Безопасен, если аналитика не подключена. Тексты ребёнка никогда не передаются.
export function track(event, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
  } catch { /* ignore */ }
}
