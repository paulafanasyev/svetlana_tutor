import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from './federalWorkingProgramCatalog.json' with { type: 'json' };

test('federal working programme catalog has unique identifiers and valid source links', () => {
  assert.ok(catalog.programs.length >= 55);
  const ids = catalog.programs.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of catalog.programs) {
    assert.ok(item.id && item.title, 'id/title required');
    assert.ok(Array.isArray(item.gradeRange) && item.gradeRange.length === 2);
    assert.ok(item.gradeRange[0] >= 1 && item.gradeRange[1] <= 11 && item.gradeRange[0] <= item.gradeRange[1]);
    assert.match(item.url, /^https:\/\//);
    assert.ok(item.rightsStatus, 'rights status must remain explicit');
  }
});

test('catalog clearly distinguishes source links from content embedded in the app', () => {
  assert.ok(catalog.checkedAt);
  assert.ok(catalog.note.includes('not embedded') || catalog.note.includes('not'));
  assert.ok(catalog.programs.some((item) => item.contentStoredLocally === false));
});
