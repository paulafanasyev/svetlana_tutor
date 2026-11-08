// E-book / textbook store domain logic («Книжный магазин ЦШ»).
//
// PURE, framework-independent ES module: no React, no network, no localStorage.
// The store is a plain state object produced by createBookstore(); every function
// takes that state as its first argument. A persistence layer (localStorage,
// HTTP backend, …) can JSON.stringify serializeBookstore(state) and later rehydrate
// it with createBookstore({ ...data, clock, nextId }) — the clock and id generator
// are injectable so behaviour is fully deterministic in tests.
//
// Roles: 'reader' | 'partner' | 'moderator'. Partners (publishers/authors) upload
// their own books; a moderator approves/rejects listings; readers (pupils,
// teachers, parents) browse ONLY approved listings and buy them into a personal
// library. The app maps ADMIN → moderator later; this module knows only these three.
// Money: integer rubles everywhere (0 = free) — no floating point arithmetic.
//
// Rejections throw BookstoreError with a stable `.code` and a Russian `.message`
// (see BOOKSTORE_ERROR_MESSAGES) so the UI can show a clear reason or map codes to
// i18n keys. Every returned object is a clone — callers cannot mutate the store.

import { SAMPLE_CATALOG, BOOK_SUBJECTS, BOOK_FORMATS, BOOK_LICENSES } from './catalog.js';

export const ROLES = Object.freeze(['reader', 'partner', 'moderator']);
export const LISTING_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);
export const MIN_GRADE = 1;
export const MAX_GRADE = 11;
export const MAX_PRICE = 100000;       // rubles, validation ceiling for listings
const MAX_AUDIT_ENTRIES = 500;         // bounded, audit-friendly ring of events

export const BOOKSTORE_ERROR_MESSAGES = Object.freeze({
  DISABLED: 'Книжный магазин этой школы отключён — операции недоступны.',
  INVALID_SCHOOL: 'Некорректный идентификатор школы.',
  INVALID_ROLE: 'Неизвестная роль пользователя.',
  INVALID_USER: 'Не указан идентификатор пользователя.',
  FORBIDDEN: 'Недостаточно прав для этого действия.',
  INVALID_LISTING: 'Некорректная книга: нужны название, автор, предмет, классы (1–11), целая цена в рублях, формат, описание и данные о правах.',
  NOT_FOUND: 'Книга не найдена.',
  NOT_APPROVED: 'Книга не прошла модерацию — покупка недоступна.',
  NOT_PENDING: 'Действие доступно только для книг со статусом «на модерации».',
  ALREADY_OWNED: 'Эта книга уже есть в вашей библиотеке — повторная покупка не нужна.',
  REASON_REQUIRED: 'Укажите причину отклонения книги.',
});

export class BookstoreError extends Error {
  constructor(code, details) {
    super(BOOKSTORE_ERROR_MESSAGES[code] || code);
    this.name = 'BookstoreError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const fail = (code, details) => { throw new BookstoreError(code, details); };

// ── internal helpers ────────────────────────────────────────────────────────

function cloneListing(listing) {
  return { ...listing, grades: [...listing.grades] };
}

function cloneOrder(order) {
  return { ...order, grades: Array.isArray(order.grades) ? [...order.grades] : order.grades };
}

function cloneLibraryEntry(entry) {
  return { ...entry, grades: Array.isArray(entry.grades) ? [...entry.grades] : entry.grades };
}

function validateRole(role) {
  if (!ROLES.includes(role)) fail('INVALID_ROLE', { role });
  return role;
}

function validateUserId(userId) {
  if (typeof userId !== 'string' || !userId.trim()) fail('INVALID_USER', { userId });
  return userId.trim();
}

function assertEnabled(state) {
  if (!state.enabled) fail('DISABLED', { schoolId: state.schoolId });
}

function findListing(state, listingId) {
  const listing = typeof listingId === 'string' ? state.listings.find((l) => l.id === listingId) : undefined;
  if (!listing) fail('NOT_FOUND', { listingId });
  return listing;
}

// Accepts an actor object { role, userId } or the bare string 'moderator'.
// A bare non-moderator string is rejected: ownership cannot be verified without
// a userId, so we never guess identity. A moderator may omit userId (management
// actions do not require a personal identity); readers/partners must provide one.
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

function requireModerator(input) {
  const actor = resolveActor(input);
  if (actor.role !== 'moderator') fail('FORBIDDEN', { role: actor.role });
  return actor;
}

function requirePartner(input) {
  const actor = resolveActor(input);
  if (actor.role !== 'partner') fail('FORBIDDEN', { role: actor.role });
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

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) fail('INVALID_LISTING', { field });
  return value.trim();
}

// Validates and normalizes a full listing record (used by the factory for the
// seed/rehydration and by createListing/updateListing for partner payloads).
function normalizeListing(raw) {
  if (!raw || typeof raw !== 'object') fail('INVALID_LISTING');
  const id = requireText(raw.id, 'id');
  const title = requireText(raw.title, 'title');
  const author = requireText(raw.author, 'author');
  if (!BOOK_SUBJECTS.some((s) => s.id === raw.subject)) fail('INVALID_LISTING', { field: 'subject' });
  const grades = raw.grades;
  if (!Array.isArray(grades) || grades.length !== 2
    || !grades.every((g) => Number.isInteger(g) && g >= MIN_GRADE && g <= MAX_GRADE)
    || grades[0] > grades[1]) fail('INVALID_LISTING', { field: 'grades' });
  if (!Number.isInteger(raw.price) || raw.price < 0 || raw.price > MAX_PRICE) fail('INVALID_LISTING', { field: 'price' });
  const description = requireText(raw.description, 'description');
  if (!BOOK_FORMATS.includes(raw.format)) fail('INVALID_LISTING', { field: 'format' });
  const rightsHolder = requireText(raw.rightsHolder, 'rightsHolder');
  if (!BOOK_LICENSES.includes(raw.license)) fail('INVALID_LISTING', { field: 'license' });
  const status = raw.status === undefined ? 'pending' : raw.status;
  if (!LISTING_STATUSES.includes(status)) fail('INVALID_LISTING', { field: 'status' });
  const partnerId = requireText(raw.partnerId, 'partnerId');
  if (typeof raw.createdAt !== 'number' || !Number.isFinite(raw.createdAt)) fail('INVALID_LISTING', { field: 'createdAt' });

  const listing = {
    id, title, author, subject: raw.subject, grades: [grades[0], grades[1]],
    price: raw.price, description, format: raw.format, rightsHolder, license: raw.license,
    status, partnerId, createdAt: raw.createdAt,
  };
  if (status === 'rejected') listing.rejectReason = requireText(raw.rejectReason, 'rejectReason');
  if (raw.coverEmoji !== undefined) {
    if (typeof raw.coverEmoji !== 'string') fail('INVALID_LISTING', { field: 'coverEmoji' });
    if (raw.coverEmoji.trim()) listing.coverEmoji = raw.coverEmoji.trim();
  }
  if (raw.sampleText !== undefined) {
    if (typeof raw.sampleText !== 'string') fail('INVALID_LISTING', { field: 'sampleText' });
    listing.sampleText = raw.sampleText;
  }
  return listing;
}

// ── store factory ───────────────────────────────────────────────────────────

/**
 * Creates an in-memory bookstore for one school (or platform-wide if schoolId omitted).
 * @param {object}   options
 * @param {string}   [options.schoolId]  optional; if provided must be non-empty.
 * @param {boolean}  [options.enabled]   false → uploads/purchases rejected (reads/moderation still work).
 * @param {Array}    [options.listings]  defaults to a deep copy of SAMPLE_CATALOG.
 * @param {Array}    [options.orders]    persisted orders (rehydration).
 * @param {object}   [options.library]   persisted { userId: [book entries] } (rehydration).
 * @param {Array}    [options.audit]     persisted audit log (rehydration).
 * @param {Function} [options.clock]     () => timestamp; inject for determinism.
 * @param {Function} [options.nextId]    () => id (listings AND orders); inject for determinism.
 */
export function createBookstore({
  enabled = true,
  schoolId = null,
  listings = SAMPLE_CATALOG,
  orders = [],
  library = {},
  audit = [],
  clock = () => Date.now(),
  nextId,
} = {}) {
  if (schoolId !== null && (typeof schoolId !== 'string' || !schoolId.trim())) fail('INVALID_SCHOOL', { schoolId });
  if (typeof clock !== 'function') fail('INVALID_SCHOOL', { reason: 'clock must be a function' });
  if (!Array.isArray(listings)) fail('INVALID_LISTING', { reason: 'listings must be an array' });
  const items = listings.map(normalizeListing);
  if (new Set(items.map((l) => l.id)).size !== items.length) fail('INVALID_LISTING', { reason: 'duplicate ids' });

  let counter = 0;
  const idGen = typeof nextId === 'function' ? nextId : () => `id-${++counter}`;

  // Rehydrated library: keep only well-formed per-user arrays; silently drop
  // stale/malformed entries instead of crashing on load.
  const cleanLibrary = {};
  if (library && typeof library === 'object') {
    for (const [userId, entries] of Object.entries(library)) {
      if (!Array.isArray(entries)) continue;
      cleanLibrary[userId] = entries.map(cloneLibraryEntry);
    }
  }

  return {
    schoolId: typeof schoolId === 'string' ? schoolId.trim() : null,
    enabled: Boolean(enabled),
    listings: items,
    orders: (Array.isArray(orders) ? orders : []).map(cloneOrder),
    library: cleanLibrary,
    audit: (Array.isArray(audit) ? audit : []).map((e) => ({ ...e, details: { ...(e.details || {}) } })),
    clock,
    nextId: idGen,
  };
}

/** Plain, JSON-serializable snapshot of the store (no functions). */
export function serializeBookstore(state) {
  const library = {};
  for (const [userId, entries] of Object.entries(state.library)) library[userId] = entries.map(cloneLibraryEntry);
  return {
    schoolId: state.schoolId,
    enabled: state.enabled,
    listings: state.listings.map(cloneListing),
    orders: state.orders.map(cloneOrder),
    library,
    audit: state.audit.map((e) => ({ ...e, details: { ...e.details } })),
  };
}

// ── catalog reads ───────────────────────────────────────────────────────────

/** Public catalog: ONLY approved listings, as clones. */
export function listCatalog(state) {
  return state.listings.filter((l) => l.status === 'approved').map(cloneListing);
}

/**
 * Pure search/filter over the approved catalog.
 * @param {object} [filters]
 * @param {string} [filters.subject]  subject id (validated).
 * @param {number} [filters.grade]    integer 1..11; matches listings whose [lo,hi] contains it.
 * @param {string} [filters.query]    case-insensitive substring of title or author.
 */
export function searchCatalog(state, { subject, grade, query } = {}) {
  if (subject !== undefined && !BOOK_SUBJECTS.some((s) => s.id === subject)) fail('INVALID_LISTING', { field: 'subject' });
  if (grade !== undefined && (!Number.isInteger(grade) || grade < MIN_GRADE || grade > MAX_GRADE)) fail('INVALID_LISTING', { field: 'grade' });
  let q;
  if (query !== undefined) {
    if (typeof query !== 'string') fail('INVALID_LISTING', { field: 'query' });
    q = query.trim().toLowerCase();
  }
  return listCatalog(state).filter((l) => {
    if (subject !== undefined && l.subject !== subject) return false;
    if (grade !== undefined && (grade < l.grades[0] || grade > l.grades[1])) return false;
    if (q && !`${l.title} ${l.author}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Moderator-only: the moderation queue (pending listings), as clones. */
export function listPending(state, actor) {
  requireModerator(actor);
  return state.listings.filter((l) => l.status === 'pending').map(cloneListing);
}

/** Partner-only: the caller's own listings (any status), as clones. */
export function listMyListings(state, actor) {
  const partner = requirePartner(actor);
  return state.listings.filter((l) => l.partnerId === partner.userId).map(cloneListing);
}

/** «499 ₽» / «Бесплатно» — convenience formatter for the UI (integer rubles). */
export function formatPrice(rubles) {
  return rubles === 0 ? 'Бесплатно' : `${rubles} ₽`;
}

// ── partner mutations ───────────────────────────────────────────────────────

/**
 * Partner uploads a new book → always 'pending' (never self-approved). The id,
 * partnerId, status and createdAt are assigned by the store, so a partner cannot
 * spoof identity or pre-approve. Validates the full listing shape.
 */
export function createListing(state, raw, actor) {
  assertEnabled(state);
  const partner = requirePartner(actor);
  if (!raw || typeof raw !== 'object') fail('INVALID_LISTING');
  // Validate the payload before consuming an id (keeps id sequence clean on errors).
  const base = normalizeListing({
    ...raw, id: 'new', partnerId: partner.userId, status: 'pending', createdAt: state.clock(),
  });
  const id = state.nextId();
  if (state.listings.some((l) => l.id === id)) fail('INVALID_LISTING', { reason: 'duplicate id' });
  const listing = { ...base, id };
  state.listings.push(listing);
  recordAudit(state, 'listing_submitted', partner, { listingId: listing.id, title: listing.title, price: listing.price });
  return cloneListing(listing);
}

/**
 * Partner edits ONLY their own pending listing. id/partnerId/createdAt/status are
 * pinned, so a patch can never reassign ownership or self-approve. Approved or
 * rejected listings are locked (NOT_PENDING); another partner's listing is FORBIDDEN.
 */
export function updateListing(state, listingId, patch, actor) {
  assertEnabled(state);
  const partner = requirePartner(actor);
  const listing = findListing(state, listingId);
  if (listing.partnerId !== partner.userId) fail('FORBIDDEN', { listingId });
  if (listing.status !== 'pending') fail('NOT_PENDING', { listingId, status: listing.status });
  if (!patch || typeof patch !== 'object') fail('INVALID_LISTING');
  const updated = normalizeListing({
    ...listing, ...patch,
    id: listing.id, partnerId: listing.partnerId, createdAt: listing.createdAt, status: 'pending',
  });
  const index = state.listings.findIndex((l) => l.id === listing.id);
  state.listings[index] = updated;
  recordAudit(state, 'listing_updated', partner, { listingId: listing.id });
  return cloneListing(updated);
}

// ── moderation (moderator only) ─────────────────────────────────────────────

/** Approves a pending listing → visible to readers. Moderator only. */
export function approveListing(state, listingId, actor) {
  const moderator = requireModerator(actor);
  const listing = findListing(state, listingId);
  if (listing.status !== 'pending') fail('NOT_PENDING', { listingId, status: listing.status });
  listing.status = 'approved';
  delete listing.rejectReason;
  recordAudit(state, 'listing_approved', moderator, { listingId: listing.id, title: listing.title });
  return cloneListing(listing);
}

/** Rejects a pending listing with a mandatory reason. Moderator only. */
export function rejectListing(state, listingId, reason, actor) {
  const moderator = requireModerator(actor);
  const listing = findListing(state, listingId);
  if (listing.status !== 'pending') fail('NOT_PENDING', { listingId, status: listing.status });
  if (typeof reason !== 'string' || !reason.trim()) fail('REASON_REQUIRED', { listingId });
  listing.status = 'rejected';
  listing.rejectReason = reason.trim();
  recordAudit(state, 'listing_rejected', moderator, { listingId: listing.id, reason: listing.rejectReason });
  return cloneListing(listing);
}

// ── purchases & library ─────────────────────────────────────────────────────

/**
 * Buys an approved listing into the caller's personal library. Creates an
 * immutable order snapshot (title/author/price captured at purchase time, so
 * later catalog edits never rewrite history). Free books (price 0) skip payment
 * (order.free = true). Idempotent: re-buying an owned book throws ALREADY_OWNED
 * BEFORE any charge/order/library mutation — no double charge, no duplicate.
 * Rejects unapproved/unknown listings and bad identity. Any role may buy, but a
 * userId is always required (a bare 'moderator' string carries no identity).
 */
export function buyListing(state, listingId, actor) {
  assertEnabled(state);
  const resolved = resolveActor(actor);
  const uid = validateUserId(resolved.userId);
  const listing = findListing(state, listingId);
  if (listing.status !== 'approved') fail('NOT_APPROVED', { listingId, status: listing.status });
  if ((state.library[uid] || []).some((e) => e.listingId === listing.id)) {
    fail('ALREADY_OWNED', { listingId, userId: uid });
  }
  const at = state.clock();
  const order = {
    id: state.nextId(),
    schoolId: state.schoolId,
    userId: uid,
    listingId: listing.id,
    title: listing.title,
    author: listing.author,
    subject: listing.subject,
    grades: [...listing.grades],
    format: listing.format,
    price: listing.price,
    free: listing.price === 0,
    createdAt: at,
  };
  if (listing.coverEmoji !== undefined) order.coverEmoji = listing.coverEmoji;
  state.orders.push(order);

  const entry = {
    listingId: listing.id,
    orderId: order.id,
    title: listing.title,
    author: listing.author,
    subject: listing.subject,
    grades: [...listing.grades],
    format: listing.format,
    price: listing.price,
    purchasedAt: at,
  };
  if (listing.coverEmoji !== undefined) entry.coverEmoji = listing.coverEmoji;
  if (!state.library[uid]) state.library[uid] = [];
  state.library[uid].push(entry);

  recordAudit(state, 'book_purchased', { role: resolved.role, userId: uid },
    { orderId: order.id, listingId: listing.id, price: listing.price, free: order.free });
  return cloneOrder(order);
}

/** The caller's purchased books (clones). A reader sees ONLY their own library. */
export function listLibrary(state, userId) {
  const uid = validateUserId(userId);
  return (state.library[uid] || []).map(cloneLibraryEntry);
}

/** True if the user already owns the listing (lets the UI disable the buy button). */
export function hasBook(state, userId, listingId) {
  const uid = validateUserId(userId);
  return (state.library[uid] || []).some((e) => e.listingId === listingId);
}

/**
 * Role-scoped order list. Moderator sees every order; a reader/partner sees ONLY
 * their own (a missing userId is rejected, never treated as "see all"). Clones.
 */
export function listOrders(state, actor) {
  const resolved = resolveActor(actor);
  if (resolved.role === 'moderator') return state.orders.map(cloneOrder);
  return state.orders.filter((o) => o.userId === resolved.userId).map(cloneOrder);
}