// Bridges the pure marketplace domain (marketplace.js) to the app: localStorage
// persistence, the logged-in user, and React re-renders. School data (listings/
// orders/audit) is shared per school; the cart is kept per user. Mirrors useBuffet.
import { useCallback, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { storage } from '../../core/storage.js';
import {
  createMarketplace, serializeMarketplace, getCatalog, getCart, cartTotal,
  addToCart, setQuantity, removeFromCart, placeOrder, cancelOrder, advanceOrder,
  listOrders, createListing, updateListing, restockListing, listMyListings,
  approveListing, rejectListing, listPending, listAllListings,
} from './marketplace.js';
import { SAMPLE_GOODS } from './catalog.js';

const SCHOOL_KEY = 'aet_marketplace_school_v1';
const CART_KEY = 'aet_marketplace_cart_v1';
const DEMO_SCHOOL_ID = 'school-demo';

// Demo role mapping until dedicated partner/moderator accounts arrive (ЦШ-1/P2):
// admin moderates & fulfils, a teacher acts as a partner supplier, pupils/parents
// buy. Switch demo logins (admin@demo / teacher@demo / student@demo) to explore each view.
export function marketplaceRoleOf(user) {
  if (!user) return 'buyer';
  if (user.role === 'ADMIN') return 'moderator';
  if (user.role === 'TEACHER') return 'partner';
  return 'buyer';
}

const newOrderId = () => 'mp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

function loadState(user) {
  const school = storage.get(SCHOOL_KEY, null) || {};
  const carts = storage.get(CART_KEY, null) || {};
  return createMarketplace({
    enabled: school.enabled !== undefined ? school.enabled : true,
    schoolId: school.schoolId || DEMO_SCHOOL_ID,
    listings: Array.isArray(school.listings) && school.listings.length ? school.listings : SAMPLE_GOODS,
    orders: Array.isArray(school.orders) ? school.orders : [],
    audit: Array.isArray(school.audit) ? school.audit : [],
    cart: (user && carts[user.id]) || {},
    clock: () => Date.now(),
    nextId: newOrderId,
  });
}

function persist(state, user) {
  const snap = serializeMarketplace(state);
  storage.set(SCHOOL_KEY, {
    schoolId: snap.schoolId, enabled: snap.enabled,
    listings: snap.listings, orders: snap.orders, audit: snap.audit,
  });
  if (user) {
    const carts = storage.get(CART_KEY, null) || {};
    carts[user.id] = snap.cart;
    storage.set(CART_KEY, carts);
  }
}

export function useMarketplace() {
  const { user } = useApp();
  const userId = user?.id || null;
  const role = marketplaceRoleOf(user);
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
  const isModerator = role === 'moderator';
  const isPartner = role === 'partner';

  return {
    role, isModerator, isPartner, userId,
    enabled: state.enabled,
    schoolId: state.schoolId,
    catalog: getCatalog(state),
    cart: getCart(state),
    total: cartTotal(state),
    orders: userId ? listOrders(state, actor) : [],
    myListings: isPartner ? listMyListings(state, actor) : [],
    pending: isModerator ? listPending(state, actor) : [],
    allListings: isModerator ? listAllListings(state, actor) : [],
    add: (id, qty = 1) => run((s) => addToCart(s, id, qty)),
    setQty: (id, qty) => run((s) => setQuantity(s, id, qty)),
    remove: (id) => run((s) => removeFromCart(s, id)),
    order: () => run((s) => placeOrder(s, actor)),
    cancel: (orderId) => run((s) => cancelOrder(s, orderId, actor)),
    advance: (orderId) => run((s) => advanceOrder(s, orderId, actor)),
    submitListing: (raw) => run((s) => createListing(s, raw, actor)),
    editListing: (id, patch) => run((s) => updateListing(s, id, patch, actor)),
    restock: (id, stock) => run((s) => restockListing(s, id, stock, actor)),
    approve: (id) => run((s) => approveListing(s, id, actor)),
    reject: (id, reason) => run((s) => rejectListing(s, id, reason, actor)),
    setEnabled: (enabled) => { stateRef.current.enabled = Boolean(enabled); commit(); return { ok: true }; },
  };
}