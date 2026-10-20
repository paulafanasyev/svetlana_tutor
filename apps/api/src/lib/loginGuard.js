// Per-account brute-force protection for /api/auth/login.
//
// The IP rate limiter in app.js stops one machine from hammering the API, but
// a distributed attacker (many IPs) could still guess one account's password.
// This guard counts failed logins per e-mail and locks that account for
// LOCK_MS after MAX_FAILS consecutive failures, whatever IP they come from.
//
// State is in-memory (per process). That is enough for a single api replica;
// for several replicas move it to a shared store (Redis) like the rate limiter.

export const MAX_FAILS = 5;
export const LOCK_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000; // failures older than this are forgotten
const MAX_ENTRIES = 10_000; // memory bound under a spray attack

const entries = new Map(); // email -> { fails, first, lockedUntil }

function prune(now) {
  if (entries.size < MAX_ENTRIES) return;
  for (const [k, e] of entries) {
    if ((e.lockedUntil || 0) < now && now - e.first > WINDOW_MS) entries.delete(k);
  }
  // Still full (everything is fresh): drop the oldest entries.
  while (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
}

/** Milliseconds left on the lock for this e-mail, 0 if not locked. */
export function lockRemaining(email, now = Date.now()) {
  const e = entries.get(email);
  if (!e || !e.lockedUntil) return 0;
  if (e.lockedUntil <= now) { entries.delete(email); return 0; }
  return e.lockedUntil - now;
}

export function recordFailure(email, now = Date.now()) {
  prune(now);
  let e = entries.get(email);
  if (!e || now - e.first > WINDOW_MS) e = { fails: 0, first: now, lockedUntil: 0 };
  e.fails += 1;
  if (e.fails >= MAX_FAILS) e.lockedUntil = now + LOCK_MS;
  entries.set(email, e);
}

export function recordSuccess(email) {
  entries.delete(email);
}

// Test-only.
export function _resetLoginGuard() {
  entries.clear();
}
