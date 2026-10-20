// Слова интерфейса по версии репетитора: в кадетской версии «Урок» = «Занятие», «Магазин» = «Знаки отличия» и т. д.
// Активная версия выставляется из app/trackTheme.js; translate() сначала смотрит сюда.
import cadet from './cadet.js';

const DICTS = { cadet };
let active = 'base';
export function setTrackWords(id) { active = id || 'base'; }
export function trackWord(locale, key) {
  const d = DICTS[active];
  if (!d) return undefined;
  return d[locale]?.[key] ?? d.en?.[key];
}
