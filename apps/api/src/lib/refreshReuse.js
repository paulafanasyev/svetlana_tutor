// Refresh-token reuse detection (audit 21.10).
// A refresh token is one-time. When a token that was already ROTATED comes back later, someone holds a copy
// (stolen token): all sessions of that user are revoked. Two tabs refreshing at the same moment are normal,
// so a reuse within GRACE_MS of the rotation is just refused (401) without logging everyone out.
// Tokens revoked by logout are not tracked here: reusing them is a plain 401.
// In-memory (per process); after a restart reuse is simply refused, never mis-detected.

let GRACE_MS = 30 * 1000;
const KEEP_MS = 31 * 24 * 60 * 60 * 1000; // longer than the refresh token lifetime
const MAX_ENTRIES = 100_000;
const rotated = new Map(); // tokenHash -> rotatedAt

export function markRotated(tokenHash, now = Date.now()) {
  if (rotated.size >= MAX_ENTRIES) {
    for (const [k, at] of rotated) { if (now - at > KEEP_MS) rotated.delete(k); }
    while (rotated.size >= MAX_ENTRIES) rotated.delete(rotated.keys().next().value);
  }
  rotated.set(tokenHash, now);
}

/** 'theft' — rotated long enough ago that this is a replayed copy; 'race' — parallel refresh; null — not a rotated token. */
export function reuseKind(tokenHash, now = Date.now()) {
  const at = rotated.get(tokenHash);
  if (at == null) return null;
  return now - at <= GRACE_MS ? 'race' : 'theft';
}

// Test-only.
export function _setReuseGraceMs(ms) { GRACE_MS = ms; }
export function _resetRefreshReuse() { rotated.clear(); GRACE_MS = 30 * 1000; }
