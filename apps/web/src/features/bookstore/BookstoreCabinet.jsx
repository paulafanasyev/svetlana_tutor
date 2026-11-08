import { useMemo, useState } from 'react';
import { useT, useLocale } from '../../core/store.js';
import { Modal, Toggle, Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';
import { useBookstore } from './useBookstore.js';
import { BOOK_SUBJECTS, BOOK_FORMATS } from './catalog.js';
import { formatPrice, MAX_GRADE } from './bookstore.js';

const LISTING_STATUS_CLS = {
  pending: '!bg-amber-100 text-amber-700', approved: '!bg-emerald-100 text-emerald-700', rejected: '!bg-rose-100 text-rose-600',
};
const subjectName = (id) => BOOK_SUBJECTS.find((s) => s.id === id)?.name || id;
const fmtGrades = ([lo, hi]) => lo === hi ? String(lo) : `${lo}–${hi}`;

function timeOf(at, locale) {
  try { return new Date(at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function BookCard({ book, t, owned, onBuy }) {
  return (
    <div className="card p-4 flex flex-col">
      <div className="flex items-start gap-3">
        <span className="text-4xl shrink-0" aria-hidden="true">{book.coverEmoji || '📕'}</span>
        <div className="min-w-0 flex-1">
          <div className="font-black leading-tight">{book.title}</div>
          <div className="text-xs font-bold text-ink/55">{book.author}</div>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{subjectName(book.subject)}</span>
            <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{t('bs.grades')} {fmtGrades(book.grades)}</span>
            <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{book.format.toUpperCase()}</span>
          </div>
        </div>
        <span className="font-black text-primary whitespace-nowrap">{formatPrice(book.price)}</span>
      </div>
      {book.description && <div className="text-xs font-semibold text-ink/55 mt-2 leading-snug line-clamp-2">{book.description}</div>}
      <div className="text-[11px] font-bold text-ink/40 mt-1">{book.rightsHolder}</div>
      <div className="mt-3 pt-2 border-t border-black/5">
        {owned
          ? <button type="button" className="btn-ghost w-full !py-2 text-sm" disabled>✓ {t('bs.owned')}</button>
          : <button type="button" className="btn-primary w-full !py-2 text-sm" onClick={() => onBuy(book.id)}>
              {book.price === 0 ? t('bs.getFree') : t('bs.buy')} · {formatPrice(book.price)}
            </button>}
      </div>
    </div>
  );
}

function SubmitBookModal({ open, onClose, t, onSubmit, initial }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [author, setAuthor] = useState(initial?.author || '');
  const [subject, setSubject] = useState(initial?.subject || BOOK_SUBJECTS[0].id);
  const [gradeLo, setGradeLo] = useState(initial ? String(initial.grades[0]) : '5');
  const [gradeHi, setGradeHi] = useState(initial ? String(initial.grades[1]) : '5');
  const [price, setPrice] = useState(initial ? String(initial.price) : '0');
  const [format, setFormat] = useState(initial?.format || 'pdf');
  const [description, setDescription] = useState(initial?.description || '');
  const [rightsHolder, setRightsHolder] = useState(initial?.rightsHolder || '');
  const [license, setLicense] = useState(initial?.license || 'own');
  const [coverEmoji, setCoverEmoji] = useState(initial?.coverEmoji || '📕');
  const isEdit = !!initial;

  const submit = () => {
    const raw = {
      id: initial?.id || 'bk-' + Date.now().toString(36),
      title: title.trim(), author: author.trim(), subject, grades: [Number(gradeLo), Number(gradeHi)],
      price: Number(price), description: description.trim(), format, rightsHolder: rightsHolder.trim(),
      license, coverEmoji: coverEmoji.trim() || '📕',
    };
    const res = onSubmit(raw, isEdit);
    if (res.ok) onClose();
    return res;
  };

  const valid = title.trim() && author.trim() && rightsHolder.trim() && description.trim()
    && Number(gradeLo) >= 1 && Number(gradeHi) <= MAX_GRADE && Number(gradeLo) <= Number(gradeHi)
    && Number(price) >= 0 && Number.isInteger(Number(price));

  return (
    <Modal open={open} onClose={onClose} wide>
      <h2 className="h2 mb-4">📚 {isEdit ? t('bs.partner.edit') : t('bs.submit.title')}</h2>
      <label className="label mb-1 block">{t('bs.submit.title_field')}</label>
      <input className="input w-full mb-3" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      <label className="label mb-1 block">{t('bs.submit.author')}</label>
      <input className="input w-full mb-3" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={150} />
      <label className="label mb-1 block">{t('bs.submit.subject')}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {BOOK_SUBJECTS.map((s) => (
          <button key={s.id} type="button" onClick={() => setSubject(s.id)}
            className={`btn !py-1.5 !px-3 text-xs ${subject === s.id ? 'btn-primary' : 'btn-ghost'}`}>{s.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label mb-1 block">{t('bs.submit.gradeLo')}</label>
          <input className="input w-full" type="number" min="1" max={String(MAX_GRADE)} value={gradeLo} onChange={(e) => setGradeLo(e.target.value)} />
        </div>
        <div>
          <label className="label mb-1 block">{t('bs.submit.gradeHi')}</label>
          <input className="input w-full" type="number" min="1" max={String(MAX_GRADE)} value={gradeHi} onChange={(e) => setGradeHi(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label mb-1 block">{t('bs.submit.price')}</label>
          <input className="input w-full" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="label mb-1 block">{t('bs.submit.format')}</label>
          <div className="flex gap-2">
            {BOOK_FORMATS.map((f) => (
              <button key={f} type="button" onClick={() => setFormat(f)}
                className={`btn !py-2 !px-3 text-xs flex-1 ${format === f ? 'btn-primary' : 'btn-ghost'}`}>{f.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>
      <label className="label mb-1 block">{t('bs.submit.description')}</label>
      <textarea className="input w-full mb-3" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label mb-1 block">{t('bs.submit.rightsHolder')}</label>
          <input className="input w-full" value={rightsHolder} onChange={(e) => setRightsHolder(e.target.value)} maxLength={150} />
        </div>
        <div>
          <label className="label mb-1 block">{t('bs.submit.license')}</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setLicense('own')} className={`btn !py-2 !px-3 text-xs flex-1 ${license === 'own' ? 'btn-primary' : 'btn-ghost'}`}>{t('bs.license.own')}</button>
            <button type="button" onClick={() => setLicense('licensed')} className={`btn !py-2 !px-3 text-xs flex-1 ${license === 'licensed' ? 'btn-primary' : 'btn-ghost'}`}>{t('bs.license.licensed')}</button>
          </div>
        </div>
      </div>
      <label className="label mb-1 block">{t('bs.submit.coverEmoji')}</label>
      <input className="input w-full mb-5" value={coverEmoji} onChange={(e) => setCoverEmoji(e.target.value)} maxLength={4} />
      <button type="button" className="btn-primary w-full" disabled={!valid} onClick={submit}>{t('bs.submit.save')}</button>
    </Modal>
  );
}

function RejectModal({ open, onClose, t, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="h2 mb-3">🛡️ {t('bs.mod.rejectTitle')}</h2>
      <label className="label mb-1 block">{t('bs.mod.rejectReason')}</label>
      <textarea className="input w-full mb-4" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
      <button type="button" className="btn-primary w-full !bg-rose-500" disabled={!reason.trim()} onClick={() => { onConfirm(reason.trim()); setReason(''); onClose(); }}>{t('bs.mod.rejectConfirm')}</button>
    </Modal>
  );
}

export default function BookstoreCabinet() {
  const t = useT();
  const locale = useLocale();
  const bs = useBookstore();
  const [tab, setTab] = useState('catalog');
  const [subject, setSubject] = useState('all');
  const [grade, setGrade] = useState('');
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rejectId, setRejectId] = useState(null);

  const flash = (res, okText) => {
    if (res.ok) { if (okText) { setMsg({ ok: true, text: okText }); setTimeout(() => setMsg(null), 2500); } return; }
    sfx.wrong?.();
    setMsg({ ok: false, text: res.error?.message || String(res.error) });
    setTimeout(() => setMsg(null), 3500);
  };

  const visible = useMemo(() => {
    const filters = {};
    if (subject !== 'all') filters.subject = subject;
    if (grade) filters.grade = Number(grade);
    if (query.trim()) filters.query = query.trim();
    return Object.keys(filters).length ? bs.search(filters) : bs.catalog;
  }, [bs.catalog, bs.search, subject, grade, query]);

  const tabs = [
    { id: 'catalog', icon: '📚', label: t('bs.tab.catalog') },
    { id: 'library', icon: '📖', label: t('bs.tab.library') },
    { id: 'orders', icon: '🧾', label: t('bs.tab.orders') },
    ...(bs.isPartner ? [{ id: 'partner', icon: '🏷️', label: t('bs.tab.partner') }] : []),
    ...(bs.isModerator ? [{ id: 'moderation', icon: '🛡️', label: t('bs.tab.moderation') }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h1 className="h1">📚 {t('bs.title')}</h1>
        <span className={`chip ml-auto ${bs.enabled ? '!bg-emerald-100 text-emerald-700' : '!bg-rose-100 text-rose-600'}`}>{bs.enabled ? t('bs.open') : t('bs.closed')}</span>
      </div>
      <p className="font-semibold text-ink/55 mb-4">{t('bs.sub')}</p>

      {msg && <div className={`card p-3 mb-4 font-bold anim-pop ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.ok ? '✅' : '😿'} {msg.text}</div>}

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((x) => <button key={x.id} type="button" onClick={() => { sfx.click?.(); setTab(x.id); }} className={`btn !py-2 !px-4 text-sm ${tab === x.id ? 'btn-primary' : 'btn-ghost'}`}>{x.icon} {x.label}</button>)}
      </div>

      {tab === 'catalog' && (
        !bs.enabled ? <div className="card p-8 text-center font-bold text-ink/45">{t('bs.disabled')}</div> : (
          <div>
            <input className="input w-full mb-3" placeholder={t('bs.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="flex gap-2 mb-3 flex-wrap">
              <button type="button" onClick={() => setSubject('all')} className={`btn !py-1.5 !px-3 text-xs ${subject === 'all' ? 'btn-primary' : 'btn-ghost'}`}>{t('bs.all')}</button>
              {BOOK_SUBJECTS.map((s) => (
                <button key={s.id} type="button" onClick={() => setSubject(s.id)} className={`btn !py-1.5 !px-3 text-xs ${subject === s.id ? 'btn-primary' : 'btn-ghost'}`}>{s.name}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="label !mb-0">{t('bs.grade')}:</span>
              <input className="input !py-1 !px-2 !w-16 text-sm" type="number" min="1" max={String(MAX_GRADE)} placeholder="5" value={grade} onChange={(e) => setGrade(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {visible.map((book) => (
                <BookCard key={book.id} book={book} t={t} owned={bs.hasBook(book.id)} onBuy={(id) => flash(bs.buy(id), t('bs.purchased'))} />
              ))}
              {visible.length === 0 && <div className="card p-6 text-center font-bold text-ink/40 sm:col-span-2">{t('bs.emptyCatalog')}</div>}
            </div>
          </div>
        )
      )}

      {tab === 'library' && (
        <div className="space-y-3">
          <div className="label">📖 {t('bs.tab.library')} · {bs.library.length}</div>
          {bs.library.length === 0 && <div className="card p-8 text-center font-bold text-ink/40">{t('bs.noLibrary')}</div>}
          {bs.library.map((entry) => (
            <div key={entry.listingId} className="card p-4 flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">{entry.coverEmoji || '📕'}</span>
              <div className="min-w-0 flex-1">
                <div className="font-black truncate">{entry.title}</div>
                <div className="text-xs font-bold text-ink/55">{entry.author}</div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{subjectName(entry.subject)}</span>
                  <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{t('bs.grades')} {fmtGrades(entry.grades)}</span>
                  <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{entry.format.toUpperCase()}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold text-ink/40">{timeOf(entry.purchasedAt, locale)}</div>
                <div className="font-black text-primary">{formatPrice(entry.price)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {bs.orders.length === 0 && <div className="card p-8 text-center font-bold text-ink/40">{t('bs.noOrders')}</div>}
          {bs.orders.slice().reverse().map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl" aria-hidden="true">{o.coverEmoji || '📕'}</span>
                <span className="font-black truncate">{o.title}</span>
                <span className="font-black text-primary ml-auto">{formatPrice(o.price)}</span>
              </div>
              <div className="text-xs font-bold text-ink/55 mt-0.5">{o.author}</div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{subjectName(o.subject)}</span>
                <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{t('bs.grades')} {fmtGrades(o.grades)}</span>
                <span className="chip !bg-soft text-ink/60 !text-[10px] !py-0.5">{o.format.toUpperCase()}</span>
                {o.free && <span className="chip !bg-emerald-100 text-emerald-700 !text-[10px] !py-0.5">{t('bs.free')}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-ink/40">
                <span>{timeOf(o.createdAt, locale)}</span>
                {bs.isModerator && <span className="ml-auto">{t('bs.by')}: {o.userId}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'partner' && bs.isPartner && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="label">🏷️ {t('bs.partner.title')}</div>
            <button type="button" className="btn-primary !py-1.5 !px-3 text-xs ml-auto" onClick={() => { setEditing(null); setSubmitOpen(true); }}>＋ {t('bs.partner.add')}</button>
          </div>
          {bs.myListings.length === 0 && <div className="card p-6 text-center font-bold text-ink/40">{t('bs.partner.noListings')}</div>}
          <div className="space-y-2">
            {bs.myListings.map((b) => (
              <div key={b.id} className="card p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl" aria-hidden="true">{b.coverEmoji || '📕'}</span>
                  <span className="font-black truncate">{b.title}</span>
                  <span className={`chip ${LISTING_STATUS_CLS[b.status]} text-xs`}>{t('bs.listing.' + b.status)}</span>
                  <span className="font-black text-primary ml-auto">{formatPrice(b.price)}</span>
                </div>
                <div className="text-xs font-bold text-ink/55 mt-0.5">{b.author} · {subjectName(b.subject)} · {t('bs.grades')} {fmtGrades(b.grades)}</div>
                {b.status === 'rejected' && b.rejectReason && <div className="text-xs font-semibold text-rose-500 mt-1">{t('bs.partner.rejectReason')}: {b.rejectReason}</div>}
                {b.status === 'pending' && (
                  <button type="button" className="btn-ghost !py-1 !px-3 text-xs mt-2" onClick={() => { setEditing(b); setSubmitOpen(true); }}>✏️ {t('bs.partner.edit')}</button>
                )}
              </div>
            ))}
          </div>
          <SubmitBookModal open={submitOpen} onClose={() => { setSubmitOpen(false); setEditing(null); }} t={t} initial={editing}
            onSubmit={(raw, isEdit) => { const res = isEdit ? bs.editListing(raw.id, raw) : bs.submitListing(raw); flash(res, t('bs.submit.added')); return res; }} />
        </div>
      )}

      {tab === 'moderation' && bs.isModerator && (
        <div className="space-y-6">
          <div className="card p-4"><Toggle checked={bs.enabled} onChange={(v) => bs.setEnabled(v)} label={t('bs.mod.enable')} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon="📚" label={t('bs.mod.stats.catalog')} value={bs.catalog.length} />
            <Stat icon="⏳" label={t('bs.mod.stats.pending')} value={bs.pending.length} />
            <Stat icon="🧾" label={t('bs.mod.stats.orders')} value={bs.orders.length} />
            <Stat icon="📖" label={t('bs.mod.stats.readers')} value={new Set(bs.orders.map((o) => o.userId)).size} />
          </div>
          <div>
            <div className="label mb-2">⏳ {t('bs.mod.pending')}</div>
            <div className="space-y-2">
              {bs.pending.length === 0 && <div className="card p-6 text-center font-bold text-ink/40">{t('bs.mod.noPending')}</div>}
              {bs.pending.map((b) => (
                <div key={b.id} className="card p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl" aria-hidden="true">{b.coverEmoji || '📕'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-black truncate">{b.title}</div>
                      <div className="text-xs font-bold text-ink/55">{b.author} · {subjectName(b.subject)} · {t('bs.grades')} {fmtGrades(b.grades)}</div>
                    </div>
                    <span className="font-black text-primary">{formatPrice(b.price)}</span>
                  </div>
                  {b.description && <div className="text-xs font-semibold text-ink/55 mt-1.5 leading-snug">{b.description}</div>}
                  <div className="text-[11px] font-bold text-ink/40 mt-1">{b.format.toUpperCase()} · {b.rightsHolder} · {b.partnerId}</div>
                  <div className="flex gap-2 mt-3">
                    <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => flash(bs.approve(b.id), t('bs.mod.approved'))}>✓ {t('bs.mod.approve')}</button>
                    <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs text-rose-500" onClick={() => setRejectId(b.id)}>✕ {t('bs.mod.reject')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <RejectModal open={!!rejectId} onClose={() => setRejectId(null)} t={t} onConfirm={(reason) => flash(bs.reject(rejectId, reason), t('bs.mod.rejected'))} />
        </div>
      )}
    </div>
  );
}
