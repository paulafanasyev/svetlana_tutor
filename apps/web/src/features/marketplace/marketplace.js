// Partner school-goods marketplace domain logic («Маркетплейс школьных товаров»).
//
// PURE, framework-independent ES module: no React, no network, no localStorage.
// Mirrors the accepted buffet/bookstore pattern: createMarketplace() produces a
// plain state object; every function takes it as the first argument; a persistence
// layer can JSON.stringify serializeMarketplace(state) and rehydrate with
// createMarketplace({ ...data, clock, nextId }). Clock and id generator are
// injectable so behaviour is fully deterministic in tests.
//
// Roles: 'buyer' | 'partner' | 'moderator'. Partners submit listings (pending);
// a moderator approves/rejects them; buyers browse approved listings, fill a
// stock-limited cart and place orders. Money is integer rubles everywhere.
// Physical goods add stock management and a fulfillment status flow
// (new → confirmed → shipped → completed); cancelling before shipping restocks.
//
// Rejections throw MarketplaceError with a stable `.code` and a Russian `.message`
// (see MARKETPLACE_ERROR_MESSAGES) so the UI can show a reason or map codes to i18n.

import { SAMPLE_GOODS, GOODS_CATEGORIES } from './catalog.js';

export const ROLES = Object.freeze(['buyer', 'partner', 'moderator']);
export const LISTING_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);
export const ORDER_STATUSES = Object.freeze(['new', 'confirmed', 'shipped', 'completed', 'cancelled']);
const ORDER_FLOW = Object.freeze(['new', 'confirmed', 'shipped', 'completed']);
export const MAX_QUANTITY = 99;
export const MAX_PRICE = 1000000;     // rubles — goods can cost more than buffet meals
export const MAX_STOCK = 1000000;
const MAX_AUDIT_ENTRIES = 500;
const CATEGORY_IDS = GOODS_CATEGORIES.map((c) => c.id);

export const MARKETPLACE_ERROR_MESSAGES = Object.freeze({
  DISABLED: 'Маркетплейс этой школы отключён.',
  INVALID_LISTING: 'Некорректный товар (нужны id, название, категория, целая цена и остаток).',
  INVALID_USER: 'Не указан идентификатор пользователя.',
  INVALID_ROLE: 'Неизвестная роль пользователя.',
  INVALID_SCHOOL: 'Не указан идентификатор школы.',
  FORBIDDEN: 'Недостаточно прав для этого действия.',
  NOT_FOUND: 'Товар не найден.',
  NOT_APPROVED: 'Товар ещё не прошёл модерацию и недоступен для заказа.',
  OUT_OF_STOCK: 'Недостаточно товара в наличии.',
  INVALID_QUANTITY: `Количество должно быть целым числом от 1 до ${MAX_QUANTITY}.`,
  INVALID_STOCK: `Остаток должен быть целым числом от 0 до ${MAX_STOCK}.`,
  EMPTY_CART: 'Корзина пуста — добавьте хотя бы один товар.',
  ORDER_NOT_FOUND: 'Заказ не найден.',
  ORDER_NOT_CANCELABLE: 'Заказ нельзя отменить: он уже отправлен, выдан или отменён.',
  INVALID_TRANSITION: 'Недопустимый переход статуса заказа.',
  REASON_REQUIRED: 'Укажите причину отклонения товара.',
  INVALID_STATUS: 'Недопустимый статус товара.',
});

export class MarketplaceError extends Error {
  constructor(code, details) {
    super(MARKETPLACE_ERROR_MESSAGES[code] || code);
    this.name = 'MarketplaceError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const fail = (code, details) => { throw new MarketplaceError(code, details); };

// ── internal helpers ────────────────────────────────────────────────────────

function cloneListing(l) {
  const copy = { ...l };
  if (Array.isArray(l.sizes)) copy.sizes = [...l.sizes];
  return copy;
}

function cloneOrder(order) {
  return { ...order, items: order.items.map((line) => ({ ...line })), history: order.history.map((e) => ({ ...e })) };
}

function validateRole(role) {
  if (!ROLES.includes(role)) fail('INVALID_ROLE', { role });
  return role;
}

function validateUserId(userId) {
  if (typeof userId !== 'string' || !userId.trim()) fail('INVALID_USER', { userId });
  return userId.trim();
}

function validateQuantity(qty) {
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) fail('INVALID_QUANTITY', { qty });
  return qty;
}

function validateStock(stock) {
  if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) fail('INVALID_STOCK', { stock });
  return stock;
}

function assertEnabled(state) {
  if (!state.enabled) fail('DISABLED', { schoolId: state.schoolId });
}

function findListing(state, id) {
  const l = typeof id === 'string' ? state.listings.find((x) => x.id === id) : undefined;
  if (!l) fail('NOT_FOUND', { id });
  return l;
}

function findOrder(state, orderId) {
  const o = typeof orderId === 'string' ? state.orders.find((x) => x.id === orderId) : undefined;
  if (!o) fail('ORDER_NOT_FOUND', { orderId });
  return o;
}

// Accepts an actor { role, userId } or the bare string 'moderator'. A bare
// non-moderator string is rejected: ownership cannot be verified without a userId.
function resolveActor(input) {
  if (typeof input === 'string') {
    if (input === 'moderator') return { role: 'moderator', userId: null };
    fail('FORBIDDEN', { reason: 'identity-required' });
  }
  if (!input || typeof input !== 'object') fail('FORBIDDEN');
  const role = validateRole(input.role);
  const userId = role === 'moderator'
    ? (typeof input.userId === 'string' && input.userId.trim() ? input.userId.trim() : null)
    : validateUserId(input.userId);
  return { role, userId };
}

function requireRole(input, needed) {
  const actor = resolveActor(input);
  if (actor.role !== needed) fail('FORBIDDEN', { role: actor.role, needed });
  return actor;
}

function recordAudit(state, action, actor, details) {
  state.audit.push({
    at: state.clock(), action,
    actorRole: actor && actor.role ? actor.role : null,
    actorId: actor && actor.userId ? actor.userId : null,
    details: { ...details },
  });
  if (state.audit.length > MAX_AUDIT_ENTRIES) state.audit.splice(0, state.audit.length - MAX_AUDIT_ENTRIES);
}

function normalizeListing(raw) {
  if (!raw || typeof raw !== 'object') fail('INVALID_LISTING');
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fail('INVALID_LISTING', { field: 'id' });
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fail('INVALID_LISTING', { field: 'name' });
  if (!CATEGORY_IDS.includes(raw.category)) fail('INVALID_LISTING', { field: 'category' });
  if (!Number.isInteger(raw.price) || raw.price < 0 || raw.price > MAX_PRICE) fail('INVALID_LISTING', { field: 'price' });
  const stock = validateStock(raw.stock === undefined ? 0 : raw.stock);
  const partnerId = typeof raw.partnerId === 'string' && raw.partnerId.trim() ? raw.partnerId.trim() : fail('INVALID_LISTING', { field: 'partnerId' });
  const status = raw.status === undefined ? 'pending' : raw.status;
  if (!LISTING_STATUSES.includes(status)) fail('INVALID_STATUS', { status });
  const listing = {
    id, name, category: raw.category, price: raw.price, stock, partnerId, status,
    brand: typeof raw.brand === 'string' ? raw.brand.trim() : '',
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    emoji: typeof raw.emoji === 'string' ? raw.emoji : '📦',
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : 0,
  };
  if (raw.sizes !== undefined) {
    if (!Array.isArray(raw.sizes) || raw.sizes.some((s) => typeof s !== 'string' || !s.trim())) fail('INVALID_LISTING', { field: 'sizes' });
    listing.sizes = [...new Set(raw.sizes.map((s) => s.trim()))];
  }
  if (status === 'rejected') {
    if (typeof raw.rejectReason !== 'string' || !raw.rejectReason.trim()) fail('REASON_REQUIRED', { id });
    listing.rejectReason = raw.rejectReason.trim();
  }
  return listing;
}

// ── store factory ───────────────────────────────────────────────────────────

export function createMarketplace({
  enabled = true,
  schoolId,
  listings = SAMPLE_GOODS,
  cart = {},
  orders = [],
  audit = [],
  clock = () => Date.now(),
  nextId,
} = {}) {
  if (typeof schoolId !== 'string' || !schoolId.trim()) fail('INVALID_SCHOOL', { schoolId });
  if (typeof clock !== 'function') fail('INVALID_SCHOOL', { reason: 'clock must be a function' });
  if (!Array.isArray(listings)) fail('INVALID_LISTING', { reason: 'listings must be an array' });
  const items = listings.map(normalizeListing);
  if (new Set(items.map((i) => i.id)).size !== items.length) fail('INVALID_LISTING', { reason: 'duplicate ids' });

  let counter = 0;
  const idGen = typeof nextId === 'function' ? nextId : () => `mp-${++counter}`;

  const cleanCart = {};
  if (cart && typeof cart === 'object') {
    for (const [id, qty] of Object.entries(cart)) {
      const l = items.find((x) => x.id === id);
      if (l && l.status === 'approved' && Number.isInteger(qty) && qty >= 1 && qty <= MAX_QUANTITY && qty <= l.stock) cleanCart[id] = qty;
    }
  }

  return {
    schoolId: schoolId.trim(),
    enabled: Boolean(enabled),
    listings: items,
    cart: cleanCart,
    orders: (Array.isArray(orders) ? orders : []).map(cloneOrder),
    audit: (Array.isArray(audit) ? audit : []).map((e) => ({ ...e, details: { ...(e.details || {}) } })),
    clock,
    nextId: idGen,
  };
}

export function serializeMarketplace(state) {
  return {
    schoolId: state.schoolId,
    enabled: state.enabled,
    listings: state.listings.map(cloneListing),
    cart: { ...state.cart },
    orders: state.orders.map(cloneOrder),
    audit: state.audit.map((e) => ({ ...e, details: { ...e.details } })),
  };
}

// ── catalog reads ───────────────────────────────────────────────────────────

/** Buyer view: only approved listings (clones), optionally filtered by category/query. Out-of-stock items stay visible. */
export function getCatalog(state, { category, query } = {}) {
  let items = state.listings.filter((l) => l.status === 'approved');
  if (category && category !== 'all') items = items.filter((l) => l.category === category);
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    items = items.filter((l) => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.brand.toLowerCase().includes(q));
  }
  return items.map(cloneListing);
}

/** A single approved listing (clone) for the product card. */
export function getListing(state, id) {
  const l = findListing(state, id);
  if (l.status !== 'approved') fail('NOT_APPROVED', { id });
  return cloneListing(l);
}

export function getCart(state) {
  const lines = [];
  for (const [id, qty] of Object.entries(state.cart)) {
    const l = state.listings.find((x) => x.id === id);
    if (!l) continue;
    lines.push({ itemId: l.id, name: l.name, price: l.price, emoji: l.emoji, category: l.category, stock: l.stock, qty, lineTotal: l.price * qty });
  }
  return lines;
}

export function cartTotal(state) {
  let total = 0;
  for (const [id, qty] of Object.entries(state.cart)) {
    const l = state.listings.find((x) => x.id === id);
    if (l) total += l.price * qty;
  }
  return total;
}

export function formatPrice(rubles) {
  return `${rubles} ₽`;
}

// ── cart mutations (stock-limited) ──────────────────────────────────────────

export function addToCart(state, id, qty = 1) {
  assertEnabled(state);
  const l = findListing(state, id);
  if (l.status !== 'approved') fail('NOT_APPROVED', { id });
  validateQuantity(qty);
  const next = (state.cart[id] || 0) + qty;
  validateQuantity(next);
  if (next > l.stock) fail('OUT_OF_STOCK', { id, stock: l.stock, requested: next });
  state.cart[id] = next;
  return getCart(state);
}

export function setQuantity(state, id, qty) {
  assertEnabled(state);
  const l = findListing(state, id);
  if (l.status !== 'approved') fail('NOT_APPROVED', { id });
  validateQuantity(qty);
  if (qty > l.stock) fail('OUT_OF_STOCK', { id, stock: l.stock, requested: qty });
  state.cart[id] = qty;
  return getCart(state);
}

export function removeFromCart(state, id) {
  assertEnabled(state);
  if (typeof id === 'string') delete state.cart[id];
  return getCart(state);
}

// ── orders ──────────────────────────────────────────────────────────────────

export function placeOrder(state, { userId, role } = {}) {
  assertEnabled(state);
  validateRole(role);
  const uid = validateUserId(userId);
  const entries = Object.entries(state.cart);
  if (!entries.length) fail('EMPTY_CART');

  // Validate everything first so a rejection never partially decrements stock.
  const items = [];
  let total = 0;
  for (const [id, qty] of entries) {
    const l = findListing(state, id);
    if (l.status !== 'approved') fail('NOT_APPROVED', { id });
    validateQuantity(qty);
    if (qty > l.stock) fail('OUT_OF_STOCK', { id, stock: l.stock, requested: qty });
    items.push({ itemId: l.id, name: l.name, price: l.price, emoji: l.emoji, category: l.category, partnerId: l.partnerId, qty });
    total += l.price * qty;
  }
  for (const [id, qty] of entries) findListing(state, id).stock -= qty;

  const at = state.clock();
  const order = {
    id: state.nextId(), schoolId: state.schoolId, userId: uid, role,
    items, total, status: 'new', createdAt: at, updatedAt: at,
    history: [{ status: 'new', at, by: uid }],
  };
  state.orders.push(order);
  state.cart = {};
  recordAudit(state, 'order_placed', { role, userId: uid }, { orderId: order.id, total });
  return cloneOrder(order);
}

/** Moderator-only fulfillment: new → confirmed → shipped → completed. */
export function advanceOrder(state, orderId, actor) {
  const mod = requireRole(actor, 'moderator');
  const order = findOrder(state, orderId);
  const index = ORDER_FLOW.indexOf(order.status);
  if (index === -1 || index === ORDER_FLOW.length - 1) fail('INVALID_TRANSITION', { orderId, from: order.status });
  const nextStatus = ORDER_FLOW[index + 1];
  const at = state.clock();
  order.status = nextStatus;
  order.updatedAt = at;
  order.history.push({ status: nextStatus, at, by: mod.userId });
  recordAudit(state, 'order_advanced', mod, { orderId, from: ORDER_FLOW[index], to: nextStatus });
  return cloneOrder(order);
}

/** Cancel before shipping (new/confirmed), by owner or moderator; restocks items. */
export function cancelOrder(state, orderId, byRole) {
  const actor = resolveActor(byRole);
  const order = findOrder(state, orderId);
  if (order.status !== 'new' && order.status !== 'confirmed') fail('ORDER_NOT_CANCELABLE', { orderId, status: order.status });
  if (actor.role !== 'moderator' && order.userId !== actor.userId) fail('FORBIDDEN', { orderId, userId: actor.userId });
  for (const line of order.items) {
    const l = state.listings.find((x) => x.id === line.itemId);
    if (l) l.stock = Math.min(MAX_STOCK, l.stock + line.qty);
  }
  const at = state.clock();
  order.status = 'cancelled';
  order.updatedAt = at;
  order.history.push({ status: 'cancelled', at, by: actor.userId });
  recordAudit(state, 'order_cancelled', actor, { orderId });
  return cloneOrder(order);
}

/** Moderator sees every order; a buyer/partner sees ONLY their own. */
export function listOrders(state, { role, userId } = {}) {
  validateRole(role);
  if (role === 'moderator') return state.orders.map(cloneOrder);
  const uid = validateUserId(userId);
  return state.orders.filter((o) => o.userId === uid).map(cloneOrder);
}

// ── partner listings ────────────────────────────────────────────────────────

export function createListing(state, raw, actor) {
  const partner = requireRole(actor, 'partner');
  const listing = normalizeListing({ ...raw, partnerId: partner.userId, status: 'pending', createdAt: state.clock() });
  if (state.listings.some((l) => l.id === listing.id)) fail('INVALID_LISTING', { reason: 'duplicate id', id: listing.id });
  state.listings.push(listing);
  recordAudit(state, 'listing_submitted', partner, { listingId: listing.id });
  return cloneListing(listing);
}

/** Partner edits ONLY their own pending listing (before moderation). */
export function updateListing(state, id, patch, actor) {
  const partner = requireRole(actor, 'partner');
  const l = findListing(state, id);
  if (l.partnerId !== partner.userId) fail('FORBIDDEN', { id });
  if (l.status !== 'pending') fail('FORBIDDEN', { id, status: l.status });
  const updated = normalizeListing({ ...l, ...patch, id: l.id, partnerId: l.partnerId, status: 'pending', createdAt: l.createdAt });
  Object.assign(l, updated);
  recordAudit(state, 'listing_updated', partner, { listingId: id });
  return cloneListing(l);
}

/** Partner restocks their own listing (any non-rejected status). */
export function restockListing(state, id, stock, actor) {
  const partner = requireRole(actor, 'partner');
  const l = findListing(state, id);
  if (l.partnerId !== partner.userId) fail('FORBIDDEN', { id });
  l.stock = validateStock(stock);
  recordAudit(state, 'listing_restocked', partner, { listingId: id, stock });
  return cloneListing(l);
}

export function listMyListings(state, actor) {
  const partner = requireRole(actor, 'partner');
  return state.listings.filter((l) => l.partnerId === partner.userId).map(cloneListing);
}

// ── moderation ──────────────────────────────────────────────────────────────

export function approveListing(state, id, actor) {
  const mod = requireRole(actor, 'moderator');
  const l = findListing(state, id);
  if (l.status !== 'pending') fail('INVALID_STATUS', { id, status: l.status });
  l.status = 'approved';
  delete l.rejectReason;
  recordAudit(state, 'listing_approved', mod, { listingId: id });
  return cloneListing(l);
}

export function rejectListing(state, id, reason, actor) {
  const mod = requireRole(actor, 'moderator');
  if (typeof reason !== 'string' || !reason.trim()) fail('REASON_REQUIRED', { id });
  const l = findListing(state, id);
  if (l.status !== 'pending') fail('INVALID_STATUS', { id, status: l.status });
  l.status = 'rejected';
  l.rejectReason = reason.trim();
  recordAudit(state, 'listing_rejected', mod, { listingId: id, reason: l.rejectReason });
  return cloneListing(l);
}

export function listPending(state, actor) {
  requireRole(actor, 'moderator');
  return state.listings.filter((l) => l.status === 'pending').map(cloneListing);
}

export function listAllListings(state, actor) {
  requireRole(actor, 'moderator');
  return state.listings.map(cloneListing);
}