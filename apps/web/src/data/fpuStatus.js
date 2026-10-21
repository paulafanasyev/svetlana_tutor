// Статус учебников ФПУ (приказ № 436): код позиции и предельный срок использования.
// Номера в разных таблицах перечня повторяются (например, № 205 есть и у ОРКСЭ, и у литературы 8 кл.),
// поэтому учебник однозначно определяет пара «номер + код», а не номер.
export const statusKey = (b) => `${b.fpu_number}|${b.subject}`;
const ymdLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const isExpired = (b, today) => !!b.use_until && b.use_until < (typeof today === 'string' ? today : ymdLocal(today));
export function withStatus(list, status) {
  const items = status?.items || {};
  return list.map((b) => (items[statusKey(b)] ? { ...b, ...items[statusKey(b)] } : b));
}
// Учебники, которые сегодня можно использовать: просроченные (срок «до 31 августа» прошёл) не показываем.
export const activeTextbooks = (list, status, today = new Date()) => withStatus(list, status).filter((b) => !isExpired(b, today));
const RU_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export function fmtUntil(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? `${Number(m[3])} ${RU_MONTHS[Number(m[2]) - 1]} ${m[1]} г.` : '';
}
export const textbookKey = (b) => `${b.fpu_number}-${b.fpu_code || ''}-${b.subject}-${b.title}-${(b.grades || []).join('-')}`;
