import { useMemo, useState } from 'react';
import { useT, useLocale } from '../../core/store.js';
import { Modal, Toggle, Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';
import { useBuffet } from './useBuffet.js';
import { MENU_CATEGORIES, KNOWN_ALLERGENS } from './menu.js';
import { formatPrice, MAX_QUANTITY } from './buffet.js';

const STATUS_CLS = {
  new: '!bg-sky-100 text-sky-700',
  preparing: '!bg-amber-100 text-amber-700',
  ready: '!bg-emerald-100 text-emerald-700',
  completed: '!bg-ink/10 text-ink/55',
  cancelled: '!bg-rose-100 text-rose-600',
};
const NEXT_STATUS = { new: 'preparing', preparing: 'ready', ready: 'completed' };
const CAT_ICON = { bakery: '🥐', hot: '🍲', salads: '🥗', drinks: '🥤' };

function timeOf(at, locale) {
  try {
    return new Date(at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-GB',
      { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function QtyStepper({ qty, onDec, onInc, max = MAX_QUANTITY }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="−" onClick={onDec}
        className="w-8 h-8 rounded-lg bg-soft font-black text-lg grid place-items-center hover:bg-ink/10">−</button>
      <span className="w-7 text-center font-black tabular-nums">{qty}</span>
      <button type="button" aria-label="+" onClick={onInc} disabled={qty >= max}
        className="w-8 h-8 rounded-lg bg-primary text-white font-black text-lg grid place-items-center disabled:opacity-40">+</button>
    </div>
  );
}

function Allergens({ list, t }) {
  if (!list || !list.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {list.map((a) => <span key={a} className="chip !bg-rose-50 text-rose-600 !text-[10px] !py-0.5">{a}</span>)}
    </div>
  );
}

function OrderCard({ order, t, locale, isKitchen, onCancel, onAdvance }) {
  const cancelable = order.status === 'new' || order.status === 'preparing';
  const next = NEXT_STATUS[order.status];
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`chip ${STATUS_CLS[order.status]} font-black`}>{t('buf.status.' + order.status)}</span>
        <span className="font-black">{formatPrice(order.total)}</span>
        <span className="text-[11px] font-bold text-ink/40 ml-auto">{timeOf(order.createdAt, locale)}</span>
      </div>
      <div className="mt-2 space-y-0.5">
        {order.items.map((l) => (
          <div key={l.itemId} className="flex items-center gap-2 text-sm font-semibold text-ink/70">
            <span className="text-ink/40 tabular-nums">{l.qty}×</span>
            <span className="truncate">{l.name}</span>
            <span className="ml-auto text-ink/45 tabular-nums">{formatPrice(l.price * l.qty)}</span>
          </div>
        ))}
      </div>
      {isKitchen && <div className="text-[11px] font-bold text-ink/40 mt-1">{t('buf.by')}: {order.userId}</div>}
      <div className="flex gap-2 mt-3">
        {isKitchen && next && (
          <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => onAdvance(order.id)}>
            {t('buf.advance.' + next)} →
          </button>
        )}
        {cancelable && (
          <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs text-rose-500" onClick={() => onCancel(order.id)}>
            {t('buf.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}

function AddItemModal({ open, onClose, t, onSubmit }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(MENU_CATEGORIES[0].id);
  const [allergens, setAllergens] = useState([]);
  const reset = () => { setName(''); setPrice(''); setCategory(MENU_CATEGORIES[0].id); setAllergens([]); };
  const submit = () => {
    const p = Number(price);
    const id = 'item-' + Date.now().toString(36);
    const res = onSubmit({ id, name: name.trim(), price: p, category, allergens });
    if (res.ok) { reset(); onClose(); }
    return res;
  };
  const toggleAllergen = (a) => setAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="h2 mb-4">🍽️ {t('buf.addItem')}</h2>
      <label className="label mb-1 block">{t('buf.itemName')}</label>
      <input className="input w-full mb-3" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      <label className="label mb-1 block">{t('buf.itemPrice')}</label>
      <input className="input w-full mb-3" type="number" min="0" max="100000" step="1" value={price} onChange={(e) => setPrice(e.target.value)} />
      <label className="label mb-1 block">{t('buf.itemCategory')}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {MENU_CATEGORIES.map((c) => (
          <button key={c.id} type="button" onClick={() => setCategory(c.id)}
            className={`btn !py-2 !px-3 text-sm ${category === c.id ? 'btn-primary' : 'btn-ghost'}`}>{CAT_ICON[c.id]} {t('buf.cat.' + c.id)}</button>
        ))}
      </div>
      <label className="label mb-1 block">{t('buf.itemAllergens')}</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {KNOWN_ALLERGENS.map((a) => (
          <button key={a} type="button" onClick={() => toggleAllergen(a)}
            className={`chip !py-1 ${allergens.includes(a) ? '!bg-rose-500 text-white' : '!bg-soft text-ink/60'}`}>{a}</button>
        ))}
      </div>
      <button type="button" className="btn-primary w-full" disabled={!name.trim() || price === ''} onClick={submit}>{t('buf.save')}</button>
    </Modal>
  );
}

export default function BuffetCabinet() {
  const t = useT();
  const locale = useLocale();
  const b = useBuffet();
  const [tab, setTab] = useState('menu');
  const [cat, setCat] = useState('all');
  const [msg, setMsg] = useState(null);
  const [adding, setAdding] = useState(false);

  const flash = (res, okText) => {
    if (res.ok) { if (okText) { setMsg({ ok: true, text: okText }); setTimeout(() => setMsg(null), 2500); } return; }
    sfx.wrong?.();
    setMsg({ ok: false, text: res.error?.message || String(res.error) });
    setTimeout(() => setMsg(null), 3500);
  };

  const qtyOf = (id) => b.cart.find((l) => l.itemId === id)?.qty || 0;
  const visibleMenu = useMemo(() => cat === 'all' ? b.menu : b.menu.filter((i) => i.category === cat), [b.menu, cat]);
  const activeOrders = b.orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');

  const tabs = [
    { id: 'menu', icon: '🍽️', label: t('buf.tab.menu') },
    { id: 'orders', icon: '🧾', label: t('buf.tab.orders') },
    ...(b.isKitchen ? [{ id: 'kitchen', icon: '👨‍🍳', label: t('buf.tab.kitchen') }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h1 className="h1">🍽️ {t('buf.title')}</h1>
        <span className={`chip ml-auto ${b.enabled ? '!bg-emerald-100 text-emerald-700' : '!bg-rose-100 text-rose-600'}`}>
          {b.enabled ? t('buf.open') : t('buf.closed')}
        </span>
      </div>
      <p className="font-semibold text-ink/55 mb-4">{t('buf.sub')}</p>

      {msg && (
        <div className={`card p-3 mb-4 font-bold anim-pop ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>
          {msg.ok ? '✅' : '😿'} {msg.text}
        </div>
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((x) => (
          <button key={x.id} type="button" onClick={() => { sfx.click?.(); setTab(x.id); }}
            className={`btn !py-2 !px-4 text-sm ${tab === x.id ? 'btn-primary' : 'btn-ghost'}`}>{x.icon} {x.label}</button>
        ))}
      </div>

      {tab === 'menu' && (
        !b.enabled && !b.isKitchen ? (
          <div className="card p-8 text-center font-bold text-ink/45">{t('buf.disabled')}</div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <button type="button" onClick={() => setCat('all')} className={`btn !py-1.5 !px-3 text-xs ${cat === 'all' ? 'btn-primary' : 'btn-ghost'}`}>{t('buf.all')}</button>
                {MENU_CATEGORIES.map((c) => (
                  <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`btn !py-1.5 !px-3 text-xs ${cat === c.id ? 'btn-primary' : 'btn-ghost'}`}>{CAT_ICON[c.id]} {t('buf.cat.' + c.id)}</button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {visibleMenu.map((item) => {
                  const qty = qtyOf(item.id);
                  return (
                    <div key={item.id} className="card p-4 flex flex-col">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl" aria-hidden="true">{CAT_ICON[item.category]}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-black leading-tight">{item.name}</div>
                          <div className="text-[11px] font-bold text-ink/40">{item.nutrition ? `${item.nutrition.calories} ${t('buf.kcal')}` : ''}</div>
                        </div>
                        <span className="font-black text-primary whitespace-nowrap">{formatPrice(item.price)}</span>
                      </div>
                      <Allergens list={item.allergens} t={t} />
                      <div className="mt-3 pt-2 border-t border-black/5">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between">
                            <QtyStepper qty={qty} onDec={() => flash(qty === 1 ? b.remove(item.id) : b.setQty(item.id, qty - 1))} onInc={() => flash(b.add(item.id, 1))} />
                            <span className="font-black text-sm">{formatPrice(item.price * qty)}</span>
                          </div>
                        ) : (
                          <button type="button" className="btn-primary w-full !py-2 text-sm" disabled={!b.enabled} onClick={() => { sfx.click?.(); flash(b.add(item.id, 1)); }}>＋ {t('buf.add')}</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {visibleMenu.length === 0 && <div className="card p-6 text-center font-bold text-ink/40 sm:col-span-2">{t('buf.emptyMenu')}</div>}
              </div>
            </div>

            <div className="card p-4 lg:sticky lg:top-4">
              <div className="label mb-3">🛒 {t('buf.cart')}</div>
              {b.cart.length === 0 ? (
                <div className="text-sm font-semibold text-ink/40 py-4 text-center">{t('buf.cartEmpty')}</div>
              ) : (
                <div className="space-y-3">
                  {b.cart.map((l) => (
                    <div key={l.itemId} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate">{l.name}</div>
                        <div className="text-[11px] font-semibold text-ink/45">{formatPrice(l.price)} · {formatPrice(l.lineTotal)}</div>
                      </div>
                      <QtyStepper qty={l.qty} onDec={() => flash(l.qty === 1 ? b.remove(l.itemId) : b.setQty(l.itemId, l.qty - 1))} onInc={() => flash(b.add(l.itemId, 1))} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t border-black/10">
                    <span className="font-black">{t('buf.total')}</span>
                    <span className="font-black text-lg text-primary">{formatPrice(b.total)}</span>
                  </div>
                  <button type="button" className="btn-primary w-full" disabled={!b.enabled}
                    onClick={() => { const res = b.order(); flash(res, t('buf.orderPlaced')); if (res.ok) { sfx.coin?.(); setTab('orders'); } }}>
                    {t('buf.order')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {b.orders.length === 0 && <div className="card p-8 text-center font-bold text-ink/40">{t('buf.noOrders')}</div>}
          {b.orders.slice().reverse().map((o) => (
            <OrderCard key={o.id} order={o} t={t} locale={locale} isKitchen={false}
              onCancel={(id) => flash(b.cancel(id), t('buf.cancelled'))} onAdvance={() => {}} />
          ))}
        </div>
      )}

      {tab === 'kitchen' && b.isKitchen && (
        <div className="space-y-6">
          <div className="card p-4">
            <Toggle checked={b.enabled} onChange={(v) => b.setEnabled(v)} label={t('buf.kitchen.enable')} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon="🆕" label={t('buf.status.new')} value={b.orders.filter((o) => o.status === 'new').length} />
            <Stat icon="👨‍🍳" label={t('buf.status.preparing')} value={b.orders.filter((o) => o.status === 'preparing').length} />
            <Stat icon="✅" label={t('buf.status.ready')} value={b.orders.filter((o) => o.status === 'ready').length} />
            <Stat icon="📦" label={t('buf.status.completed')} value={b.orders.filter((o) => o.status === 'completed').length} />
          </div>

          <div>
            <div className="label mb-2">🧾 {t('buf.kitchen.orders')}</div>
            <div className="space-y-3">
              {activeOrders.length === 0 && <div className="card p-6 text-center font-bold text-ink/40">{t('buf.kitchen.noActive')}</div>}
              {activeOrders.slice().reverse().map((o) => (
                <OrderCard key={o.id} order={o} t={t} locale={locale} isKitchen
                  onCancel={(id) => flash(b.cancel(id), t('buf.cancelled'))}
                  onAdvance={(id) => flash(b.advance(id))} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="label">📋 {t('buf.kitchen.menu')}</div>
              <button type="button" className="btn-primary !py-1.5 !px-3 text-xs ml-auto" onClick={() => setAdding(true)}>＋ {t('buf.addItem')}</button>
            </div>
            <div className="space-y-2">
              {b.fullMenu.map((item) => (
                <div key={item.id} className="card p-3 flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">{CAT_ICON[item.category]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-sm truncate">{item.name}</div>
                    <div className="text-[11px] font-semibold text-ink/45">{formatPrice(item.price)} · {t('buf.cat.' + item.category)}{item.allergens.length ? ' · ' + item.allergens.join(', ') : ''}</div>
                  </div>
                  <button type="button" onClick={() => flash(b.setAvailable(item.id, !item.available))}
                    className={`chip !py-1 text-xs ${item.available ? '!bg-emerald-100 text-emerald-700' : '!bg-rose-100 text-rose-600'}`}>
                    {item.available ? t('buf.available') : t('buf.stopList')}
                  </button>
                  <button type="button" aria-label={t('buf.remove')} onClick={() => flash(b.removeItem(item.id))}
                    className="text-rose-400 hover:text-rose-600 text-lg min-w-[36px]">🗑</button>
                </div>
              ))}
            </div>
          </div>

          <AddItemModal open={adding} onClose={() => setAdding(false)} t={t}
            onSubmit={(item) => { const res = b.upsert(item); flash(res, t('buf.added')); return res; }} />
        </div>
      )}
    </div>
  );
}