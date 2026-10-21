// Brute-force protection for /api/auth/login, without letting strangers lock someone out.
//
// Audit 21.10: a hard per-e-mail lock (5 wrong passwords → 15 min) let anyone who knows a child's e-mail
// lock that account. Now there are two levels:
//  - per e-mail + IP: MAX_FAILS wrong passwords from one address lock only that address for this account
//    (the real owner on another network / device still logs in);
//  - per e-mail from all addresses: MAX_FAILS_ACCOUNT failures (a distributed attack: with the IP limiter of
//    20 requests / 15 min that needs 10+ machines) lock the account for LOCK_MS.
// A successful login clears the counters of that e-mail + IP.
//
// State is in-memory (per process): enough for one api replica; for several replicas move it to Redis.

export const MAX_FAILS = 5;
export const MAX_FAILS_ACCOUNT = 50;
export const LOCK_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000; // failures older than this are forgotten
const MAX_ENTRIES = 20_000; // memory bound under a spray attack

const entries = new Map(); // key -> { fails, first, lockedUntil }

function prune(now) {
  if (entries.size < MAX_ENTRIES) return;
  for (const [k, e] of entries) {
    if ((e.lockedUntil || 0) < now && now - e.first > WINDOW_MS) entries.delete(k);
  }
  while (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
}

const pairKey = (email, ip) => `p|${email}|${ip || '?'}`;
const accKey = (email) => `a|${email}`;

function remaining(key, now) {
  const e = entries.get(key);
  if (!e || !e.lockedUntil) return 0;
  if (e.lockedUntil <= now) { entries.delete(key); return 0; }
  return e.lockedUntil - now;
}

function bump(key, limit, now) {
  let e = entries.get(key);
  if (!e || now - e.first > WINDOW_MS) e = { fails: 0, first: now, lockedUntil: 0 };
  e.fails += 1;
  if (e.fails >= limit) e.lockedUntil = now + LOCK_MS;
  entries.set(key, e);
}

/** Milliseconds left on the lock for this e-mail from this IP, 0 if not locked. */
export function lockRemaining(email, ip, now = Date.now()) {
  return Math.max(remaining(pairKey(email, ip), now), remaining(accKey(email), now));
}

export function recordFailure(email, ip, now = Date.now()) {
  prune(now);
  bump(pairKey(email, ip), MAX_FAILS, now);
  bump(accKey(email), MAX_FAILS_ACCOUNT, now);
}

export function recordSuccess(email, ip) {
  entries.delete(pairKey(email, ip));
}

// Test-only.
export function _resetLoginGuard() {
  entries.clear();
}
