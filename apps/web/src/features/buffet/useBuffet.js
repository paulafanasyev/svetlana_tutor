// Bridges the pure buffet domain (buffet.js) to the app: localStorage persistence,
// the logged-in user, and React re-renders. The domain module stays framework-free
// and fully tested; this hook only injects the real clock/id generator and saves
// snapshots. School data (menu/orders/audit) is shared per school; the cart is
// kept per user so switching accounts on one device never mixes baskets.
import { useCallback, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { storage } from '../../core/storage.js';
import {
  createBuffet, serializeBuffet, getMenu, getCart, cartTotal,
  addToCart, setQuantity, removeFromCart, placeOrder, cancelOrder,
  listOrders, kitchenAdvanceOrder, setItemAvailability, upsertMenuItem, removeMenuItem,
} from './buffet.js';
import { SAMPLE_MENU } from './menu.js';

const SCHOOL_KEY = 'aet_buffet_school_v1';
const CART_KEY = 'aet_buffet_cart_v1';
const DEMO_SCHOOL_ID = 'school-demo';

// Demo role mapping: the admin/household staff runs the kitchen; teachers and
// parents order as staff; pupils order as pupils. Dedicated kitchen/staff
// accounts arrive with the server school module (ЦШ-1).
export function buffetRoleOf(user) {
  if (!user) return 'pupil';
  if (user.role === 'ADMIN') return 'kitchen';
  if (user.role === 'TEACHER' || user.role === 'PARENT') return 'staff';
  return 'pupil';
}

const newOrderId = () => 'ord-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

function loadState(user) {
  const school = storage.get(SCHOOL_KEY, null) || {};
  const carts = storage.get(CART_KEY, null) || {};
  return createBuffet({
    enabled: school.enabled !== undefined ? school.enabled : true,
    schoolId: school.schoolId || DEMO_SCHOOL_ID,
    menu: Array.isArray(school.menu) && school.menu.length ? school.menu : SAMPLE_MENU,
    orders: Array.isArray(school.orders) ? school.orders : [],
    audit: Array.isArray(school.audit) ? school.audit : [],
    cart: (user && carts[user.id]) || {},
    clock: () => Date.now(),
    nextId: newOrderId,
  });
}

function persist(state, user) {
  const snap = serializeBuffet(state);
  storage.set(SCHOOL_KEY, {
    schoolId: snap.schoolId, enabled: snap.enabled,
    menu: snap.menu, orders: snap.orders, audit: snap.audit,
  });
  if (user) {
    const carts = storage.get(CART_KEY, null) || {};
    carts[user.id] = snap.cart;
    storage.set(CART_KEY, carts);
  }
}

export function useBuffet() {
  const { user } = useApp();
  const userId = user?.id || null;
  const role = buffetRoleOf(user);
  const stateRef = useRef(null);
  const loadedFor = useRef(undefined);
  if (stateRef.current === null || loadedFor.current !== userId) {
    stateRef.current = loadState(user);
    loadedFor.current = userId;
  }
  const [, setTick] = useState(0);

  const commit = useCallback(() => {
    persist(stateRef.current, user);
    setTick((n) => n + 1);
  }, [user]);

  // Every domain mutation goes through here: run it, persist on success, and
  // surface a stable BuffetError (Russian message + code) to the UI on failure.
  const run = useCallback((fn) => {
    try {
      const result = fn(stateRef.current);
      commit();
      return { ok: true, result };
    } catch (error) {
      return { ok: false, error };
    }
  }, [commit]);

  const state = stateRef.current;
  const actor = { role, userId };
  const isKitchen = role === 'kitchen';

  return {
    role, isKitchen, userId,
    enabled: state.enabled,
    schoolId: state.schoolId,
    menu: getMenu(state, { role }),
    fullMenu: isKitchen ? getMenu(state, { role: 'kitchen' }) : [],
    cart: getCart(state),
    total: cartTotal(state),
    orders: userId ? listOrders(state, actor) : [],
    add: (itemId, qty = 1) => run((s) => addToCart(s, itemId, qty)),
    setQty: (itemId, qty) => run((s) => setQuantity(s, itemId, qty)),
    remove: (itemId) => run((s) => removeFromCart(s, itemId)),
    order: () => run((s) => placeOrder(s, actor)),
    cancel: (orderId) => run((s) => cancelOrder(s, orderId, actor)),
    advance: (orderId) => run((s) => kitchenAdvanceOrder(s, orderId, actor)),
    setAvailable: (itemId, available) => run((s) => setItemAvailability(s, itemId, available, actor)),
    upsert: (item) => run((s) => upsertMenuItem(s, item, actor)),
    removeItem: (itemId) => run((s) => removeMenuItem(s, itemId, actor)),
    // The enabled flag is a plain school setting; only the kitchen UI offers it.
    setEnabled: (enabled) => { stateRef.current.enabled = Boolean(enabled); commit(); return { ok: true }; },
  };
}