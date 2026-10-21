// Откуда взят текст программы: отдельно для содержания и для результатов.
// live   — при сборке взят дословно из ФОП ред. от 10.11.2025 (КонсультантПлюс), см. apps/web/frp-noo-content.js;
// fop    — копия текста ФОП ред. от 10.11.2025 в репозитории (сверена при добавлении, при сборке не перечитывается);
// corpus — корпус ЕДСОО (частично 2023 г.), с действующей редакцией не сверен;
// none   — данных нет.
export const PROVENANCE = {
  live: { icon: '✅', label: 'сверено с ФОП ред. 10.11.2025 при сборке', ok: true },
  fop: { icon: '☑️', label: 'из ФОП ред. 10.11.2025, копия в репозитории', ok: true },
  corpus: { icon: '⚠️', label: 'из корпуса ЕДСОО, с действующей ФОП не сверено', ok: false },
  none: { icon: '—', label: 'нет данных', ok: false },
};
const CURRENT_EDITION = /ред\. от 10\.11\.2025/;
const CONSULTANT_DOC = /^https?:\/\/(www\.)?consultant\.ru\/document\/cons_doc_LAW_\d+\//;
// Статичный файл считается копией ФОП, только если и ссылка ведёт на документ в КонсультантПлюс, и указана действующая редакция.
export const staticSource = (p) => (CONSULTANT_DOC.test(p?.source_url || '') && CURRENT_EDITION.test(p?.source_doc || '') ? 'fop' : 'corpus');
const known = (k) => (PROVENANCE[k] ? k : 'corpus');
export function provenance(p) {
  const hasContent = Array.isArray(p?.sections) && p.sections.some((s) => s?.topics?.length);
  return {
    content: hasContent ? known(p.content_src || staticSource(p)) : 'none',
    results: p?.results?.length ? known(p.results_src || 'corpus') : 'none',
  };
}
