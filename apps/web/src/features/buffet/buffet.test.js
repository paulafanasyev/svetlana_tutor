// Deterministic node:test suite for the school buffet domain logic.
// Run from apps/web:  node --test src/features/buffet/buffet.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBuffet, serializeBuffet, getMenu, getCart, addToCart, removeFromCart,
  setQuantity, cartTotal, formatPrice, placeOrder, kitchenAdvanceOrder,
  cancelOrder, listOrders, setItemAvailability, upsertMenuItem, removeMenuItem,
  BuffetError, ROLES, ORDER_STATUSES, MAX_QUANTITY, BUFFET_ERROR_MESSAGES,
} from './buffet.js';
import { SAMPLE_MENU, MENU_CATEGORIES } from './menu.js';

const T0 = 1700000000000; // fixed clock → fully reproducible timestamps
const KITCHEN = { role: 'kitchen', userId: 'cook-1' };
const PUPIL = { role: 'pupil', userId: 'pupil-1' };
const PUPIL2 = { role: 'pupil', userId: 'pupil-2' };
const STAFF = { role: 'staff', userId: 'teacher-1' };

const BUN = 'bakery-cinnamon-bun';   // 35 ₽
const TEA = 'drink-black-tea';       // 20 ₽
const BORSCH = 'hot-borsch';         // 65 ₽
const WATER = 'drink-water';         // 20 ₽
const KISEL = 'drink-berry-kisel';   // 25 ₽, seeded available:false (stop-list)

function makeState(opts = {}) {
  let n = 0;
  return createBuffet({
    enabled: true,
    schoolId: 'school-42',
    clock: () => T0,
    nextId: () => `ord-${++n}`,
    ...opts,
  });
}

// assert.throws predicate: matches a BuffetError with a stable code.
const code = (c) => (e) => e instanceof BuffetError && e.code === c;

test('createBuffet builds an isolated store seeded with a deep copy of the menu', () => {
  const state = makeState();
  assert.equal(state.schoolId, 'school-42');
  assert.equal(state.enabled, true);
  assert.deepEqual(state.orders, []);
  assert.deepEqual(state.cart, {});
  assert.deepEqual(state.audit, []);
  assert.equal(state.menu.length, SAMPLE_MENU.length);
  assert.notEqual(state.menu, SAMPLE_MENU);
  // Mutating the store must never leak into the shared seed data.
  state.menu[0].price = 999;
  assert.equal(SAMPLE_MENU[0].price, 35);
  assert.throws(() => createBuffet({ schoolId: '' }), code('INVALID_SCHOOL'));
  assert.throws(() => createBuffet({}), code('INVALID_SCHOOL'));
});

test('seeded menu is realistic, school-safe and uses integer ruble prices', () => {
  const ids = SAMPLE_MENU.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique');
  assert.ok(SAMPLE_MENU.length >= 20, 'a real buffet has a broad menu');
  const categoryIds = MENU_CATEGORIES.map((c) => c.id);
  for (const item of SAMPLE_MENU) {
    assert.match(item.name, /[А-Яа-яЁё]/, `Russian name: ${item.id}`);
    assert.ok(item.name.trim().length > 2, `no placeholder names: ${item.id}`);
    assert.ok(Number.isInteger(item.price) && item.price > 0 && item.price <= 200,
      `sensible integer ruble price: ${item.id} = ${item.price}`);
    assert.ok(categoryIds.includes(item.category), `known category: ${item.id}`);
    assert.ok(Array.isArray(item.allergens), `allergens array: ${item.id}`);
    assert.equal(typeof item.available, 'boolean');
    assert.ok(item.nutrition && Number.isFinite(item.nutrition.calories) && item.nutrition.calories >= 0,
      `nutrition present: ${item.id}`);
    // Child-safety: nothing age-inappropriate may ever appear on a school menu.
    assert.doesNotMatch(item.name, /алкогол|пиво|вин[оа]|водк|коньяк|табак|сигарет|энергет|кола/i,
      `school-safe item: ${item.id}`);
  }
  assert.ok(SAMPLE_MENU.some((i) => !i.available), 'seed includes a stop-list item for the kitchen view');
});

test('getMenu: ordering view hides unavailable items, kitchen view sees everything', () => {
  const state = makeState();
  const pupilView = getMenu(state, PUPIL);
  const staffView = getMenu(state, { role: 'staff' });
  const kitchenView = getMenu(state, KITCHEN);
  const defaultView = getMenu(state);
  assert.ok(pupilView.every((i) => i.available));
  assert.ok(!pupilView.some((i) => i.id === KISEL));
  assert.deepEqual(defaultView, pupilView, 'default view = ordering view');
  assert.deepEqual(staffView, pupilView);
  assert.equal(kitchenView.length, SAMPLE_MENU.length);
  assert.ok(kitchenView.some((i) => i.id === KISEL && i.available === false));
  assert.throws(() => getMenu(state, { role: 'hacker' }), code('INVALID_ROLE'));
  // Returned items are clones — external mutation cannot corrupt the store.
  pupilView[0].price = 1;
  assert.equal(state.menu.find((i) => i.id === pupilView[0].id).price, 35);
});

test('cart totals are exact integer rubles across add/set/remove', () => {
  const state = makeState();
  assert.equal(cartTotal(state), 0, 'empty cart totals 0');
  addToCart(state, BUN, 2);      // 70
  addToCart(state, TEA, 3);      // 60
  addToCart(state, BORSCH, 1);   // 65
  assert.equal(cartTotal(state), 195);
  assert.ok(Number.isInteger(cartTotal(state)));
  const lines = getCart(state);
  assert.equal(lines.length, 3);
  assert.equal(lines.find((l) => l.itemId === BUN).lineTotal, 70);
  addToCart(state, BUN, 1);      // same line accumulates → 3 × 35 = 105
  assert.equal(state.cart[BUN], 3);
  assert.equal(cartTotal(state), 230);
  setQuantity(state, TEA, 1);    // 105 + 20 + 65
  assert.equal(cartTotal(state), 190);
  removeFromCart(state, BORSCH); // 105 + 20
  assert.equal(cartTotal(state), 125);
  removeFromCart(state, BORSCH); // idempotent
  assert.equal(cartTotal(state), 125);
  setQuantity(state, BUN, MAX_QUANTITY); // 99 × 35 + 20 — no float drift
  assert.equal(cartTotal(state), 99 * 35 + 20);
  assert.equal(formatPrice(35), '35 ₽');
});

test('quantity validation rejects zero, negatives, fractions, non-numbers and overflow', () => {
  const state = makeState();
  const bad = [0, -1, 1.5, NaN, Infinity, '2', null, MAX_QUANTITY + 1];
  for (const qty of bad) {
    assert.throws(() => addToCart(state, BUN, qty), code('INVALID_QUANTITY'), `add qty=${qty}`);
    assert.throws(() => setQuantity(state, BUN, qty), code('INVALID_QUANTITY'), `set qty=${qty}`);
  }
  // setQuantity has no default → undefined is invalid; addToCart defaults it to 1.
  assert.throws(() => setQuantity(state, BUN, undefined), code('INVALID_QUANTITY'));
  addToCart(state, BUN);            // default qty = 1
  assert.equal(state.cart[BUN], 1);
  addToCart(state, BUN, MAX_QUANTITY - 1); // reaches the cap exactly
  assert.equal(state.cart[BUN], MAX_QUANTITY);
  assert.throws(() => addToCart(state, BUN, 1), code('INVALID_QUANTITY')); // cumulative overflow
});

test('cart rejects unknown and unavailable (stop-list) items', () => {
  const state = makeState();
  assert.throws(() => addToCart(state, 'no-such-item'), code('ITEM_NOT_FOUND'));
  assert.throws(() => setQuantity(state, 'no-such-item', 1), code('ITEM_NOT_FOUND'));
  assert.throws(() => addToCart(state, KISEL), code('ITEM_UNAVAILABLE'));
  // Kitchen lifts the stop-list → the item becomes orderable.
  setItemAvailability(state, KISEL, true, KITCHEN);
  addToCart(state, KISEL, 2);
  assert.equal(cartTotal(state), 50);
});

test('disabled buffet rejects ordering, but kitchen can still manage the menu', () => {
  const state = makeState({ enabled: false });
  assert.throws(() => addToCart(state, BUN), code('BUFFET_DISABLED'));
  assert.throws(() => setQuantity(state, BUN, 1), code('BUFFET_DISABLED'));
  assert.throws(() => removeFromCart(state, BUN), code('BUFFET_DISABLED'));
  assert.throws(() => placeOrder(state, PUPIL), code('BUFFET_DISABLED'));
  // The menu stays readable/manageable so the kitchen can prepare for reopening.
  assert.equal(getMenu(state, KITCHEN).length, SAMPLE_MENU.length);
  setItemAvailability(state, KISEL, true, KITCHEN);
  assert.equal(state.menu.find((i) => i.id === KISEL).available, true);
  upsertMenuItem(state, { id: 'drink-mors', name: 'Морс клюквенный', price: 25, category: 'drinks' }, KITCHEN);
  assert.ok(getMenu(state, KITCHEN).some((i) => i.id === 'drink-mors'));
});

test('placeOrder creates a deterministic snapshot order and clears the cart', () => {
  const state = makeState();
  addToCart(state, BUN, 2);
  addToCart(state, TEA, 3);
  const order = placeOrder(state, PUPIL);
  assert.equal(order.id, 'ord-1');
  assert.equal(order.schoolId, 'school-42');
  assert.equal(order.userId, 'pupil-1');
  assert.equal(order.role, 'pupil');
  assert.equal(order.status, 'new');
  assert.equal(order.total, 130);
  assert.equal(order.createdAt, T0);
  assert.equal(order.updatedAt, T0);
  assert.deepEqual(order.history, [{ status: 'new', at: T0, by: 'pupil-1' }]);
  assert.equal(order.items.length, 2);
  const bunLine = order.items.find((l) => l.itemId === BUN);
  assert.equal(bunLine.name, 'Булочка с корицей');
  assert.equal(bunLine.price, 35);
  assert.equal(bunLine.qty, 2);
  assert.deepEqual(bunLine.allergens, ['глютен', 'молоко']);
  assert.deepEqual(state.cart, {}, 'cart is cleared after ordering');
  assert.equal(cartTotal(state), 0);
  assert.ok(state.audit.some((e) => e.action === 'order_placed' && e.at === T0 && e.details.orderId === 'ord-1'));
  // Ids keep incrementing deterministically.
  addToCart(state, WATER, 1);
  const second = placeOrder(state, STAFF);
  assert.equal(second.id, 'ord-2');
  assert.equal(second.total, 20);
});

test('placeOrder rejects empty cart, unavailable items and bad identity', () => {
  const state = makeState();
  assert.throws(() => placeOrder(state, PUPIL), code('EMPTY_CART'));
  addToCart(state, BUN, 1);
  assert.throws(() => placeOrder(state, { role: 'pupil' }), code('INVALID_USER'));
  assert.throws(() => placeOrder(state, { userId: 'x', role: 'hacker' }), code('INVALID_ROLE'));
  // Item goes to the stop-list while it sits in the cart → order must fail.
  setItemAvailability(state, BUN, false, KITCHEN);
  assert.throws(() => placeOrder(state, PUPIL), code('ITEM_UNAVAILABLE'));
  assert.equal(state.orders.length, 0, 'no partial order is created on rejection');
  assert.equal(state.cart[BUN], 1, 'cart is preserved when the order is rejected');
});

test('order snapshot is immutable against later menu edits', () => {
  const state = makeState();
  addToCart(state, BUN, 2);
  const order = placeOrder(state, PUPIL);
  upsertMenuItem(state, { id: BUN, name: 'Булочка новая', price: 99, category: 'bakery' }, KITCHEN);
  removeMenuItem(state, TEA, KITCHEN);
  const [stored] = listOrders(state, KITCHEN);
  assert.equal(stored.id, order.id);
  assert.equal(stored.total, 70, 'historical total never changes');
  assert.equal(stored.items[0].name, 'Булочка с корицей');
  assert.equal(stored.items[0].price, 35);
});

test('kitchen status flow: new → preparing → ready → completed, invalid transitions rejected', () => {
  const state = makeState();
  addToCart(state, BUN, 1);
  const order = placeOrder(state, PUPIL);
  let current = kitchenAdvanceOrder(state, order.id, KITCHEN);
  assert.equal(current.status, 'preparing');
  assert.equal(current.history.length, 2);
  assert.equal(current.history[1].by, 'cook-1');
  current = kitchenAdvanceOrder(state, order.id, KITCHEN);
  assert.equal(current.status, 'ready');
  current = kitchenAdvanceOrder(state, order.id, KITCHEN);
  assert.equal(current.status, 'completed');
  assert.equal(current.history.length, 4);
  assert.ok(ORDER_STATUSES.includes(current.status));
  assert.throws(() => kitchenAdvanceOrder(state, order.id, KITCHEN), code('INVALID_TRANSITION'));
  assert.throws(() => kitchenAdvanceOrder(state, order.id, PUPIL), code('FORBIDDEN'));
  assert.throws(() => kitchenAdvanceOrder(state, order.id, STAFF), code('FORBIDDEN'));
  assert.throws(() => kitchenAdvanceOrder(state, 'ghost', KITCHEN), code('ORDER_NOT_FOUND'));
});

test('cancel rules: owner or kitchen, only before ready', () => {
  const state = makeState();
  addToCart(state, BUN, 1);
  const a = placeOrder(state, PUPIL);
  addToCart(state, TEA, 1);
  const b = placeOrder(state, PUPIL);
  addToCart(state, WATER, 1);
  const c = placeOrder(state, PUPIL2);
  addToCart(state, BORSCH, 1);
  const d = placeOrder(state, STAFF);

  // Owner cancels a 'new' order.
  assert.equal(cancelOrder(state, a.id, PUPIL).status, 'cancelled');
  // Owner cancels a 'preparing' order.
  kitchenAdvanceOrder(state, b.id, KITCHEN);
  assert.equal(cancelOrder(state, b.id, PUPIL).status, 'cancelled');
  // Kitchen may cancel someone else's order (bare role string is enough).
  assert.equal(cancelOrder(state, c.id, 'kitchen').status, 'cancelled');
  // Staff owner cancels their own.
  assert.equal(cancelOrder(state, d.id, STAFF).status, 'cancelled');

  // A different pupil must never cancel another user's order.
  addToCart(state, BUN, 1);
  const e = placeOrder(state, PUPIL);
  assert.throws(() => cancelOrder(state, e.id, PUPIL2), code('FORBIDDEN'));
  // Bare non-kitchen role string carries no identity → rejected.
  assert.throws(() => cancelOrder(state, e.id, 'pupil'), code('FORBIDDEN'));
  // Once ready / completed / cancelled, cancellation is impossible.
  kitchenAdvanceOrder(state, e.id, KITCHEN);
  kitchenAdvanceOrder(state, e.id, KITCHEN); // ready
  assert.throws(() => cancelOrder(state, e.id, PUPIL), code('ORDER_NOT_CANCELABLE'));
  assert.throws(() => cancelOrder(state, e.id, 'kitchen'), code('ORDER_NOT_CANCELABLE'));
  kitchenAdvanceOrder(state, e.id, KITCHEN); // completed
  assert.throws(() => cancelOrder(state, e.id, PUPIL), code('ORDER_NOT_CANCELABLE'));
  assert.throws(() => cancelOrder(state, a.id, PUPIL), code('ORDER_NOT_CANCELABLE')); // already cancelled
  assert.throws(() => cancelOrder(state, 'ghost', KITCHEN), code('ORDER_NOT_FOUND'));
  // A cancelled order can no longer advance.
  assert.throws(() => kitchenAdvanceOrder(state, a.id, KITCHEN), code('INVALID_TRANSITION'));
});

test('listOrders scoping: kitchen sees all, pupils/staff see only their own (security)', () => {
  const state = makeState();
  addToCart(state, BUN, 1);
  const oa = placeOrder(state, PUPIL);
  addToCart(state, TEA, 1);
  const ob = placeOrder(state, PUPIL2);
  addToCart(state, WATER, 1);
  const oc = placeOrder(state, STAFF);

  assert.deepEqual(listOrders(state, PUPIL).map((o) => o.id), [oa.id]);
  assert.deepEqual(listOrders(state, PUPIL2).map((o) => o.id), [ob.id]);
  assert.deepEqual(listOrders(state, STAFF).map((o) => o.id), [oc.id]);
  assert.deepEqual(listOrders(state, KITCHEN).map((o) => o.id), [oa.id, ob.id, oc.id]);
  // A pupil without a userId must be rejected, never granted a full list.
  assert.throws(() => listOrders(state, { role: 'pupil' }), code('INVALID_USER'));
  assert.throws(() => listOrders(state, { role: 'hacker', userId: 'pupil-1' }), code('INVALID_ROLE'));
  // Results are clones: tampering with them cannot alter the store.
  const mine = listOrders(state, PUPIL);
  mine[0].total = 1;
  mine[0].items[0].qty = 999;
  assert.equal(listOrders(state, PUPIL)[0].total, 35);
  assert.equal(listOrders(state, PUPIL)[0].items[0].qty, 1);
});

test('menu management is kitchen-only and validates item shape', () => {
  const state = makeState();
  const newItem = { id: 'salad-test', name: 'Салат тестовый', price: 50, category: 'salads' };
  assert.throws(() => upsertMenuItem(state, newItem, PUPIL), code('FORBIDDEN'));
  assert.throws(() => upsertMenuItem(state, newItem, STAFF), code('FORBIDDEN'));
  assert.throws(() => setItemAvailability(state, BUN, false, PUPIL), code('FORBIDDEN'));
  assert.throws(() => removeMenuItem(state, BUN, STAFF), code('FORBIDDEN'));
  assert.equal(state.menu.length, SAMPLE_MENU.length, 'rejected edits change nothing');

  const created = upsertMenuItem(state, newItem, KITCHEN);
  assert.equal(created.available, true, 'new items default to available');
  assert.ok(getMenu(state, PUPIL).some((i) => i.id === 'salad-test'));
  // Upsert replaces by id.
  upsertMenuItem(state, { ...newItem, price: 55 }, KITCHEN);
  assert.equal(state.menu.find((i) => i.id === 'salad-test').price, 55);
  assert.equal(state.menu.filter((i) => i.id === 'salad-test').length, 1);

  const invalid = [
    { ...newItem, id: '' },
    { ...newItem, name: '   ' },
    { ...newItem, price: 50.5 },
    { ...newItem, price: -5 },
    { ...newItem, price: '50' },
    { ...newItem, category: '' },
    { ...newItem, allergens: 'молоко' },
    { ...newItem, available: 'yes' },
    { ...newItem, nutrition: { calories: -1 } },
  ];
  for (const bad of invalid) {
    assert.throws(() => upsertMenuItem(state, bad, KITCHEN), code('INVALID_ITEM'), JSON.stringify(bad));
  }

  setItemAvailability(state, 'salad-test', false, KITCHEN);
  assert.ok(!getMenu(state, PUPIL).some((i) => i.id === 'salad-test'));
  assert.ok(getMenu(state, KITCHEN).some((i) => i.id === 'salad-test'));
  assert.throws(() => setItemAvailability(state, 'salad-test', 'false', KITCHEN), code('INVALID_AVAILABILITY'));

  // Removing an item also drops its cart line; orders keep their snapshots.
  setItemAvailability(state, 'salad-test', true, KITCHEN); // back off the stop-list so it can be ordered
  addToCart(state, 'salad-test', 2);
  removeMenuItem(state, 'salad-test', KITCHEN);
  assert.ok(!state.menu.some((i) => i.id === 'salad-test'));
  assert.equal(state.cart['salad-test'], undefined);
  assert.throws(() => removeMenuItem(state, 'salad-test', KITCHEN), code('ITEM_NOT_FOUND'));
});

test('serializeBuffet round-trips through JSON for localStorage-agnostic persistence', () => {
  const state = makeState();
  addToCart(state, BUN, 2);
  addToCart(state, TEA, 1);
  placeOrder(state, PUPIL);
  addToCart(state, WATER, 3); // leave a non-empty cart to persist
  const json = JSON.stringify(serializeBuffet(state)); // must not throw on functions
  const data = JSON.parse(json);
  let n = 100;
  const restored = createBuffet({ ...data, clock: () => T0, nextId: () => `ord-${++n}` });
  assert.equal(restored.schoolId, 'school-42');
  assert.equal(restored.enabled, true);
  assert.deepEqual(restored.cart, { [WATER]: 3 });
  assert.equal(cartTotal(restored), 60);
  const orders = listOrders(restored, KITCHEN);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].total, 90);
  assert.equal(orders[0].status, 'new');
  assert.equal(restored.menu.length, SAMPLE_MENU.length);
  // The restored store keeps working with freshly injected id/clock.
  const next = placeOrder(restored, PUPIL);
  assert.equal(next.id, 'ord-101');
  assert.equal(next.createdAt, T0);
});

test('audit log records domain events with the injected clock and actor', () => {
  const state = makeState();
  addToCart(state, BUN, 1);
  const order = placeOrder(state, PUPIL);
  kitchenAdvanceOrder(state, order.id, KITCHEN);
  cancelOrder(state, order.id, KITCHEN);
  upsertMenuItem(state, { id: 'drink-mors', name: 'Морс клюквенный', price: 25, category: 'drinks' }, KITCHEN);
  setItemAvailability(state, KISEL, true, KITCHEN);
  removeMenuItem(state, 'drink-mors', KITCHEN);
  const actions = state.audit.map((e) => e.action);
  for (const expected of ['order_placed', 'order_advanced', 'order_cancelled', 'menu_upserted', 'availability_changed', 'menu_removed']) {
    assert.ok(actions.includes(expected), `audit contains ${expected}`);
  }
  assert.ok(state.audit.every((e) => e.at === T0), 'every audit entry uses the injected clock');
  const placed = state.audit.find((e) => e.action === 'order_placed');
  assert.equal(placed.actorRole, 'pupil');
  assert.equal(placed.actorId, 'pupil-1');
  const advanced = state.audit.find((e) => e.action === 'order_advanced');
  assert.equal(advanced.actorRole, 'kitchen');
  assert.equal(advanced.details.to, 'preparing');
});

test('role and status constants are exposed for UI wiring', () => {
  assert.deepEqual(ROLES, ['pupil', 'staff', 'kitchen']);
  assert.deepEqual(ORDER_STATUSES, ['new', 'preparing', 'ready', 'completed', 'cancelled']);
  assert.ok(BUFFET_ERROR_MESSAGES.BUFFET_DISABLED.length > 0);
  assert.equal(new BuffetError('EMPTY_CART').message, BUFFET_ERROR_MESSAGES.EMPTY_CART);
});