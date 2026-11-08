// Bridges the pure bookstore domain (bookstore.js) to the app: localStorage
// persistence, the logged-in user, and React re-renders. School data (listings/
// orders/library/audit) is shared per school. Mirrors useMarketplace/useBuffet.
import { useCallback, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { storage } from '../../core/storage.js';
import {
  createBookstore, serializeBookstore, listCatalog, searchCatalog, listPending,
  listMyListings, listLibrary, hasBook, listOrders, createListing, updateListing,
  approveListing, rejectListing, buyListing,
} from './bookstore.js';
import { SAMPLE_CATALOG } from './catalog.js';

const SCHOOL_KEY = 'aet_bookstore_school_v1';
const DEMO_SCHOOL_ID = 'school-demo';

// Demo role mapping until dedicated partner accounts arrive (ЦШ-1/P2):
// admin moderates, a teacher acts as a partner publisher, pupils/parents read & buy.
export function bookstoreRoleOf(user) {
  if (!user) return 'reader';
  if (user.role === 'ADMIN') return 'moderator';
  if (user.role === 'TEACHER') return 'partner';
  return 'reader';
}

const newId = () => 'bk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

function loadState() {
  const school = storage.get(SCHOOL_KEY, null) || {};
  return createBookstore({
    enabled: school.enabled !== undefined ? school.enabled : true,
    schoolId: school.schoolId || DEMO_SCHOOL_ID,
    listings: Array.isArray(school.listings) && school.listings.length ? school.listings : SAMPLE_CATALOG,
    orders: Array.isArray(school.orders) ? school.orders : [],
    library: school.library && typeof school.library === 'object' ? school.library : {},
    audit: Array.isArray(school.audit) ? school.audit : [],
    clock: () => Date.now(),
    nextId: newId,
  });
}

function persist(state) {
  const snap = serializeBookstore(state);
  storage.set(SCHOOL_KEY, {
    schoolId: snap.schoolId, enabled: snap.enabled,
    listings: snap.listings, orders: snap.orders, library: snap.library, audit: snap.audit,
  });
}

export function useBookstore() {
  const { user } = useApp();
  const userId = user?.id || null;
  const role = bookstoreRoleOf(user);
  const stateRef = useRef(null);
  if (stateRef.current === null) stateRef.current = loadState();
  const [, setTick] = useState(0);

  const commit = useCallback(() => {
    persist(stateRef.current);
    setTick((n) => n + 1);
  }, []);

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
    catalog: listCatalog(state),
    search: (filters) => searchCatalog(state, filters),
    pending: isModerator ? listPending(state, actor) : [],
    myListings: isPartner ? listMyListings(state, actor) : [],
    library: userId ? listLibrary(state, userId) : [],
    hasBook: (listingId) => userId ? hasBook(state, userId, listingId) : false,
    orders: userId ? listOrders(state, actor) : [],
    submitListing: (raw) => run((s) => createListing(s, raw, actor)),
    editListing: (id, patch) => run((s) => updateListing(s, id, patch, actor)),
    approve: (id) => run((s) => approveListing(s, id, actor)),
    reject: (id, reason) => run((s) => rejectListing(s, id, reason, actor)),
    buy: (id) => run((s) => buyListing(s, id, actor)),
    setEnabled: (enabled) => { stateRef.current.enabled = Boolean(enabled); commit(); return { ok: true }; },
  };
}
