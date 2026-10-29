import test from 'node:test';
import assert from 'node:assert/strict';
import { isConsultantPlusAccessWindow } from '../../frp-noo-content.js';

test('ConsultantPlus verification begins at 20:00 Moscow time on weekdays', () => {
  assert.equal(isConsultantPlusAccessWindow(new Date('2026-10-29T16:59:00Z')), false); // 19:59 MSK
  assert.equal(isConsultantPlusAccessWindow(new Date('2026-10-29T17:00:00Z')), true);  // 20:00 MSK
});

test('ConsultantPlus verification stops at midnight Moscow time', () => {
  assert.equal(isConsultantPlusAccessWindow(new Date('2026-10-29T20:59:59Z')), true); // 23:59:59 MSK
  assert.equal(isConsultantPlusAccessWindow(new Date('2026-10-29T21:00:00Z')), false); // 00:00 MSK
});

test('ConsultantPlus verification does not run on weekends even during the time window', () => {
  assert.equal(isConsultantPlusAccessWindow(new Date('2026-10-31T17:05:00Z')), false); // Saturday, 20:05 MSK
  assert.equal(isConsultantPlusAccessWindow(new Date('2026-11-01T17:05:00Z')), false); // Sunday, 20:05 MSK
});
