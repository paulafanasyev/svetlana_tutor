// Deterministic node:test suite for the partner school-goods marketplace.
// Run from apps/web:  node --test src/features/marketplace/marketplace.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMarketplace, serializeMarketplace, getCatalog, getListing, getCart, cartTotal,
  addToCart, setQuantity, removeFromCart, formatPrice, placeOrder, advanceOrder,
  cancelOrder, listOrders, createListing, updateListing, restockListing, listMyListings,
  approveListing, rejectListing, listPending, listAllListings,
  MarketplaceError, ROLES, LISTING_STATUSES, ORDER_STATUSES, MAX_QUANTITY, MARKETPLACE_ERROR_MESSAGES,
} from './marketplace.js';
import { SAMPLE_GOODS, GOODS_CATEGORIES } from './catalog.js';

const T0 = 1700000000000;
const MOD = { role: 'moderator', userId: 'mod-1' };
const PARTNER = { role: 'partner', userId: 'partner-forma' };   // owns the uniform seed listings
const PARTNER2 = { role: 'partner', userId: 'partner-kanc' };    // owns the stationery seed listings
const BUYER = { role: 'buyer', userId: 'buyer-1' };
const BUYER2 = { role: 'buyer', userId: 'buyer-2' };

const BLAZER = 'uniform-blazer';        // 2499 ₽, stock 40, approved, partner-forma
const NOTEBOOK = 'stat-notebook-48';    // 399 ₽, stock 200, approved, partner-kanc
const JUMPER = 'uniform-jumper';        // 1099 ₽, stock 0 (out of stock), approved
const VEST = 'uniform-vest-new';        // pending, partner-forma
const GLUE = 'stat-glue-set';           // pending, partner-kanc
const PHONECASE = 'acc-phone-case';     // rejected

function makeState(opts = {}) {
  let n = 0;
  return createMarketplace({ enabled: true, schoolId: 'school-42', clock: () => T0, nextId: () => `mp-${++n}`, ...opts });
}
const code = (c) => (e) => e instanceof MarketplaceError && e.code === c;
const stockOf = (state, id) => state.listings.find((l) => l.id === id).stock;

test('createMarketplace builds an isolated store seeded with a deep copy of the catalog', () => {
  const state = makeState();
  assert.equal(state.schoolId, 'school-42');
  assert.equal(state.enabled, true);
  assert.deepEqual(state.orders, []);
  assert.deepEqual(state.cart, {});
  assert.equal(state.listings.length, SAMPLE_GOODS.length);
  assert.notEqual(state.listings, SAMPLE_GOODS);
  state.listings[0].price = 1;
  assert.equal(SAMPLE_GOODS[0].price, 2499);
  assert.throws(() => createMarketplace({ schoolId: '' }), code('INVALID_SCHOOL'));
  assert.throws(() => createMarketplace({}), code('INVALID_SCHOOL'));
});

test('seeded catalog is realistic, school-safe and uses integer ruble prices', () => {
  const ids = SAMPLE_GOODS.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(SAMPLE_GOODS.length >= 24, 'a real marketplace has a broad assortment');
  const cats = GOODS_CATEGORIES.map((c) => c.id);
  for (const g of SAMPLE_GOODS) {
    assert.match(g.name, /[А-Яа-яЁё]/, `Russian name: ${g.id}`);
    assert.ok(Number.isInteger(g.price) && g.price >= 0 && g.price <= 100000, `integer ruble price: ${g.id}`);
    assert.ok(Number.isInteger(g.stock) && g.stock >= 0, `integer stock: ${g.id}`);
    assert.ok(cats.includes(g.category), `known category: ${g.id}`);
    assert.ok(LISTING_STATUSES.includes(g.status), `valid status: ${g.id}`);
    assert.doesNotMatch(g.name, /алкогол|пиво|вин[оа]|водк|табак|сигарет|энергет|оружи|пистолет|нож боевой/i, `school-safe: ${g.id}`);
  }
  assert.ok(cats.every((c) => SAMPLE_GOODS.some((g) => g.category === c)), 'every category represented');
  assert.ok(SAMPLE_GOODS.some((g) => g.status === 'pending'), 'seed has a moderation queue');
  assert.ok(SAMPLE_GOODS.some((g) => g.status === 'rejected'), 'seed has a rejected listing');
  assert.ok(SAMPLE_GOODS.some((g) => g.stock === 0), 'seed has an out-of-stock item');
});

test('getCatalog shows only approved listings, filters by category/query, returns clones', () => {
  const state = makeState();
  const all = getCatalog(state);
  assert.ok(all.every((g) => g.status === 'approved'));
  assert.ok(!all.some((g) => g.id === VEST || g.id === GLUE || g.id === PHONECASE));
  assert.ok(all.some((g) => g.id === JUMPER), 'out-of-stock stays visible');
  const uniform = getCatalog(state, { category: 'uniform' });
  assert.ok(uniform.every((g) => g.category === 'uniform'));
  const search = getCatalog(state, { query: 'рюкзак' });
  assert.ok(search.some((g) => g.id === 'acc-backpack'));
  assert.equal(getCatalog(state, { query: 'нет-такого-товара' }).length, 0);
  all[0].price = 1;
  assert.equal(state.listings.find((l) => l.id === all[0].id).price, SAMPLE_GOODS.find((g) => g.id === all[0].id).price);
});

test('getListing returns an approved clone; pending/unknown are rejected', () => {
  const state = makeState();
  const l = getListing(state, BLAZER);
  assert.equal(l.price, 2499);
  l.stock = 0;
  assert.equal(stockOf(state, BLAZER), 40, 'clone cannot mutate store');
  assert.throws(() => getListing(state, VEST), code('NOT_APPROVED'));
  assert.throws(() => getListing(state, 'ghost'), code('NOT_FOUND'));
});

test('cart totals are exact integer rubles across add/set/remove', () => {
  const state = makeState();
  assert.equal(cartTotal(state), 0);
  addToCart(state, BLAZER, 2);     // 4998
  addToCart(state, NOTEBOOK, 3);   // 1197
  assert.equal(cartTotal(state), 6195);
  assert.ok(Number.isInteger(cartTotal(state)));
  const lines = getCart(state);
  assert.equal(lines.find((l) => l.itemId === BLAZER).lineTotal, 4998);
  addToCart(state, BLAZER, 1);     // 3 × 2499
  assert.equal(state.cart[BLAZER], 3);
  setQuantity(state, NOTEBOOK, 1);
  assert.equal(cartTotal(state), 3 * 2499 + 399);
  removeFromCart(state, NOTEBOOK);
  assert.equal(cartTotal(state), 3 * 2499);
  removeFromCart(state, NOTEBOOK); // idempotent
  assert.equal(cartTotal(state), 3 * 2499);
  assert.equal(formatPrice(2499), '2499 ₽');
});

test('quantity validation rejects zero, negatives, fractions, non-numbers and overflow', () => {
  const state = makeState();
  for (const qty of [0, -1, 1.5, NaN, Infinity, '2', null, MAX_QUANTITY + 1]) {
    assert.throws(() => addToCart(state, NOTEBOOK, qty), code('INVALID_QUANTITY'), `add qty=${qty}`);
    assert.throws(() => setQuantity(state, NOTEBOOK, qty), code('INVALID_QUANTITY'), `set qty=${qty}`);
  }
  addToCart(state, NOTEBOOK);
  assert.equal(state.cart[NOTEBOOK], 1);
  addToCart(state, NOTEBOOK, MAX_QUANTITY - 1);
  assert.equal(state.cart[NOTEBOOK], MAX_QUANTITY);
  assert.throws(() => addToCart(state, NOTEBOOK, 1), code('INVALID_QUANTITY'));
});

test('cart is stock-limited and rejects out-of-stock, pending and unknown items', () => {
  const state = makeState();
  assert.throws(() => addToCart(state, JUMPER, 1), code('OUT_OF_STOCK'));   // stock 0
  assert.throws(() => addToCart(state, VEST, 1), code('NOT_APPROVED'));      // pending
  assert.throws(() => addToCart(state, 'ghost', 1), code('NOT_FOUND'));
  assert.throws(() => addToCart(state, BLAZER, 41), code('OUT_OF_STOCK'));   // stock 40
  addToCart(state, BLAZER, 40);
  assert.throws(() => addToCart(state, BLAZER, 1), code('OUT_OF_STOCK'));    // cumulative cap
  assert.throws(() => setQuantity(state, BLAZER, 41), code('OUT_OF_STOCK'));
  // Partner restocks → more becomes orderable.
  restockListing(state, BLAZER, 60, PARTNER);
  addToCart(state, BLAZER, 5);
  assert.equal(state.cart[BLAZER], 45);
});

test('disabled marketplace rejects ordering', () => {
  const state = makeState({ enabled: false });
  assert.throws(() => addToCart(state, BLAZER, 1), code('DISABLED'));
  assert.throws(() => placeOrder(state, BUYER), code('DISABLED'));
  assert.equal(getCatalog(state).length, SAMPLE_GOODS.filter((g) => g.status === 'approved').length);
});

test('placeOrder creates a snapshot, decrements stock atomically and clears the cart', () => {
  const state = makeState();
  addToCart(state, BLAZER, 2);
  addToCart(state, NOTEBOOK, 3);
  const order = placeOrder(state, BUYER);
  assert.equal(order.id, 'mp-1');
  assert.equal(order.userId, 'buyer-1');
  assert.equal(order.status, 'new');
  assert.equal(order.total, 2 * 2499 + 3 * 399);
  assert.equal(order.createdAt, T0);
  assert.deepEqual(order.history, [{ status: 'new', at: T0, by: 'buyer-1' }]);
  assert.equal(stockOf(state, BLAZER), 38);
  assert.equal(stockOf(state, NOTEBOOK), 197);
  assert.deepEqual(state.cart, {});
  assert.equal(cartTotal(state), 0);
  const line = order.items.find((l) => l.itemId === BLAZER);
  assert.equal(line.name, 'Блейзер школьный синий');
  assert.equal(line.price, 2499);
  assert.equal(line.partnerId, 'partner-forma');
  assert.ok(state.audit.some((e) => e.action === 'order_placed' && e.details.orderId === 'mp-1'));
  addToCart(state, NOTEBOOK, 1);
  assert.equal(placeOrder(state, BUYER).id, 'mp-2');
});

test('placeOrder rejects empty cart, bad identity and insufficient stock without partial changes', () => {
  const state = makeState();
  assert.throws(() => placeOrder(state, BUYER), code('EMPTY_CART'));
  addToCart(state, BLAZER, 1);
  assert.throws(() => placeOrder(state, { role: 'buyer' }), code('INVALID_USER'));
  assert.throws(() => placeOrder(state, { userId: 'x', role: 'hacker' }), code('INVALID_ROLE'));
  // Simulate a concurrent purchase shrinking stock below the cart quantity.
  addToCart(state, NOTEBOOK, 5);
  state.listings.find((l) => l.id === BLAZER).stock = 0;
  assert.throws(() => placeOrder(state, BUYER), code('OUT_OF_STOCK'));
  assert.equal(stockOf(state, NOTEBOOK), 200, 'no partial stock decrement on rejection');
  assert.equal(state.orders.length, 0);
  assert.equal(state.cart[NOTEBOOK], 5, 'cart preserved on rejection');
});

test('order snapshot is immutable against later price edits', () => {
  const state = makeState();
  addToCart(state, BLAZER, 1);
  const order = placeOrder(state, BUYER);
  restockListing(state, BLAZER, 50, PARTNER);
  state.listings.find((l) => l.id === BLAZER).price = 9999;
  const [stored] = listOrders(state, MOD);
  assert.equal(stored.id, order.id);
  assert.equal(stored.total, 2499);
  assert.equal(stored.items[0].price, 2499);
});

test('moderator fulfillment flow: new → confirmed → shipped → completed; invalid transitions rejected', () => {
  const state = makeState();
  addToCart(state, BLAZER, 1);
  const order = placeOrder(state, BUYER);
  let cur = advanceOrder(state, order.id, MOD);
  assert.equal(cur.status, 'confirmed');
  assert.equal(cur.history[1].by, 'mod-1');
  cur = advanceOrder(state, order.id, MOD);
  assert.equal(cur.status, 'shipped');
  cur = advanceOrder(state, order.id, MOD);
  assert.equal(cur.status, 'completed');
  assert.equal(cur.history.length, 4);
  assert.throws(() => advanceOrder(state, order.id, MOD), code('INVALID_TRANSITION'));
  assert.throws(() => advanceOrder(state, order.id, BUYER), code('FORBIDDEN'));
  assert.throws(() => advanceOrder(state, order.id, PARTNER), code('FORBIDDEN'));
  assert.throws(() => advanceOrder(state, 'ghost', MOD), code('ORDER_NOT_FOUND'));
});

test('cancel rules: owner or moderator before shipping, restocks items', () => {
  const state = makeState();
  addToCart(state, BLAZER, 2);
  const a = placeOrder(state, BUYER);
  assert.equal(stockOf(state, BLAZER), 38);
  addToCart(state, NOTEBOOK, 1);
  const b = placeOrder(state, BUYER);
  addToCart(state, BLAZER, 1);
  const c = placeOrder(state, BUYER2);

  // Owner cancels a new order → its 2 units return (37 after order c → 39).
  assert.equal(cancelOrder(state, a.id, BUYER).status, 'cancelled');
  assert.equal(stockOf(state, BLAZER), 39);
  // Owner cancels a confirmed order.
  advanceOrder(state, b.id, MOD);
  assert.equal(cancelOrder(state, b.id, BUYER).status, 'cancelled');
  assert.equal(stockOf(state, NOTEBOOK), 200);
  // Moderator cancels another user's order (bare role string).
  assert.equal(cancelOrder(state, c.id, 'moderator').status, 'cancelled');

  // A different buyer cannot cancel someone else's order.
  addToCart(state, BLAZER, 1);
  const d = placeOrder(state, BUYER);
  assert.throws(() => cancelOrder(state, d.id, BUYER2), code('FORBIDDEN'));
  assert.throws(() => cancelOrder(state, d.id, 'buyer'), code('FORBIDDEN')); // bare non-mod has no identity
  // Once shipped, cancellation is impossible (and no restock).
  advanceOrder(state, d.id, MOD);
  advanceOrder(state, d.id, MOD); // shipped
  const before = stockOf(state, BLAZER);
  assert.throws(() => cancelOrder(state, d.id, BUYER), code('ORDER_NOT_CANCELABLE'));
  assert.throws(() => cancelOrder(state, d.id, 'moderator'), code('ORDER_NOT_CANCELABLE'));
  assert.equal(stockOf(state, BLAZER), before);
  assert.throws(() => cancelOrder(state, a.id, BUYER), code('ORDER_NOT_CANCELABLE')); // already cancelled
  assert.throws(() => cancelOrder(state, 'ghost', MOD), code('ORDER_NOT_FOUND'));
  assert.throws(() => advanceOrder(state, a.id, MOD), code('INVALID_TRANSITION')); // cancelled cannot advance
});

test('listOrders scoping: moderator sees all, buyers see only their own (security)', () => {
  const state = makeState();
  addToCart(state, BLAZER, 1);
  const oa = placeOrder(state, BUYER);
  addToCart(state, NOTEBOOK, 1);
  const ob = placeOrder(state, BUYER2);
  assert.deepEqual(listOrders(state, BUYER).map((o) => o.id), [oa.id]);
  assert.deepEqual(listOrders(state, BUYER2).map((o) => o.id), [ob.id]);
  assert.deepEqual(listOrders(state, MOD).map((o) => o.id), [oa.id, ob.id]);
  assert.throws(() => listOrders(state, { role: 'buyer' }), code('INVALID_USER'));
  assert.throws(() => listOrders(state, { role: 'hacker', userId: 'buyer-1' }), code('INVALID_ROLE'));
  const mine = listOrders(state, BUYER);
  mine[0].total = 1;
  assert.equal(listOrders(state, BUYER)[0].total, 2499, 'results are clones');
});

test('partner submits a pending listing; duplicate/invalid/non-partner are rejected', () => {
  const state = makeState();
  const raw = { id: 'uniform-skirt', name: 'Юбка школьная серая', category: 'uniform', price: 1199, stock: 15, brand: 'Школьный стиль', sizes: ['134', '140'] };
  assert.throws(() => createListing(state, raw, BUYER), code('FORBIDDEN'));
  assert.throws(() => createListing(state, raw, MOD), code('FORBIDDEN'));
  const created = createListing(state, raw, PARTNER);
  assert.equal(created.status, 'pending');
  assert.equal(created.partnerId, 'partner-forma');
  assert.equal(created.createdAt, T0);
  assert.ok(!getCatalog(state).some((g) => g.id === 'uniform-skirt'), 'pending is hidden from buyers');
  assert.ok(listPending(state, MOD).some((g) => g.id === 'uniform-skirt'));
  assert.throws(() => createListing(state, raw, PARTNER), code('INVALID_LISTING')); // duplicate id
  assert.throws(() => createListing(state, { ...raw, id: 'x', price: 10.5 }, PARTNER), code('INVALID_LISTING'));
  assert.throws(() => createListing(state, { ...raw, id: 'x', category: 'weapons' }, PARTNER), code('INVALID_LISTING'));
  assert.throws(() => createListing(state, { ...raw, id: 'x', name: '  ' }, PARTNER), code('INVALID_LISTING'));
});

test('partner edits only their own pending listing', () => {
  const state = makeState();
  const updated = updateListing(state, VEST, { price: 1499, stock: 25 }, PARTNER);
  assert.equal(updated.price, 1499);
  assert.equal(updated.stock, 25);
  assert.equal(updated.status, 'pending');
  assert.throws(() => updateListing(state, VEST, { price: 1 }, PARTNER2), code('FORBIDDEN')); // not owner
  assert.throws(() => updateListing(state, BLAZER, { price: 1 }, PARTNER), code('FORBIDDEN')); // approved, not pending
  assert.throws(() => updateListing(state, VEST, { price: 1 }, BUYER), code('FORBIDDEN'));
});

test('partner restocks only their own listing with a valid integer stock', () => {
  const state = makeState();
  assert.equal(restockListing(state, JUMPER, 30, PARTNER).stock, 30);
  assert.throws(() => restockListing(state, JUMPER, 5, PARTNER2), code('FORBIDDEN'));
  assert.throws(() => restockListing(state, JUMPER, -1, PARTNER), code('INVALID_STOCK'));
  assert.throws(() => restockListing(state, JUMPER, 1.5, PARTNER), code('INVALID_STOCK'));
  assert.throws(() => restockListing(state, JUMPER, 5, BUYER), code('FORBIDDEN'));
});

test('listMyListings is scoped to the partner', () => {
  const state = makeState();
  const mine = listMyListings(state, PARTNER);
  assert.ok(mine.every((l) => l.partnerId === 'partner-forma'));
  assert.ok(mine.some((l) => l.id === VEST));
  assert.ok(!mine.some((l) => l.id === NOTEBOOK));
  assert.throws(() => listMyListings(state, BUYER), code('FORBIDDEN'));
});

test('moderation: approve/reject pending only, reason required, moderator-only', () => {
  const state = makeState();
  assert.throws(() => approveListing(state, VEST, BUYER), code('FORBIDDEN'));
  assert.throws(() => approveListing(state, VEST, PARTNER), code('FORBIDDEN'));
  assert.equal(approveListing(state, VEST, MOD).status, 'approved');
  assert.ok(getCatalog(state).some((g) => g.id === VEST));
  assert.throws(() => approveListing(state, VEST, MOD), code('INVALID_STATUS')); // already approved
  assert.throws(() => rejectListing(state, GLUE, '', MOD), code('REASON_REQUIRED'));
  assert.throws(() => rejectListing(state, GLUE, '   ', MOD), code('REASON_REQUIRED'));
  const rejected = rejectListing(state, GLUE, 'Не соответствует ассортименту', MOD);
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.rejectReason, 'Не соответствует ассортименту');
  assert.ok(!getCatalog(state).some((g) => g.id === GLUE));
  assert.throws(() => rejectListing(state, BLAZER, 'причина', MOD), code('INVALID_STATUS')); // approved, not pending
  assert.throws(() => listPending(state, BUYER), code('FORBIDDEN'));
  assert.throws(() => listAllListings(state, PARTNER), code('FORBIDDEN'));
  assert.equal(listAllListings(state, MOD).length, SAMPLE_GOODS.length);
});

test('serializeMarketplace round-trips through JSON', () => {
  const state = makeState();
  addToCart(state, BLAZER, 1);
  placeOrder(state, BUYER);
  addToCart(state, NOTEBOOK, 2); // leave a non-empty cart
  approveListing(state, VEST, MOD);
  const data = JSON.parse(JSON.stringify(serializeMarketplace(state)));
  let n = 100;
  const restored = createMarketplace({ ...data, clock: () => T0, nextId: () => `mp-${++n}` });
  assert.equal(restored.schoolId, 'school-42');
  assert.deepEqual(restored.cart, { [NOTEBOOK]: 2 });
  assert.equal(cartTotal(restored), 798);
  assert.equal(listOrders(restored, MOD).length, 1);
  assert.equal(stockOf(restored, BLAZER), 39);
  assert.ok(getCatalog(restored).some((g) => g.id === VEST));
  assert.equal(placeOrder(restored, BUYER).id, 'mp-101');
});

test('audit log records domain events with the injected clock and actor', () => {
  const state = makeState();
  createListing(state, { id: 'acc-test', name: 'Тестовый товар', category: 'accessories', price: 100, stock: 5 }, PARTNER);
  approveListing(state, 'acc-test', MOD);
  addToCart(state, 'acc-test', 1);
  const order = placeOrder(state, BUYER);
  advanceOrder(state, order.id, MOD);
  cancelOrder(state, order.id, MOD); // shipped? no — confirmed, cancelable
  rejectListing(state, GLUE, 'причина', MOD);
  restockListing(state, BLAZER, 50, PARTNER);
  const actions = state.audit.map((e) => e.action);
  for (const expected of ['listing_submitted', 'listing_approved', 'order_placed', 'order_advanced', 'order_cancelled', 'listing_rejected', 'listing_restocked']) {
    assert.ok(actions.includes(expected), `audit contains ${expected}`);
  }
  assert.ok(state.audit.every((e) => e.at === T0));
  assert.equal(state.audit.find((e) => e.action === 'listing_submitted').actorId, 'partner-forma');
});

test('role, status and error constants are exposed for UI wiring', () => {
  assert.deepEqual(ROLES, ['buyer', 'partner', 'moderator']);
  assert.deepEqual(LISTING_STATUSES, ['pending', 'approved', 'rejected']);
  assert.deepEqual(ORDER_STATUSES, ['new', 'confirmed', 'shipped', 'completed', 'cancelled']);
  assert.ok(MARKETPLACE_ERROR_MESSAGES.OUT_OF_STOCK.length > 0);
  assert.equal(new MarketplaceError('EMPTY_CART').message, MARKETPLACE_ERROR_MESSAGES.EMPTY_CART);
});