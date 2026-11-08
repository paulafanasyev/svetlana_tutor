import { useMemo, useState } from 'react';
import { useT, useLocale } from '../../core/store.js';
import { Modal, Toggle, Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';
import { useMarketplace } from './useMarketplace.js';
import { GOODS_CATEGORIES } from './catalog.js';
import { formatPrice, MAX_QUANTITY } from './marketplace.js';

const ORDER_STATUS_CLS = {
  new: '!bg-sky-100 text-sky-700', confirmed: '!bg-amber-100 text-amber-700',
  shipped: '!bg-violet-100 text-violet-700', completed: '!bg-emerald-100 text-emerald-700',
  cancelled: '!bg-rose-100 text-rose-600',
};
const LISTING_STATUS_CLS = {
  pending: '!bg-amber-100 text-amber-700', approved: '!bg-emerald-100 text-emerald-700', rejected: '!bg-rose-100 text-rose-600',
};
const NEXT_STATUS = { new: 'confirmed', confirmed: 'shipped', shipped: 'completed' };
const catEmoji = (id) => GOODS_CATEGORIES.find((c) => c.id === id)?.emoji || '📦';

function timeOf(at, locale) {
  try { return new Date(at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function QtyStepper({ qty, onDec, onInc, max }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="−" onClick={onDec} className="w-8 h-8 rounded-lg bg-soft font-black text-lg grid place-items-center hover:bg-ink/10">−</button>
      <span className="w-7 text-center font-black tabular-nums">{qty}</span>
      <button type="button" aria-label="+" onClick={onInc} disabled={qty >= max} className="w-8 h-8 rounded-lg bg-primary text-white font-black text-lg grid place-items-center disabled:opacity-40">+</button>
    </div>
  );
}

function OrderCard({ order, t, locale, isModerator, onCancel, onAdvance }) {
  const cancelable = order.status === 'new' || order.status === 'confirmed';
  const next = NEXT_STATUS[order.status];
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`chip ${ORDER_STATUS_CLS[order.status]} font-black`}>{t('mkt.status.' + order.status)}</span>
        <span className="font-black">{formatPrice(order.total)}</span>
        <span className="text-[11px] font-bold text-ink/40 ml-auto">{timeOf(order.createdAt, locale)}</span>
      </div>
      <div className="mt-2 space-y-0.5">
        {order.items.map((l) => (
          <div key={l.itemId} className="flex items-center gap-2 text-sm font-semibold text-ink/70">
            <span aria-hidden="true">{l.emoji}</span><span className="text-ink/40 tabular-nums">{l.qty}×</span>
            <span className="truncate">{l.name}</span>
            <span className="ml-auto text-ink/45 tabular-nums">{formatPrice(l.price * l.qty)}</span>
          </div>
        ))}
      </div>
      {isModerator && <div className="text-[11px] font-bold text-ink/40 mt-1">{t('mkt.by')}: {order.userId}</div>}
      <div className="flex gap-2 mt-3">
        {isModerator && next && <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => onAdvance(order.id)}>{t('mkt.advance.' + next)} →</button>}
        {cancelable && <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs text-rose-500" onClick={() => onCancel(order.id)}>{t('mkt.cancel')}</button>}
      </div>
    </div>
  );
}

function SubmitListingModal({ open, onClose, t, onSubmit, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || GOODS_CATEGORIES[0].id);
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [stock, setStock] = useState(initial ? String(initial.stock) : '');
  const [brand, setBrand] = useState(initial?.brand || '');
  const [description, setDescription] = useState(initial?.description || '');
  const isEdit = !!initial;
  const submit = () => {
    const raw = {
      id: initial?.id || 'good-' + Date.now().toString(36),
      name: name.trim(), category, price: Number(price), stock: Number(stock),
      brand: brand.trim(), description: description.trim(), emoji: catEmoji(category),
    };
    const res = onSubmit(raw, isEdit);
    if (res.ok) onClose();
    return res;
  };
  return (
    <Modal open={open} onClose={onClose} wide>
      <h2 className="h2 mb-4">🏷️ {isEdit ? t('mkt.partner.edit') : t('mkt.submit.title')}</h2>
      <label className="label mb-1 block">{t('mkt.submit.name')}</label>
      <input className="input w-full mb-3" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
      <label className="label mb-1 block">{t('mkt.submit.category')}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {GOODS_CATEGORIES.map((c) => (
          <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`btn !py-2 !px-3 text-sm ${category === c.id ? 'btn-primary' : 'btn-ghost'}`}>{c.emoji} {t('mkt.cat.' + c.id)}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="label mb-1 block">{t('mkt.submit.price')}</label><input className="input w-full" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div><label className="label mb-1 block">{t('mkt.submit.stock')}</label><input className="input w-full" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
      </div>
      <label className="label mb-1 block">{t('mkt.submit.brand')}</label>
      <input className="input w-full mb-3" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={60} />
      <label className="label mb-1 block">{t('mkt.submit.description')}</label>
      <textarea className="input w-full mb-5" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} />
      <button type="button" className="btn-primary w-full" disabled={!name.trim() || price === '' || stock === ''} onClick={submit}>{t('mkt.submit.save')}</button>
    </Modal>
  );
}

function RejectModal({ open, onClose, t, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="h2 mb-3">🛡️ {t('mkt.mod.rejectTitle')}</h2>
      <label className="label mb-1 block">{t('mkt.mod.rejectReason')}</label>
      <textarea className="input w-full mb-4" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
      <button type="button" className="btn-primary w-full !bg-rose-500" disabled={!reason.trim()} onClick={() => { onConfirm(reason.trim()); setReason(''); onClose(); }}>{t('mkt.mod.rejectConfirm')}</button>
    </Modal>
  );
}

function RestockControl({ listing, t, onRestock }) {
  const [val, setVal] = useState(String(listing.stock));
  return (
    <div className="flex items-center gap-1">
      <input className="input !py-1 !px-2 !w-20 text-sm" type="number" min="0" step="1" value={val} onChange={(e) => setVal(e.target.value)} aria-label={t('mkt.submit.stock')} />
      <button type="button" className="btn-ghost !py-1 !px-2 text-xs" onClick={() => onRestock(listing.id, Number(val))}>{t('mkt.partner.restock')}</button>
    </div>
  );
}

export default function MarketplaceCabinet() {
  const t = useT();
  const locale = useLocale();
  const m = useMarketplace();
  const [tab, setTab] = useState('catalog');
  const [cat, setCat] = useState('all');
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

  const qtyOf = (id) => m.cart.find((l) => l.itemId === id)?.qty || 0;
  const visible = useMemo(() => {
    let arr = m.catalog;
    if (cat !== 'all') arr = arr.filter((g) => g.category === cat);
    if (query.trim()) { const q = query.trim().toLowerCase(); arr = arr.filter((g) => g.name.toLowerCase().includes(q) || g.brand.toLowerCase().includes(q)); }
    return arr;
  }, [m.catalog, cat, query]);
  const activeOrders = m.orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');

  const tabs = [
    { id: 'catalog', icon: '🛍️', label: t('mkt.tab.catalog') },
    { id: 'orders', icon: '📦', label: m.isModerator ? t('mkt.tab.orders') : t('mkt.tab.myOrders') },
    ...(m.isPartner ? [{ id: 'partner', icon: '🏷️', label: t('mkt.tab.partner') }] : []),
    ...(m.isModerator ? [{ id: 'moderation', icon: '🛡️', label: t('mkt.tab.moderation') }] : []),
  ];

  const cartPanel = (
    <div className="card p-4 lg:sticky lg:top-4">
      <div className="label mb-3">🛒 {t('mkt.cart')}</div>
      {m.cart.length === 0 ? (
        <div className="text-sm font-semibold text-ink/40 py-4 text-center">{t('mkt.cartEmpty')}</div>
      ) : (
        <div className="space-y-3">
          {m.cart.map((l) => (
            <div key={l.itemId} className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{l.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{l.name}</div>
                <div className="text-[11px] font-semibold text-ink/45">{formatPrice(l.price)} · {formatPrice(l.lineTotal)}</div>
              </div>
              <QtyStepper qty={l.qty} max={Math.min(l.stock, MAX_QUANTITY)} onDec={() => flash(l.qty === 1 ? m.remove(l.itemId) : m.setQty(l.itemId, l.qty - 1))} onInc={() => flash(m.add(l.itemId, 1))} />
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-black/10">
            <span className="font-black">{t('mkt.total')}</span><span className="font-black text-lg text-primary">{formatPrice(m.total)}</span>
          </div>
          <button type="button" className="btn-primary w-full" disabled={!m.enabled} onClick={() => { const res = m.order(); flash(res, t('mkt.orderPlaced')); if (res.ok) { sfx.coin?.(); setTab('orders'); } }}>{t('mkt.order')}</button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h1 className="h1">🛍️ {t('mkt.title')}</h1>
        <span className={`chip ml-auto ${m.enabled ? '!bg-emerald-100 text-emerald-700' : '!bg-rose-100 text-rose-600'}`}>{m.enabled ? t('mkt.open') : t('mkt.closed')}</span>
      </div>
      <p className="font-semibold text-ink/55 mb-4">{t('mkt.sub')}</p>

      {msg && <div className={`card p-3 mb-4 font-bold anim-pop ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.ok ? '✅' : '😿'} {msg.text}</div>}

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((x) => <button key={x.id} type="button" onClick={() => { sfx.click?.(); setTab(x.id); }} className={`btn !py-2 !px-4 text-sm ${tab === x.id ? 'btn-primary' : 'btn-ghost'}`}>{x.icon} {x.label}</button>)}
      </div>

      {tab === 'catalog' && (
        !m.enabled ? <div className="card p-8 text-center font-bold text-ink/45">{t('mkt.disabled')}</div> : (
          <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
            <div>
              <input className="input w-full mb-3" placeholder={t('mkt.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="flex gap-2 mb-4 flex-wrap">
                <button type="button" onClick={() => setCat('all')} className={`btn !py-1.5 !px-3 text-xs ${cat === 'all' ? 'btn-primary' : 'btn-ghost'}`}>{t('mkt.all')}</button>
                {GOODS_CATEGORIES.map((c) => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`btn !py-1.5 !px-3 text-xs ${cat === c.id ? 'btn-primary' : 'btn-ghost'}`}>{c.emoji} {t('mkt.cat.' + c.id)}</button>)}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {visible.map((g) => {
                  const qty = qtyOf(g.id);
                  const out = g.stock <= 0;
                  return (
                    <div key={g.id} className="card p-4 flex flex-col">
                      <div className="flex items-start gap-2">
                        <span className="text-3xl" aria-hidden="true">{g.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-black leading-tight">{g.name}</div>
                          <div className="text-[11px] font-bold text-ink/40">{g.brand}</div>
                        </div>
                        <span className="font-black text-primary whitespace-nowrap">{formatPrice(g.price)}</span>
                      </div>
                      {g.description && <div className="text-xs font-semibold text-ink/55 mt-1.5 leading-snug">{g.description}</div>}
                      {g.sizes && <div className="flex flex-wrap gap-1 mt-2">{g.sizes.map((s) => <span key={s} className="chip !bg-soft text-ink/55 !text-[10px] !py-0.5">{s}</span>)}</div>}
                      <div className={`text-[11px] font-bold mt-2 ${out ? 'text-rose-500' : 'text-emerald-600'}`}>{out ? t('mkt.outOfStock') : t('mkt.inStock', { n: g.stock })}</div>
                      <div className="mt-3 pt-2 border-t border-black/5">
                        {out ? <button type="button" className="btn-ghost w-full !py-2 text-sm" disabled>{t('mkt.outOfStock')}</button>
                          : qty > 0 ? (
                            <div className="flex items-center justify-between">
                              <QtyStepper qty={qty} max={Math.min(g.stock, MAX_QUANTITY)} onDec={() => flash(qty === 1 ? m.remove(g.id) : m.setQty(g.id, qty - 1))} onInc={() => flash(m.add(g.id, 1))} />
                              <span className="font-black text-sm">{formatPrice(g.price * qty)}</span>
                            </div>
                          ) : <button type="button" className="btn-primary w-full !py-2 text-sm" onClick={() => { sfx.click?.(); flash(m.add(g.id, 1)); }}>＋ {t('mkt.add')}</button>}
                      </div>
                    </div>
                  );
                })}
                {visible.length === 0 && <div className="card p-6 text-center font-bold text-ink/40 sm:col-span-2">{t('mkt.emptyCatalog')}</div>}
              </div>
            </div>
            {cartPanel}
          </div>
        )
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {m.isModerator && <div className="label mb-1">📦 {t('mkt.tab.orders')} · {activeOrders.length}</div>}
          {(m.isModerator ? activeOrders : m.orders).length === 0 && <div className="card p-8 text-center font-bold text-ink/40">{t('mkt.noOrders')}</div>}
          {(m.isModerator ? activeOrders : m.orders).slice().reverse().map((o) => (
            <OrderCard key={o.id} order={o} t={t} locale={locale} isModerator={m.isModerator}
              onCancel={(id) => flash(m.cancel(id), t('mkt.cancelled'))} onAdvance={(id) => flash(m.advance(id))} />
          ))}
          {m.isModerator && m.orders.some((o) => o.status === 'completed' || o.status === 'cancelled') && (
            <details className="card p-3"><summary className="font-bold text-sm cursor-pointer text-ink/55">{t('mkt.archive')}</summary>
              <div className="space-y-3 mt-3">{m.orders.filter((o) => o.status === 'completed' || o.status === 'cancelled').slice().reverse().map((o) => <OrderCard key={o.id} order={o} t={t} locale={locale} isModerator onCancel={() => {}} onAdvance={() => {}} />)}</div>
            </details>
          )}
        </div>
      )}

      {tab === 'partner' && m.isPartner && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="label">🏷️ {t('mkt.partner.title')}</div>
            <button type="button" className="btn-primary !py-1.5 !px-3 text-xs ml-auto" onClick={() => { setEditing(null); setSubmitOpen(true); }}>＋ {t('mkt.partner.add')}</button>
          </div>
          {m.myListings.length === 0 && <div className="card p-6 text-center font-bold text-ink/40">{t('mkt.partner.noListings')}</div>}
          <div className="space-y-2">
            {m.myListings.map((g) => (
              <div key={g.id} className="card p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl" aria-hidden="true">{g.emoji}</span>
                  <span className="font-black truncate">{g.name}</span>
                  <span className={`chip ${LISTING_STATUS_CLS[g.status]} text-xs`}>{t('mkt.listing.' + g.status)}</span>
                  <span className="font-black text-primary ml-auto">{formatPrice(g.price)}</span>
                </div>
                {g.status === 'rejected' && g.rejectReason && <div className="text-xs font-semibold text-rose-500 mt-1">{t('mkt.partner.rejectReason')}: {g.rejectReason}</div>}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <RestockControl listing={g} t={t} onRestock={(id, stock) => flash(m.restock(id, stock), t('mkt.partner.restocked'))} />
                  {g.status === 'pending' && <button type="button" className="btn-ghost !py-1 !px-3 text-xs" onClick={() => { setEditing(g); setSubmitOpen(true); }}>✏️ {t('mkt.partner.edit')}</button>}
                </div>
              </div>
            ))}
          </div>
          <SubmitListingModal open={submitOpen} onClose={() => { setSubmitOpen(false); setEditing(null); }} t={t} initial={editing}
            onSubmit={(raw, isEdit) => { const res = isEdit ? m.editListing(raw.id, raw) : m.submitListing(raw); flash(res, t('mkt.submit.added')); return res; }} />
        </div>
      )}

      {tab === 'moderation' && m.isModerator && (
        <div className="space-y-6">
          <div className="card p-4"><Toggle checked={m.enabled} onChange={(v) => m.setEnabled(v)} label={t('mkt.mod.enable')} /></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat icon="⏳" label={t('mkt.mod.stats.pending')} value={m.pending.length} />
            <Stat icon="✅" label={t('mkt.mod.stats.approved')} value={m.catalog.length} />
            <Stat icon="📦" label={t('mkt.mod.stats.orders')} value={m.orders.length} />
          </div>
          <div>
            <div className="label mb-2">⏳ {t('mkt.mod.pending')}</div>
            <div className="space-y-2">
              {m.pending.length === 0 && <div className="card p-6 text-center font-bold text-ink/40">{t('mkt.mod.noPending')}</div>}
              {m.pending.map((g) => (
                <div key={g.id} className="card p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl" aria-hidden="true">{g.emoji}</span>
                    <span className="font-black">{g.name}</span>
                    <span className="text-[11px] font-bold text-ink/40">{g.brand} · {t('mkt.cat.' + g.category)}</span>
                    <span className="font-black text-primary ml-auto">{formatPrice(g.price)}</span>
                  </div>
                  {g.description && <div className="text-xs font-semibold text-ink/55 mt-1">{g.description}</div>}
                  <div className="text-[11px] font-bold text-ink/40 mt-1">{t('mkt.submit.stock')}: {g.stock} · {g.partnerId}</div>
                  <div className="flex gap-2 mt-3">
                    <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => flash(m.approve(g.id), t('mkt.mod.approved'))}>✓ {t('mkt.mod.approve')}</button>
                    <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs text-rose-500" onClick={() => setRejectId(g.id)}>✕ {t('mkt.mod.reject')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <RejectModal open={!!rejectId} onClose={() => setRejectId(null)} t={t} onConfirm={(reason) => flash(m.reject(rejectId, reason), t('mkt.mod.rejected'))} />
        </div>
      )}
    </div>
  );
}