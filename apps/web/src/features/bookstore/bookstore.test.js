// Deterministic node:test suite for the e-book / textbook store domain logic.
// Run from apps/web:  node --test src/features/bookstore/bookstore.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBookstore, serializeBookstore, listCatalog, searchCatalog, listPending,
  listMyListings, createListing, updateListing, approveListing, rejectListing,
  buyListing, listLibrary, hasBook, listOrders, formatPrice,
  BookstoreError, ROLES, LISTING_STATUSES, MAX_PRICE, MIN_GRADE, MAX_GRADE,
  BOOKSTORE_ERROR_MESSAGES,
} from './bookstore.js';
import { SAMPLE_CATALOG, BOOK_SUBJECTS, BOOK_FORMATS, BOOK_LICENSES } from './catalog.js';

const T0 = 1700000000000; // fixed clock → fully reproducible timestamps
const READER = { role: 'reader', userId: 'reader-1' };
const READER2 = { role: 'reader', userId: 'reader-2' };
const PARTNER = { role: 'partner', userId: 'partner-1' };
const PARTNER2 = { role: 'partner', userId: 'partner-2' };
const MODERATOR = { role: 'moderator', userId: 'mod-1' };

const MATH5 = 'book-math-5';            // 499 ₽, approved
const FREE_TALES = 'book-reading-tales'; // 0 ₽, approved (free)
const PENDING_LAB = 'book-physics-lab-8';       // pending
const PENDING_WORKBOOK = 'book-math-workbook-2'; // pending
const REJECTED_GDZ = 'book-gdz-math-5';          // rejected

const NEW_BOOK = {
  title: 'Алгебра. 8 класс. Учебник',
  author: 'Ю. Н. Макарычев',
  subject: 'mathematics',
  grades: [8, 8],
  price: 450,
  description: 'Учебник алгебры для 8 класса: квадратные корни, дробные рациональные выражения, неравенства.',
  format: 'pdf',
  rightsHolder: 'Ю. Н. Макарычев',
  license: 'own',
};

function makeState(opts = {}) {
  let n = 0;
  return createBookstore({
    schoolId: 'school-42',
    enabled: true,
    clock: () => T0,
    nextId: () => `id-${++n}`,
    ...opts,
  });
}

// assert.throws predicate: matches a BookstoreError with a stable code.
const code = (c) => (e) => e instanceof BookstoreError && e.code === c;

test('createBookstore builds an isolated store seeded with a deep copy of the catalog', () => {
  const state = makeState();
  assert.equal(state.schoolId, 'school-42');
  assert.equal(state.enabled, true);
  assert.deepEqual(state.orders, []);
  assert.deepEqual(state.library, {});
  assert.deepEqual(state.audit, []);
  assert.equal(state.listings.length, SAMPLE_CATALOG.length);
  assert.notEqual(state.listings, SAMPLE_CATALOG);
  // Mutating the store must never leak into the shared (frozen) seed data.
  state.listings[0].price = 999;
  state.listings[0].grades[0] = 1;
  assert.equal(SAMPLE_CATALOG[0].price, 499);
  assert.deepEqual(SAMPLE_CATALOG[0].grades, [5, 5]);
  // Two stores are fully independent.
  const a = makeState();
  const b = makeState();
  buyListing(a, MATH5, READER);
  assert.equal(a.orders.length, 1);
  assert.equal(b.orders.length, 0);
  // schoolId is optional (platform-wide store); invalid values are rejected.
  const noSchool = createBookstore({ clock: () => T0 });
  assert.equal(noSchool.schoolId, null);
  assert.equal(noSchool.listings.length, SAMPLE_CATALOG.length);
  assert.throws(() => createBookstore({ schoolId: '' }), code('INVALID_SCHOOL'));
  assert.throws(() => createBookstore({ schoolId: 42 }), code('INVALID_SCHOOL'));
  // A custom catalog is also deep-copied.
  const custom = createBookstore({ schoolId: 's', listings: [SAMPLE_CATALOG[0]], clock: () => T0 });
  assert.equal(custom.listings.length, 1);
  custom.listings[0].title = 'Подмена';
  assert.equal(SAMPLE_CATALOG[0].title, 'Математика. 5 класс. Учебник');
});

test('seeded catalog is realistic, school-safe and uses integer ruble prices', () => {
  const ids = SAMPLE_CATALOG.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique');
  assert.ok(SAMPLE_CATALOG.length >= 18, 'a real store has a broad catalog');
  assert.ok(Object.isFrozen(SAMPLE_CATALOG), 'seed array is frozen');
  assert.ok(Object.isFrozen(SAMPLE_CATALOG[0]), 'seed listings are frozen');
  const subjectIds = BOOK_SUBJECTS.map((s) => s.id);
  for (const l of SAMPLE_CATALOG) {
    assert.match(l.title, /[А-Яа-яЁё]/, `Russian title: ${l.id}`);
    assert.ok(l.title.trim().length > 2, `no placeholder titles: ${l.id}`);
    assert.ok(typeof l.author === 'string' && l.author.trim().length > 0, `author: ${l.id}`);
    assert.ok(Number.isInteger(l.price) && l.price >= 0 && l.price <= MAX_PRICE, `integer price: ${l.id}`);
    if (l.price > 0) assert.ok(l.price >= 299 && l.price <= 799, `sensible textbook price: ${l.id} = ${l.price}`);
    assert.ok(subjectIds.includes(l.subject), `known subject: ${l.id}`);
    assert.ok(Array.isArray(l.grades) && l.grades.length === 2, `grades pair: ${l.id}`);
    assert.ok(l.grades.every((g) => Number.isInteger(g) && g >= MIN_GRADE && g <= MAX_GRADE), `grades 1..11: ${l.id}`);
    assert.ok(l.grades[0] <= l.grades[1], `ordered grades: ${l.id}`);
    assert.ok(BOOK_FORMATS.includes(l.format), `known format: ${l.id}`);
    assert.ok(BOOK_LICENSES.includes(l.license), `known license: ${l.id}`);
    assert.ok(LISTING_STATUSES.includes(l.status), `known status: ${l.id}`);
    assert.ok(typeof l.rightsHolder === 'string' && l.rightsHolder.trim(), `rightsHolder: ${l.id}`);
    assert.ok(typeof l.partnerId === 'string' && l.partnerId.trim(), `partnerId: ${l.id}`);
    assert.ok(typeof l.description === 'string' && l.description.trim(), `description: ${l.id}`);
    assert.ok(Number.isFinite(l.createdAt), `createdAt: ${l.id}`);
    if (l.status === 'rejected') assert.ok(l.rejectReason && l.rejectReason.trim(), `rejectReason: ${l.id}`);
    // Child-safety: nothing age-inappropriate may appear in a school store.
    // «вино/вина» is matched only as a whole word (Cyrillic-aware lookarounds,
    // since JS \b is ASCII-only) so surnames like «Коровина» are not flagged.
    const text = `${l.title} ${l.author} ${l.description}`;
    assert.doesNotMatch(text, /алкогол|пиво|(?<![А-Яа-яЁё])вин[оа](?![А-Яа-яЁё])|водк|коньяк|табак|сигарет|энергет|наркот|оружи|казино|ставк/i,
      `school-safe listing: ${l.id}`);
  }
  const approved = SAMPLE_CATALOG.filter((l) => l.status === 'approved');
  const pending = SAMPLE_CATALOG.filter((l) => l.status === 'pending');
  const rejected = SAMPLE_CATALOG.filter((l) => l.status === 'rejected');
  assert.ok(approved.length >= 15, 'most listings are approved');
  assert.equal(pending.length, 2, 'a couple pending demo the moderation queue');
  assert.equal(rejected.length, 1, 'one rejected demo');
  assert.ok(SAMPLE_CATALOG.filter((l) => l.price === 0).length >= 2, 'a few free books');
  // Every grade 1..11 is covered by at least one approved listing.
  for (let g = MIN_GRADE; g <= MAX_GRADE; g++) {
    assert.ok(approved.some((l) => g >= l.grades[0] && g <= l.grades[1]), `approved coverage for grade ${g}`);
  }
});

test('listCatalog returns only approved listings, as clones', () => {
  const state = makeState();
  const catalog = listCatalog(state);
  const approvedSeed = SAMPLE_CATALOG.filter((l) => l.status === 'approved');
  assert.equal(catalog.length, approvedSeed.length);
  assert.ok(catalog.every((l) => l.status === 'approved'));
  assert.ok(!catalog.some((l) => l.id === PENDING_LAB));
  assert.ok(!catalog.some((l) => l.id === PENDING_WORKBOOK));
  assert.ok(!catalog.some((l) => l.id === REJECTED_GDZ));
  // Returned listings are clones — external mutation cannot corrupt the store.
  catalog[0].price = 1;
  catalog[0].grades[0] = 11;
  const stored = state.listings.find((l) => l.id === catalog[0].id);
  assert.equal(stored.price, 499);
  assert.deepEqual(stored.grades, [5, 5]);
});

test('searchCatalog filters by subject, grade and query (approved only)', () => {
  const state = makeState();
  const math = searchCatalog(state, { subject: 'mathematics' });
  assert.ok(math.length >= 3);
  assert.ok(math.every((l) => l.subject === 'mathematics' && l.status === 'approved'));
  const grade5 = searchCatalog(state, { grade: 5 });
  assert.ok(grade5.some((l) => l.id === MATH5));
  assert.ok(grade5.some((l) => l.id === 'book-biology-5'));
  assert.ok(!grade5.some((l) => l.id === 'book-physics-7'));
  const spot = searchCatalog(state, { query: 'spotlight' });
  assert.equal(spot.length, 1);
  assert.equal(spot[0].id, 'book-english-spotlight-5');
  const combined = searchCatalog(state, { subject: 'english', grade: 5, query: 'SPOTLIGHT' });
  assert.equal(combined.length, 1);
  assert.deepEqual(searchCatalog(state), listCatalog(state));
  assert.deepEqual(searchCatalog(state, { query: '   ' }), listCatalog(state));
  // Pending listings never surface in search even when the query matches.
  assert.ok(!searchCatalog(state, { query: 'Лабораторный практикум' }).some((l) => l.id === PENDING_LAB));
  assert.throws(() => searchCatalog(state, { subject: 'astrology' }), code('INVALID_LISTING'));
  assert.throws(() => searchCatalog(state, { grade: 0 }), code('INVALID_LISTING'));
  assert.throws(() => searchCatalog(state, { grade: 12 }), code('INVALID_LISTING'));
  assert.throws(() => searchCatalog(state, { grade: 5.5 }), code('INVALID_LISTING'));
  assert.throws(() => searchCatalog(state, { query: 42 }), code('INVALID_LISTING'));
});

test('partner upload creates a pending listing; identity/status cannot be spoofed', () => {
  const state = makeState();
  assert.throws(() => createListing(state, NEW_BOOK, READER), code('FORBIDDEN'));
  assert.throws(() => createListing(state, NEW_BOOK, MODERATOR), code('FORBIDDEN'));
  assert.throws(() => createListing(state, NEW_BOOK, { role: 'partner' }), code('INVALID_USER'));
  assert.throws(() => createListing(state, NEW_BOOK, { role: 'hacker', userId: 'x' }), code('INVALID_ROLE'));
  assert.throws(() => createListing(state, NEW_BOOK, null), code('FORBIDDEN'));

  const created = createListing(state, NEW_BOOK, PARTNER);
  assert.equal(created.id, 'id-1');
  assert.equal(created.status, 'pending');
  assert.equal(created.partnerId, 'partner-1');
  assert.equal(created.createdAt, T0);
  assert.equal(created.price, 450);
  assert.deepEqual(created.grades, [8, 8]);
  assert.ok(!listCatalog(state).some((l) => l.id === created.id), 'pending is hidden from readers');
  assert.ok(listPending(state, MODERATOR).some((l) => l.id === created.id));

  // A partner cannot self-approve, spoof another partner, or pin id/createdAt.
  const sneaky = createListing(state, { ...NEW_BOOK, id: 'hack', status: 'approved', partnerId: 'partner-2', createdAt: 1 }, PARTNER);
  assert.equal(sneaky.id, 'id-2');
  assert.equal(sneaky.status, 'pending');
  assert.equal(sneaky.partnerId, 'partner-1');
  assert.equal(sneaky.createdAt, T0);

  // Free upload is allowed (price 0).
  const free = createListing(state, { ...NEW_BOOK, price: 0 }, PARTNER);
  assert.equal(free.price, 0);
  assert.equal(free.id, 'id-3');

  const bad = [
    { ...NEW_BOOK, title: '' },
    { ...NEW_BOOK, title: '   ' },
    { ...NEW_BOOK, author: '' },
    { ...NEW_BOOK, subject: 'astrology' },
    { ...NEW_BOOK, format: 'docx' },
    { ...NEW_BOOK, price: 1.5 },
    { ...NEW_BOOK, price: -1 },
    { ...NEW_BOOK, price: MAX_PRICE + 1 },
    { ...NEW_BOOK, price: '450' },
    { ...NEW_BOOK, grades: [0, 5] },
    { ...NEW_BOOK, grades: [5, 3] },
    { ...NEW_BOOK, grades: [1, 12] },
    { ...NEW_BOOK, grades: [5] },
    { ...NEW_BOOK, grades: '5' },
    { ...NEW_BOOK, description: '' },
    { ...NEW_BOOK, license: 'pirated' },
    { ...NEW_BOOK, rightsHolder: '' },
    { ...NEW_BOOK, coverEmoji: 5 },
    { ...NEW_BOOK, sampleText: 42 },
    null,
  ];
  for (const b of bad) {
    assert.throws(() => createListing(state, b, PARTNER), code('INVALID_LISTING'), JSON.stringify(b));
  }
  assert.ok(state.audit.some((e) => e.action === 'listing_submitted' && e.details.listingId === 'id-1'));
});

test('partner edits only their own pending listing; cannot approve or reassign', () => {
  const state = makeState();
  const created = createListing(state, NEW_BOOK, PARTNER); // id-1, pending, partner-1
  const updated = updateListing(state, created.id, { price: 470, title: 'Алгебра. 8 класс. Учебник (2-е издание)' }, PARTNER);
  assert.equal(updated.price, 470);
  assert.equal(updated.title, 'Алгебра. 8 класс. Учебник (2-е издание)');
  assert.equal(updated.status, 'pending');

  // Another partner cannot touch it.
  assert.throws(() => updateListing(state, created.id, { price: 1 }, PARTNER2), code('FORBIDDEN'));
  // A seed listing owned by someone else is FORBIDDEN (ownership checked first).
  assert.throws(() => updateListing(state, MATH5, { price: 1 }, PARTNER), code('FORBIDDEN'));
  assert.throws(() => updateListing(state, 'ghost', { price: 1 }, PARTNER), code('NOT_FOUND'));

  // Once approved or rejected, the listing is locked for the partner.
  const own = createListing(state, NEW_BOOK, PARTNER); // id-2
  approveListing(state, own.id, MODERATOR);
  assert.throws(() => updateListing(state, own.id, { price: 1 }, PARTNER), code('NOT_PENDING'));
  const own2 = createListing(state, NEW_BOOK, PARTNER); // id-3
  rejectListing(state, own2.id, 'Причина', MODERATOR);
  assert.throws(() => updateListing(state, own2.id, { price: 1 }, PARTNER), code('NOT_PENDING'));

  // A patch can never change id/partnerId/status (no self-approve / reassign).
  const own3 = createListing(state, NEW_BOOK, PARTNER); // id-4
  const patched = updateListing(state, own3.id, { status: 'approved', partnerId: 'partner-2', id: 'hack', price: 460 }, PARTNER);
  assert.equal(patched.status, 'pending');
  assert.equal(patched.partnerId, 'partner-1');
  assert.equal(patched.id, own3.id);
  assert.equal(patched.price, 460);

  assert.throws(() => updateListing(state, own3.id, { price: 1.5 }, PARTNER), code('INVALID_LISTING'));
  assert.throws(() => updateListing(state, own3.id, null, PARTNER), code('INVALID_LISTING'));
  assert.throws(() => updateListing(state, own3.id, { price: 1 }, READER), code('FORBIDDEN'));
  assert.throws(() => updateListing(state, own3.id, { price: 1 }, MODERATOR), code('FORBIDDEN'));
});

test('moderator approves pending listings; others cannot; non-pending rejected', () => {
  const state = makeState();
  assert.throws(() => approveListing(state, PENDING_LAB, PARTNER), code('FORBIDDEN'));
  assert.throws(() => approveListing(state, PENDING_LAB, READER), code('FORBIDDEN'));
  assert.throws(() => approveListing(state, 'ghost', MODERATOR), code('NOT_FOUND'));
  const approved = approveListing(state, PENDING_LAB, MODERATOR);
  assert.equal(approved.status, 'approved');
  assert.ok(listCatalog(state).some((l) => l.id === PENDING_LAB));
  assert.throws(() => approveListing(state, PENDING_LAB, MODERATOR), code('NOT_PENDING'));
  // A rejected listing cannot be approved directly (must be pending).
  assert.throws(() => approveListing(state, REJECTED_GDZ, MODERATOR), code('NOT_PENDING'));
  // Bare 'moderator' string and a moderator object without userId both work.
  assert.equal(approveListing(state, PENDING_WORKBOOK, 'moderator').status, 'approved');
  const p = createListing(state, NEW_BOOK, PARTNER);
  assert.equal(approveListing(state, p.id, { role: 'moderator' }).status, 'approved');
  assert.ok(state.audit.some((e) => e.action === 'listing_approved' && e.details.listingId === PENDING_LAB));
});

test('moderator rejects with a mandatory reason; others cannot', () => {
  const state = makeState();
  assert.throws(() => rejectListing(state, PENDING_LAB, '', MODERATOR), code('REASON_REQUIRED'));
  assert.throws(() => rejectListing(state, PENDING_LAB, '   ', MODERATOR), code('REASON_REQUIRED'));
  assert.throws(() => rejectListing(state, PENDING_LAB, undefined, MODERATOR), code('REASON_REQUIRED'));
  assert.throws(() => rejectListing(state, PENDING_LAB, 42, MODERATOR), code('REASON_REQUIRED'));
  assert.throws(() => rejectListing(state, PENDING_LAB, 'Причина', PARTNER), code('FORBIDDEN'));
  assert.throws(() => rejectListing(state, PENDING_LAB, 'Причина', READER), code('FORBIDDEN'));
  assert.throws(() => rejectListing(state, 'ghost', 'Причина', MODERATOR), code('NOT_FOUND'));
  const rejected = rejectListing(state, PENDING_LAB, '  Недостаточно описания  ', MODERATOR);
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.rejectReason, 'Недостаточно описания');
  assert.ok(!listCatalog(state).some((l) => l.id === PENDING_LAB));
  assert.throws(() => rejectListing(state, PENDING_LAB, 'Ещё', MODERATOR), code('NOT_PENDING'));
  assert.throws(() => rejectListing(state, MATH5, 'Причина', MODERATOR), code('NOT_PENDING'));
  assert.ok(state.audit.some((e) => e.action === 'listing_rejected' && e.details.reason === 'Недостаточно описания'));
});

test('listPending is moderator-only and returns clones', () => {
  const state = makeState();
  const pending = listPending(state, MODERATOR);
  assert.equal(pending.length, 2);
  assert.ok(pending.every((l) => l.status === 'pending'));
  assert.throws(() => listPending(state, READER), code('FORBIDDEN'));
  assert.throws(() => listPending(state, PARTNER), code('FORBIDDEN'));
  assert.throws(() => listPending(state, 'reader'), code('FORBIDDEN'));
  assert.throws(() => listPending(state, null), code('FORBIDDEN'));
  // Moderator identity is optional for management reads.
  assert.equal(listPending(state, 'moderator').length, 2);
  assert.equal(listPending(state, { role: 'moderator' }).length, 2);
  pending[0].title = 'Подмена';
  assert.notEqual(listPending(state, MODERATOR)[0].title, 'Подмена');
});

test('buyListing creates an immutable order snapshot and adds to the library', () => {
  const state = makeState();
  const order = buyListing(state, MATH5, READER);
  assert.equal(order.id, 'id-1');
  assert.equal(order.schoolId, 'school-42');
  assert.equal(order.userId, 'reader-1');
  assert.equal(order.listingId, MATH5);
  assert.equal(order.title, 'Математика. 5 класс. Учебник');
  assert.equal(order.author, 'Н. Я. Виленкин, В. И. Жохов');
  assert.equal(order.subject, 'mathematics');
  assert.deepEqual(order.grades, [5, 5]);
  assert.equal(order.format, 'pdf');
  assert.equal(order.price, 499);
  assert.equal(order.free, false);
  assert.equal(order.createdAt, T0);
  assert.equal(state.orders.length, 1);

  const lib = listLibrary(state, 'reader-1');
  assert.equal(lib.length, 1);
  assert.equal(lib[0].listingId, MATH5);
  assert.equal(lib[0].orderId, 'id-1');
  assert.equal(lib[0].title, 'Математика. 5 класс. Учебник');
  assert.equal(lib[0].price, 499);
  assert.equal(lib[0].purchasedAt, T0);
  assert.ok(hasBook(state, 'reader-1', MATH5));
  assert.ok(!hasBook(state, 'reader-2', MATH5));
  assert.ok(state.audit.some((e) => e.action === 'book_purchased' && e.details.orderId === 'id-1' && e.details.price === 499));

  // The returned order is a clone — tampering cannot alter the store.
  order.title = 'Подмена';
  order.grades[0] = 1;
  assert.equal(state.orders[0].title, 'Математика. 5 класс. Учебник');
  assert.deepEqual(state.orders[0].grades, [5, 5]);
});

test('buyListing rejects unapproved/unknown listings and bad identity (no partial state)', () => {
  const state = makeState();
  assert.throws(() => buyListing(state, PENDING_LAB, READER), code('NOT_APPROVED'));
  assert.throws(() => buyListing(state, REJECTED_GDZ, READER), code('NOT_APPROVED'));
  assert.throws(() => buyListing(state, 'ghost', READER), code('NOT_FOUND'));
  assert.throws(() => buyListing(state, MATH5, { role: 'reader' }), code('INVALID_USER'));
  assert.throws(() => buyListing(state, MATH5, { role: 'hacker', userId: 'x' }), code('INVALID_ROLE'));
  assert.throws(() => buyListing(state, MATH5, null), code('FORBIDDEN'));
  assert.throws(() => buyListing(state, MATH5, 'reader'), code('FORBIDDEN'));
  assert.throws(() => buyListing(state, MATH5, 'moderator'), code('INVALID_USER')); // bare string carries no identity
  assert.equal(state.orders.length, 0, 'no partial order on rejection');
  assert.deepEqual(listLibrary(state, 'reader-1'), []);
  assert.equal(state.audit.length, 0);
});

test('free books skip payment (price 0, free flag) and still enter the library', () => {
  const state = makeState();
  const order = buyListing(state, FREE_TALES, READER);
  assert.equal(order.price, 0);
  assert.equal(order.free, true);
  assert.equal(order.title, 'Волшебный мир сказок');
  const lib = listLibrary(state, 'reader-1');
  assert.equal(lib.length, 1);
  assert.equal(lib[0].price, 0);
  const evt = state.audit.find((e) => e.action === 'book_purchased');
  assert.equal(evt.details.price, 0);
  assert.equal(evt.details.free, true);
  assert.equal(formatPrice(0), 'Бесплатно');
});

test('re-buying an owned book is idempotent: ALREADY_OWNED, no double charge or duplicate', () => {
  const state = makeState();
  buyListing(state, MATH5, READER);
  assert.throws(() => buyListing(state, MATH5, READER), code('ALREADY_OWNED'));
  assert.equal(state.orders.length, 1, 'no second order/charge');
  assert.equal(listLibrary(state, 'reader-1').length, 1, 'no duplicate library entry');
  assert.equal(state.audit.filter((e) => e.action === 'book_purchased').length, 1);
  // A different user may still buy the same listing.
  const order2 = buyListing(state, MATH5, READER2);
  assert.equal(order2.id, 'id-2');
  assert.equal(state.orders.length, 2);
  assert.equal(listLibrary(state, 'reader-2').length, 1);
  assert.equal(listLibrary(state, 'reader-1').length, 1);
});

test('library and orders are scoped: a reader sees only their own (security)', () => {
  const state = makeState();
  buyListing(state, MATH5, READER);
  buyListing(state, FREE_TALES, READER2);
  assert.deepEqual(listLibrary(state, 'reader-1').map((b) => b.listingId), [MATH5]);
  assert.deepEqual(listLibrary(state, 'reader-2').map((b) => b.listingId), [FREE_TALES]);
  assert.deepEqual(listLibrary(state, 'nobody'), []);
  assert.throws(() => listLibrary(state, ''), code('INVALID_USER'));
  assert.throws(() => listLibrary(state, null), code('INVALID_USER'));
  // Library entries are clones.
  const mine = listLibrary(state, 'reader-1');
  mine[0].title = 'Подмена';
  mine[0].grades[0] = 1;
  assert.equal(listLibrary(state, 'reader-1')[0].title, 'Математика. 5 класс. Учебник');
  assert.deepEqual(listLibrary(state, 'reader-1')[0].grades, [5, 5]);
  // Orders: reader/partner see only their own; moderator sees all.
  assert.deepEqual(listOrders(state, READER).map((o) => o.userId), ['reader-1']);
  assert.deepEqual(listOrders(state, READER2).map((o) => o.userId), ['reader-2']);
  assert.equal(listOrders(state, MODERATOR).length, 2);
  assert.equal(listOrders(state, 'moderator').length, 2);
  assert.throws(() => listOrders(state, { role: 'reader' }), code('INVALID_USER'));
  assert.throws(() => listOrders(state, { role: 'hacker', userId: 'reader-1' }), code('INVALID_ROLE'));
});

test('order/library snapshots survive later catalog edits (immutable history)', () => {
  const state = makeState();
  buyListing(state, MATH5, READER);
  // Simulate a catalog change via rehydration with an edited listing.
  const data = JSON.parse(JSON.stringify(serializeBookstore(state)));
  const target = data.listings.find((l) => l.id === MATH5);
  target.title = 'Подмененное название';
  target.price = 1;
  const restored = createBookstore({ ...data, clock: () => T0, nextId: () => 'id-x' });
  const [order] = listOrders(restored, MODERATOR);
  assert.equal(order.title, 'Математика. 5 класс. Учебник', 'historical title never changes');
  assert.equal(order.price, 499, 'historical price never changes');
  const [lib] = listLibrary(restored, 'reader-1');
  assert.equal(lib.title, 'Математика. 5 класс. Учебник');
  assert.equal(lib.price, 499);
  // The live catalog, however, reflects the edit.
  assert.equal(listCatalog(restored).find((l) => l.id === MATH5).price, 1);
});

test('serializeBookstore round-trips through JSON for persistence', () => {
  const state = makeState();
  const created = createListing(state, NEW_BOOK, PARTNER); // id-1
  approveListing(state, created.id, MODERATOR);
  buyListing(state, created.id, READER);   // order id-2
  buyListing(state, FREE_TALES, READER2);  // order id-3
  rejectListing(state, PENDING_LAB, 'Не полное описание', MODERATOR);

  const snapshot = serializeBookstore(state);
  assert.deepEqual(Object.keys(snapshot).sort(), ['audit', 'enabled', 'library', 'listings', 'orders', 'schoolId']);
  assert.equal(snapshot.clock, undefined, 'no functions in the snapshot');
  const json = JSON.stringify(snapshot); // must not throw on functions
  const data = JSON.parse(json);
  let n = 100;
  const restored = createBookstore({ ...data, clock: () => T0, nextId: () => `id-${++n}` });
  assert.deepEqual(serializeBookstore(restored), snapshot, 'full round-trip equality');
  assert.equal(restored.schoolId, 'school-42');
  assert.equal(restored.enabled, true);
  assert.equal(listLibrary(restored, 'reader-1').length, 1);
  assert.equal(listOrders(restored, MODERATOR).length, 2);

  // The restored store keeps working with freshly injected id/clock.
  const next = createListing(restored, NEW_BOOK, PARTNER2);
  assert.equal(next.id, 'id-101');
  assert.equal(next.createdAt, T0);
  const order = buyListing(restored, MATH5, READER); // reader-1 does not own MATH5 yet
  assert.equal(order.id, 'id-102');
  assert.equal(order.price, 499);

  // The snapshot itself is a clone — mutating it cannot affect the live store.
  snapshot.listings[0].price = 1;
  assert.notEqual(state.listings[0].price, 1);
});

test('audit log records domain events with the injected clock and actor', () => {
  const state = makeState();
  const created = createListing(state, NEW_BOOK, PARTNER);
  approveListing(state, created.id, MODERATOR);
  rejectListing(state, PENDING_LAB, 'Дубликат', MODERATOR);
  buyListing(state, MATH5, READER);
  const actions = state.audit.map((e) => e.action);
  for (const expected of ['listing_submitted', 'listing_approved', 'listing_rejected', 'book_purchased']) {
    assert.ok(actions.includes(expected), `audit contains ${expected}`);
  }
  assert.ok(state.audit.every((e) => e.at === T0), 'every entry uses the injected clock');
  const submitted = state.audit.find((e) => e.action === 'listing_submitted');
  assert.equal(submitted.actorRole, 'partner');
  assert.equal(submitted.actorId, 'partner-1');
  const approvedEvt = state.audit.find((e) => e.action === 'listing_approved');
  assert.equal(approvedEvt.actorRole, 'moderator');
  assert.equal(approvedEvt.actorId, 'mod-1');
  const rejectedEvt = state.audit.find((e) => e.action === 'listing_rejected');
  assert.equal(rejectedEvt.details.reason, 'Дубликат');
  const purchased = state.audit.find((e) => e.action === 'book_purchased');
  assert.equal(purchased.actorRole, 'reader');
  assert.equal(purchased.actorId, 'reader-1');
  assert.equal(purchased.details.price, 499);
  assert.equal(purchased.details.free, false);
});

test('audit log is bounded to 500 entries (oldest dropped)', () => {
  const state = makeState();
  for (let i = 0; i < 505; i++) createListing(state, NEW_BOOK, PARTNER);
  assert.equal(state.audit.length, 500);
  assert.equal(state.audit[499].details.listingId, 'id-505', 'newest kept');
  assert.equal(state.audit[0].details.listingId, 'id-6', 'oldest five dropped');
  assert.equal(state.listings.length, SAMPLE_CATALOG.length + 505);
});

test('disabled store rejects uploads/purchases but keeps reads and moderation', () => {
  const state = makeState({ enabled: false });
  assert.throws(() => createListing(state, NEW_BOOK, PARTNER), code('DISABLED'));
  assert.throws(() => buyListing(state, MATH5, READER), code('DISABLED'));
  assert.throws(() => updateListing(state, PENDING_LAB, { price: 100 }, PARTNER), code('DISABLED'));
  // Reads still work so the UI can render an "opening soon" catalog.
  assert.ok(listCatalog(state).length > 0);
  assert.equal(listPending(state, MODERATOR).length, 2);
  assert.deepEqual(listLibrary(state, 'reader-1'), []);
  // Moderation is management and stays available (mirrors the buffet pattern).
  approveListing(state, PENDING_LAB, MODERATOR);
  assert.ok(listCatalog(state).some((l) => l.id === PENDING_LAB));
});

test('listMyListings is partner-scoped (a partner sees only their own listings)', () => {
  const state = makeState();
  createListing(state, NEW_BOOK, PARTNER);
  createListing(state, NEW_BOOK, PARTNER);
  createListing(state, NEW_BOOK, PARTNER2);
  assert.equal(listMyListings(state, PARTNER).length, 2);
  assert.equal(listMyListings(state, PARTNER2).length, 1);
  assert.ok(listMyListings(state, PARTNER).every((l) => l.partnerId === 'partner-1'));
  // A seeded publisher account sees its own seed listings (incl. pending).
  const seedPartner = { role: 'partner', userId: 'partner-prosveshcheniye' };
  assert.ok(listMyListings(state, seedPartner).length >= 5);
  assert.ok(listMyListings(state, seedPartner).some((l) => l.id === PENDING_WORKBOOK));
  assert.throws(() => listMyListings(state, READER), code('FORBIDDEN'));
  assert.throws(() => listMyListings(state, MODERATOR), code('FORBIDDEN'));
  assert.throws(() => listMyListings(state, { role: 'partner' }), code('INVALID_USER'));
});

test('error class, constants and formatter are exposed for UI wiring', () => {
  assert.deepEqual(ROLES, ['reader', 'partner', 'moderator']);
  assert.deepEqual(LISTING_STATUSES, ['pending', 'approved', 'rejected']);
  assert.equal(MAX_PRICE, 100000);
  assert.equal(MIN_GRADE, 1);
  assert.equal(MAX_GRADE, 11);
  for (const [c, msg] of Object.entries(BOOKSTORE_ERROR_MESSAGES)) {
    assert.ok(typeof msg === 'string' && msg.length > 0, `message for ${c}`);
    assert.match(msg, /[А-Яа-яЁё]/, `Russian message for ${c}`);
  }
  const err = new BookstoreError('NOT_FOUND', { listingId: 'x' });
  assert.ok(err instanceof Error);
  assert.equal(err.name, 'BookstoreError');
  assert.equal(err.code, 'NOT_FOUND');
  assert.equal(err.message, BOOKSTORE_ERROR_MESSAGES.NOT_FOUND);
  assert.deepEqual(err.details, { listingId: 'x' });
  assert.equal(new BookstoreError('UNKNOWN_CODE').message, 'UNKNOWN_CODE', 'unknown code falls back to itself');
  assert.equal(formatPrice(499), '499 ₽');
  assert.equal(formatPrice(0), 'Бесплатно');
});