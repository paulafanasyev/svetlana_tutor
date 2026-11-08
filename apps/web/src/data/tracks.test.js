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

test('cadet version shows its age range and softens for young children (audit 21.10)', () => {
  const c = trackById('cadet');
  assert.match(c.ages.ru, /10–17/);
  assert.equal(c.agesShort.ru, '10+');
  assert.match(c.prompt, /younger than 10/);
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

// ─── Track filtering for game questions ─────────────────────────────────────────
import { filterByTrack, availableTracks, TRACK_FILTERS } from './games/subjects.js';

test('TRACK_FILTERS lists all four tracks', () => {
  assert.deepEqual(TRACK_FILTERS, ['base', 'cadet', 'lyceum', 'care']);
});

test('availableTracks returns labels for all tracks', () => {
  const tracks = availableTracks();
  assert.equal(tracks.length, 4);
  assert.equal(tracks[0].id, 'base');
  assert.equal(tracks[1].id, 'cadet');
  assert.ok(tracks[0].ru);
  assert.ok(tracks[0].en);
  assert.ok(tracks[0].emoji);
});

test('filterByTrack: base track keeps only questions without track field', () => {
  const raw = {
    quiz: [
      { t: 'Topic', q: 'Base question', o: ['a'], a: 0, e: '' },
      { t: 'Topic', q: 'Lyceum question', o: ['a'], a: 0, e: '', track: 'lyceum' },
      { t: 'Topic', q: 'Cadet question', o: ['a'], a: 0, e: '', track: 'cadet' },
    ],
    pairs: [['Term', 'Value'], ['Cadet term', 'Cadet val', 'cadet']],
  };
  const result = filterByTrack(raw, 'base');
  assert.equal(result.quiz.length, 1);
  assert.equal(result.quiz[0].q, 'Base question');
  assert.equal(result.pairs.length, 1);
  assert.deepEqual(result.pairs[0], ['Term', 'Value']);
});

test('filterByTrack: lyceum track keeps base + lyceum questions', () => {
  const raw = {
    quiz: [
      { t: 'Topic', q: 'Base question', o: ['a'], a: 0, e: '' },
      { t: 'Topic', q: 'Lyceum question', o: ['a'], a: 0, e: '', track: 'lyceum' },
      { t: 'Topic', q: 'Cadet question', o: ['a'], a: 0, e: '', track: 'cadet' },
    ],
    pairs: [],
  };
  const result = filterByTrack(raw, 'lyceum');
  assert.equal(result.quiz.length, 2);
  assert.equal(result.quiz[0].q, 'Base question');
  assert.equal(result.quiz[1].q, 'Lyceum question');
});

test('filterByTrack: cadet track keeps base + cadet questions', () => {
  const raw = {
    quiz: [
      { t: 'Topic', q: 'Base question', o: ['a'], a: 0, e: '' },
      { t: 'Topic', q: 'Cadet question', o: ['a'], a: 0, e: '', track: 'cadet' },
      { t: 'Topic', q: 'Care question', o: ['a'], a: 0, e: '', track: 'care' },
    ],
    pairs: [],
  };
  const result = filterByTrack(raw, 'cadet');
  assert.equal(result.quiz.length, 2);
  assert.equal(result.quiz[1].q, 'Cadet question');
});

test('filterByTrack: care track keeps base + care questions', () => {
  const raw = {
    quiz: [
      { t: 'Topic', q: 'Base question', o: ['a'], a: 0, e: '' },
      { t: 'Topic', q: 'Care micro-step', o: ['a'], a: 0, e: '', track: 'care' },
    ],
    pairs: [],
  };
  const result = filterByTrack(raw, 'care');
  assert.equal(result.quiz.length, 2);
  assert.equal(result.quiz[1].q, 'Care micro-step');
});

test('filterByTrack: undefined track behaves as base', () => {
  const raw = {
    quiz: [
      { t: 'Topic', q: 'Base', o: ['a'], a: 0, e: '' },
      { t: 'Topic', q: 'Special', o: ['a'], a: 0, e: '', track: 'lyceum' },
    ],
    pairs: [],
  };
  const result = filterByTrack(raw, undefined);
  assert.equal(result.quiz.length, 1);
  assert.equal(result.quiz[0].q, 'Base');
});

test('filterByTrack: null raw returns null', () => {
  assert.equal(filterByTrack(null, 'base'), null);
  assert.equal(filterByTrack(undefined, 'lyceum'), undefined);
});

test('filterByTrack: pairs with track field in third element', () => {
  const raw = {
    quiz: [],
    pairs: [
      ['Base term', 'Base val'],
      ['Lyceum term', 'Lyceum val', 'lyceum'],
      ['Care term', 'Care val', 'care'],
    ],
  };
  const baseResult = filterByTrack(raw, 'base');
  assert.equal(baseResult.pairs.length, 1);

  const lyceumResult = filterByTrack(raw, 'lyceum');
  assert.equal(lyceumResult.pairs.length, 2);
  assert.equal(lyceumResult.pairs[1][0], 'Lyceum term');
});
