import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceFailureMode } from './frp-noo-content.js';

test('transient ConsultantPlus outage falls back outside scheduled source check', () => {
  assert.equal(sourceFailureMode(['20.6: КонсультантПлюс: документ доступен только по расписанию'], 'push'), 'fallback-with-warning');
  assert.equal(sourceFailureMode(['HTTP 429'], 'pull_request'), 'fallback-with-warning');
});

test('scheduled source check fails when ConsultantPlus is transiently unavailable', () => {
  assert.equal(sourceFailureMode(['HTTP 429'], 'schedule'), 'fail-live-source-check');
});

test('unexpected parse or structure errors remain fatal', () => {
  assert.equal(sourceFailureMode(['разделы не найдены'], 'push'), 'fail-build');
  assert.equal(sourceFailureMode(['HTTP 429', 'разделы не найдены'], 'push'), 'fail-build');
});

test('no source errors means normal validation', () => {
  assert.equal(sourceFailureMode([], 'push'), 'no-error');
});
