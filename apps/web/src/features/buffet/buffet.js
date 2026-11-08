// School buffet/canteen domain logic («Школьный буфет»).
//
// PURE, framework-independent ES module: no React, no network, no localStorage.
// The store is a plain state object produced by createBuffet(); every function
// takes that state as its first argument. A persistence layer (localStorage,
// HTTP backend, …) can JSON.stringify serializeBuffet(state) and later rehydrate
// it with createBuffet({ ...data, clock, nextId }) — the clock and id generator
// are injectable so behaviour is fully deterministic in tests.
//
// Roles: 'pupil' | 'staff' | 'kitchen'. Kitchen (= kitchen/admin staff) manages
// the menu and all orders; pupils/staff order food and see ONLY their own orders.
// Money: integer rubles everywhere — no floating point arithmetic.
//
// Rejections throw BuffetError with a stable `.code` and a Russian `.message`
// (see BUFFET_ERROR_MESSAGES) so the UI can show a clear reason or map codes to
// i18n keys.

import { SAMPLE_MENU } from './menu.js';

export const ROLES = Object.freeze(['pupil', 'staff', 'kitchen']);
export const ORDER_STATUSES = Object.freeze(['new', 'preparing', 'ready', 'completed', 'cancelled']);
export const MAX_QUANTITY = 99;        // per cart line — sane anti-abuse cap
export const MAX_PRICE = 100000;       // rubles, validation ceiling for menu items
const MAX_AUDIT_ENTRIES = 500;         // bounded, audit-friendly ring of events
const STATUS_FLOW = Object.freeze(['new', 'preparing', 'ready', 'completed']);

export const BUFFET_ERROR_MESSAGES = Object.freeze({
  BUFFET_DISABLED: 'Буфет этой школы отключён — заказы не принимаются.',
  EMPTY_CART: 'Корзина пуста — добавьте хотя бы одну позицию.',
  ITEM_NOT_FOUND: 'Позиция меню не найдена.',
  ITEM_UNAVAILABLE: 'Позиция сейчас недоступна для заказа (стоп-лист).',
  INVALID_QUANTITY: `Количество должно быть целым числом от 1 до ${MAX_QUANTITY}.`,
  INVALID_USER: 'Не указан идентификатор пользователя.',
  INVALID_ROLE: 'Неизвестная роль пользователя.',
  INVALID_SCHOOL: 'Не указан идентификатор школы.',
  INVALID_ITEM: 'Некорректная позиция меню (нужны id, название, целая цена в рублях и категория).',
  INVALID_AVAILABILITY: 'Признак доступности должен быть true или false.',
  FORBIDDEN: 'Недостаточно прав для этого действия.',
  ORDER_NOT_FOUND: 'Заказ не найден.',
  ORDER_NOT_CANCELABLE: 'Заказ нельзя отменить: он уже готов, выдан или отменён.',
  INVALID_TRANSITION: 'Недопустимый переход статуса заказа.',
});

export class BuffetError extends Error {
  constructor(code, details) {
    super(BUFFET_ERROR_MESSAGES[code] || code);
    this.name = 'BuffetError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const fail = (code, details) => { throw new BuffetError(code, details); };

// ── internal helpers ────────────────────────────────────────────────────────

function cloneItem(item) {
  const copy = { ...item, allergens: [...item.allergens] };
  if (item.nutrition) copy.nutrition = { ...item.nutrition };
  return copy;
}

function cloneOrder(order) {
  return {
    ...order,
    items: order.items.map((line) => ({ ...line, allergens: [...line.allergens] })),
    history: order.history.map((entry) => ({ ...entry })),
  };
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

function assertEnabled(state) {
  if (!state.enabled) fail('BUFFET_DISABLED', { schoolId: state.schoolId });
}

function findMenuItem(state, itemId) {
  const item = typeof itemId === 'string' ? state.menu.find((i) => i.id === itemId) : undefined;
  if (!item) fail('ITEM_NOT_FOUND', { itemId });
  return item;
}

function findOrder(state, orderId) {
  const order = typeof orderId === 'string' ? state.orders.find((o) => o.id === orderId) : undefined;
  if (!order) fail('ORDER_NOT_FOUND', { orderId });
  return order;
}

// Accepts an actor object { role, userId } or the bare string 'kitchen'.
// A bare non-kitchen string is rejected: ownership cannot be verified without
// a userId, so we never guess identity.
function resolveActor(input) {
  if (typeof input === 'string') {
    if (input === 'kitchen') return { role: 'kitchen', userId: null };
    fail('FORBIDDEN', { reason: 'identity-required' });
  }
  if (!input || typeof input !== 'object') fail('FORBIDDEN');
  const role = validateRole(input.role);
  const userId = role === 'kitchen'
    ? (typeof input.userId === 'string' && input.userId.trim() ? input.userId.trim() : null)
    : validateUserId(input.userId);
  return { role, userId };
}

function requireKitchen(input) {
  const actor = resolveActor(input);
  if (actor.role !== 'kitchen') fail('FORBIDDEN', { role: actor.role });
  return actor;
}

function recordAudit(state, action, actor, details) {
  state.audit.push({
    at: state.clock(),
    action,
    actorRole: actor && actor.role ? actor.role : null,
    actorId: actor && actor.userId ? actor.userId : null,
    details: { ...details },
  });
  if (state.audit.length > MAX_AUDIT_ENTRIES) {
    state.audit.splice(0, state.audit.length - MAX_AUDIT_ENTRIES);
  }
}

const NUTRITION_KEYS = ['calories', 'protein', 'fat', 'carbs'];

function normalizeMenuItem(raw) {
  if (!raw || typeof raw !== 'object') fail('INVALID_ITEM');
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fail('INVALID_ITEM', { field: 'id' });
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fail('INVALID_ITEM', { field: 'name' });
  if (!Number.isInteger(raw.price) || raw.price < 0 || raw.price > MAX_PRICE) fail('INVALID_ITEM', { field: 'price' });
  const category = typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : fail('INVALID_ITEM', { field: 'category' });
  const available = raw.available === undefined ? true : raw.available;
  if (typeof available !== 'boolean') fail('INVALID_ITEM', { field: 'available' });
  const rawAllergens = raw.allergens === undefined ? [] : raw.allergens;
  if (!Array.isArray(rawAllergens) || rawAllergens.some((a) => typeof a !== 'string' || !a.trim())) {
    fail('INVALID_ITEM', { field: 'allergens' });
  }
  const allergens = [...new Set(rawAllergens.map((a) => a.trim()))];
  const item = { id, name, price: raw.price, category, available, allergens };
  if (raw.nutrition !== undefined) {
    if (!raw.nutrition || typeof raw.nutrition !== 'object') fail('INVALID_ITEM', { field: 'nutrition' });
    const nutrition = {};
    for (const key of NUTRITION_KEYS) {
      const value = raw.nutrition[key];
      if (value === undefined) continue;
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail('INVALID_ITEM', { field: `nutrition.${key}` });
      nutrition[key] = value;
    }
    if (Object.keys(nutrition).length) item.nutrition = nutrition;
  }
  return item;
}

// ── store factory ───────────────────────────────────────────────────────────

/**
 * Creates an in-memory buffet store for one school.
 * @param {object} options
 * @param {boolean} options.enabled     false → the school has no buffet; ordering is rejected.
 * @param {string}  options.schoolId    required, non-empty.
 * @param {Array}   [options.menu]      menu items (defaults to a deep copy of SAMPLE_MENU).
 * @param {object}  [options.cart]      persisted cart { itemId: qty } (rehydration).
 * @param {Array}   [options.orders]    persisted orders (rehydration).
 * @param {Array}   [options.audit]     persisted audit log (rehydration).
 * @param {Function} [options.clock]    () => timestamp; inject for determinism.
 * @param {Function} [options.nextId]   () => order id; inject for determinism.
 */
export function createBuffet({
  enabled = true,
  schoolId,
  menu = SAMPLE_MENU,
  cart = {},
  orders = [],
  audit = [],
  clock = () => Date.now(),
  nextId,
} = {}) {
  if (typeof schoolId !== 'string' || !schoolId.trim()) fail('INVALID_SCHOOL', { schoolId });
  if (typeof clock !== 'function') fail('INVALID_SCHOOL', { reason: 'clock must be a function' });
  if (!Array.isArray(menu)) fail('INVALID_ITEM', { reason: 'menu must be an array' });
  const items = menu.map(normalizeMenuItem);
  if (new Set(items.map((i) => i.id)).size !== items.length) fail('INVALID_ITEM', { reason: 'duplicate ids' });

  let counter = 0;
  const idGen = typeof nextId === 'function' ? nextId : () => `ord-${++counter}`;

  // Rehydrated cart: keep only lines that reference an existing item with a
  // valid quantity; silently drop stale entries instead of crashing on load.
  const cleanCart = {};
  if (cart && typeof cart === 'object') {
    for (const [itemId, qty] of Object.entries(cart)) {
      if (items.some((i) => i.id === itemId) && Number.isInteger(qty) && qty >= 1 && qty <= MAX_QUANTITY) {
        cleanCart[itemId] = qty;
      }
    }
  }

  return {
    schoolId: schoolId.trim(),
    enabled: Boolean(enabled),
    menu: items,
    cart: cleanCart,
    orders: (Array.isArray(orders) ? orders : []).map(cloneOrder),
    audit: (Array.isArray(audit) ? audit : []).map((e) => ({ ...e, details: { ...(e.details || {}) } })),
    clock,
    nextId: idGen,
  };
}

/** Plain, JSON-serializable snapshot of the store (no functions). */
export function serializeBuffet(state) {
  return {
    schoolId: state.schoolId,
    enabled: state.enabled,
    menu: state.menu.map(cloneItem),
    cart: { ...state.cart },
    orders: state.orders.map(cloneOrder),
    audit: state.audit.map((e) => ({ ...e, details: { ...e.details } })),
  };
}

// ── menu reads ──────────────────────────────────────────────────────────────

/**
 * Ordering view (pupil/staff, default): only available items.
 * Kitchen view ({ role: 'kitchen' }): the full menu including the stop-list.
 * Returns clones — callers cannot mutate the store through the result.
 */
export function getMenu(state, options = {}) {
  const role = typeof options === 'string' ? options : (options.role === undefined ? 'pupil' : options.role);
  validateRole(role);
  const items = role === 'kitchen' ? state.menu : state.menu.filter((i) => i.available);
  return items.map(cloneItem);
}

/** Current cart as display lines with exact integer line totals. */
export function getCart(state) {
  const lines = [];
  for (const [itemId, qty] of Object.entries(state.cart)) {
    const item = state.menu.find((i) => i.id === itemId);
    if (!item) continue; // defensive: stale line after rehydration
    lines.push({
      itemId: item.id, name: item.name, price: item.price, category: item.category,
      available: item.available, allergens: [...item.allergens],
      qty, lineTotal: item.price * qty,
    });
  }
  return lines;
}

/** Exact integer ruble sum of the cart. */
export function cartTotal(state) {
  let total = 0;
  for (const [itemId, qty] of Object.entries(state.cart)) {
    const item = state.menu.find((i) => i.id === itemId);
    if (item) total += item.price * qty;
  }
  return total;
}

/** «35 ₽» — convenience formatter for the UI (integer rubles). */
export function formatPrice(rubles) {
  return `${rubles} ₽`;
}

// ── cart mutations ──────────────────────────────────────────────────────────

export function addToCart(state, itemId, qty = 1) {
  assertEnabled(state);
  const item = findMenuItem(state, itemId);
  if (!item.available) fail('ITEM_UNAVAILABLE', { itemId });
  validateQuantity(qty);
  const next = (state.cart[item.id] || 0) + qty;
  validateQuantity(next); // cumulative cap
  state.cart[item.id] = next;
  return getCart(state);
}

export function setQuantity(state, itemId, qty) {
  assertEnabled(state);
  const item = findMenuItem(state, itemId);
  if (!item.available) fail('ITEM_UNAVAILABLE', { itemId });
  validateQuantity(qty);
  state.cart[item.id] = qty;
  return getCart(state);
}

/** Idempotent removal of a cart line (no error if the line is absent). */
export function removeFromCart(state, itemId) {
  assertEnabled(state);
  if (typeof itemId === 'string') delete state.cart[itemId];
  return getCart(state);
}

// ── orders ──────────────────────────────────────────────────────────────────

/**
 * Places an order from the current cart. The order stores a full snapshot of
 * item names/prices/allergens, so later menu edits never rewrite history.
 * Rejects: buffet disabled, empty cart, unknown/unavailable items, bad identity.
 */
export function placeOrder(state, { userId, role } = {}) {
  assertEnabled(state);
  validateRole(role);
  const uid = validateUserId(userId);
  const entries = Object.entries(state.cart);
  if (!entries.length) fail('EMPTY_CART');

  const items = [];
  let total = 0;
  for (const [itemId, qty] of entries) {
    const item = findMenuItem(state, itemId);
    if (!item.available) fail('ITEM_UNAVAILABLE', { itemId });
    validateQuantity(qty);
    items.push({
      itemId: item.id, name: item.name, price: item.price,
      category: item.category, allergens: [...item.allergens], qty,
    });
    total += item.price * qty;
  }

  const at = state.clock();
  const order = {
    id: state.nextId(),
    schoolId: state.schoolId,
    userId: uid,
    role,
    items,
    total,
    status: 'new',
    createdAt: at,
    updatedAt: at,
    history: [{ status: 'new', at, by: uid }],
  };
  state.orders.push(order);
  state.cart = {};
  recordAudit(state, 'order_placed', { role, userId: uid }, { orderId: order.id, total });
  return cloneOrder(order);
}

/**
 * Kitchen-only: advances an order exactly one step along
 * new → preparing → ready → completed. Rejects any other transition
 * (e.g. advancing a completed or cancelled order).
 */
export function kitchenAdvanceOrder(state, orderId, actor) {
  const kitchen = requireKitchen(actor);
  const order = findOrder(state, orderId);
  const index = STATUS_FLOW.indexOf(order.status);
  if (index === -1 || index === STATUS_FLOW.length - 1) {
    fail('INVALID_TRANSITION', { orderId, from: order.status });
  }
  const nextStatus = STATUS_FLOW[index + 1];
  const at = state.clock();
  order.status = nextStatus;
  order.updatedAt = at;
  order.history.push({ status: nextStatus, at, by: kitchen.userId });
  recordAudit(state, 'order_advanced', kitchen, { orderId, from: STATUS_FLOW[index], to: nextStatus });
  return cloneOrder(order);
}

/**
 * Cancels an order. Allowed only while status is 'new' or 'preparing'
 * (i.e. before 'ready'), and only by the owner or kitchen staff.
 * `byRole` may be the bare string 'kitchen' or an actor { role, userId };
 * a pupil/staff must provide their userId so ownership can be verified.
 */
export function cancelOrder(state, orderId, byRole) {
  const actor = resolveActor(byRole);
  const order = findOrder(state, orderId);
  if (order.status !== 'new' && order.status !== 'preparing') {
    fail('ORDER_NOT_CANCELABLE', { orderId, status: order.status });
  }
  if (actor.role !== 'kitchen' && order.userId !== actor.userId) {
    fail('FORBIDDEN', { orderId, userId: actor.userId });
  }
  const at = state.clock();
  order.status = 'cancelled';
  order.updatedAt = at;
  order.history.push({ status: 'cancelled', at, by: actor.userId });
  recordAudit(state, 'order_cancelled', actor, { orderId });
  return cloneOrder(order);
}

/**
 * Role-scoped order list. Kitchen sees every order; a pupil/staff sees ONLY
 * their own (a missing userId is rejected, never treated as "see all").
 * Returns clones sorted oldest-first (insertion order).
 */
export function listOrders(state, { role, userId } = {}) {
  validateRole(role);
  if (role === 'kitchen') return state.orders.map(cloneOrder);
  const uid = validateUserId(userId);
  return state.orders.filter((o) => o.userId === uid).map(cloneOrder);
}

// ── menu management (kitchen/admin only) ────────────────────────────────────

export function setItemAvailability(state, itemId, available, actor) {
  const kitchen = requireKitchen(actor);
  if (typeof available !== 'boolean') fail('INVALID_AVAILABILITY', { available });
  const item = findMenuItem(state, itemId);
  item.available = available;
  recordAudit(state, 'availability_changed', kitchen, { itemId, available });
  return cloneItem(item);
}

/** Creates a new menu item or replaces the existing one with the same id. */
export function upsertMenuItem(state, rawItem, actor) {
  const kitchen = requireKitchen(actor);
  const item = normalizeMenuItem(rawItem);
  const index = state.menu.findIndex((i) => i.id === item.id);
  if (index >= 0) state.menu[index] = item;
  else state.menu.push(item);
  recordAudit(state, 'menu_upserted', kitchen, { itemId: item.id, price: item.price });
  return cloneItem(item);
}

/** Removes a menu item; existing orders keep their snapshots, cart line is dropped. */
export function removeMenuItem(state, itemId, actor) {
  const kitchen = requireKitchen(actor);
  const index = state.menu.findIndex((i) => i.id === itemId);
  if (index < 0) fail('ITEM_NOT_FOUND', { itemId });
  const [removed] = state.menu.splice(index, 1);
  delete state.cart[itemId];
  recordAudit(state, 'menu_removed', kitchen, { itemId });
  return cloneItem(removed);
}