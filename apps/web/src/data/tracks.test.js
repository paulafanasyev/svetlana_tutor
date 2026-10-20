import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, resolveUserTrack, trackById } from './tracks.js';

test('four tracks, unknown id falls back to base', () => {
  assert.deepEqual(TRACKS.map((t) => t.id), ['base', 'cadet', 'lyceum', 'care']);
  assert.equal(trackById('hack').id, 'base');
});

test('cadet prompt keeps the lesson goal and child-safety limits', () => {
  const p = trackById('cadet').prompt;
  for (const w of ['never replaces the goal', 'weapons', 'propaganda', 'humiliate', '8-800-2000-122']) assert.ok(p.includes(w), w);
  assert.ok(!/ОБЗР/.test(trackById('cadet').desc.ru));
});

test('each learner keeps their own version', () => {
  const prefs = { track: 'cadet', trackByUser: { a: 'cadet', b: 'lyceum' } };
  assert.equal(resolveUserTrack(prefs, 'a'), 'cadet');
  assert.equal(resolveUserTrack(prefs, 'b'), 'lyceum');
});

test('a new learner on a shared device does not inherit cadet mode', () => {
  assert.equal(resolveUserTrack({ track: 'cadet', trackByUser: { a: 'cadet' } }, 'new'), 'base');
  assert.equal(resolveUserTrack({ track: 'cadet' }, 'first'), 'cadet');
});

test('a school link wins', () => {
  assert.equal(resolveUserTrack({ track: 'cadet', trackLock: true, trackByUser: { a: 'base' } }, 'a'), 'cadet');
  assert.equal(resolveUserTrack({ track: 'care', trackFromLink: true, trackByUser: { x: 'base' } }, 'new'), 'care');
  assert.equal(resolveUserTrack({ track: 'bogus' }, null), 'base');
});
