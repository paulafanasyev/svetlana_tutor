import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStaff, serializeStaff, getStaffProfile, upsertStaffProfile,
  getDashboardStats, getAiAssistantConfig,
} from './staff.js';

const T0 = 1700000000000;
const clock = () => T0;

function fresh() {
  return createStaff({ schoolId: 'school-1', clock });
}

describe('staff domain', () => {
  it('createStaff: default state', () => {
    const s = fresh();
    assert.equal(s.schoolId, 'school-1');
    assert.deepEqual(s.staff, []);
    assert.deepEqual(s.audit, []);
  });

  it('createStaff: rejects invalid schoolId', () => {
    try {
      createStaff({ schoolId: '', clock });
      assert.fail('should have thrown');
    } catch (e) {
      assert.equal(e.code, 'INVALID_SCHOOL');
    }
  });

  it('upsertStaffProfile: creates new profile', () => {
    const s = fresh();
    const actor = { role: 'admin', userId: 'u_admin' };
    const profile = { userId: 'u_teacher', role: 'teacher', name: 'Иванова', subjects: ['math'], classes: ['5A'], aiProfession: 'teacher' };
    const result = upsertStaffProfile(s, profile, actor);
    assert.equal(result.userId, 'u_teacher');
    assert.equal(result.name, 'Иванова');
    assert.equal(s.staff.length, 1);
    assert.equal(s.audit.length, 1);
    assert.equal(s.audit[0].action, 'staff_profile_updated');
  });

  it('upsertStaffProfile: updates existing profile', () => {
    const s = fresh();
    const actor = { role: 'admin', userId: 'u_admin' };
    upsertStaffProfile(s, { userId: 'u_teacher', name: 'Иванова' }, actor);
    upsertStaffProfile(s, { userId: 'u_teacher', name: 'Иванова А.И.' }, actor);
    assert.equal(s.staff.length, 1);
    assert.equal(s.staff[0].name, 'Иванова А.И.');
    assert.equal(s.audit.length, 2);
  });

  it('upsertStaffProfile: teacher can edit own profile', () => {
    const s = fresh();
    const teacher = { role: 'teacher', userId: 'u_teacher' };
    upsertStaffProfile(s, { userId: 'u_teacher', name: 'Петров' }, teacher);
    assert.equal(s.staff[0].name, 'Петров');
  });

  it('upsertStaffProfile: teacher cannot edit other profile', () => {
    const s = fresh();
    const teacher = { role: 'teacher', userId: 'u_teacher1' };
    try {
      upsertStaffProfile(s, { userId: 'u_teacher2', name: 'X' }, teacher);
      assert.fail('should have thrown');
    } catch (e) {
      assert.equal(e.code, 'FORBIDDEN');
    }
  });

  it('upsertStaffProfile: rejects invalid actor', () => {
    const s = fresh();
    try {
      upsertStaffProfile(s, { userId: 'u1' }, null);
      assert.fail('should have thrown');
    } catch (e) {
      assert.equal(e.code, 'FORBIDDEN');
    }
    try {
      upsertStaffProfile(s, { userId: 'u1' }, { role: 'student', userId: 'u1' });
      assert.fail('should have thrown');
    } catch (e) {
      assert.equal(e.code, 'FORBIDDEN');
    }
  });

  it('getStaffProfile: returns clone', () => {
    const s = fresh();
    upsertStaffProfile(s, { userId: 'u1', name: 'Test' }, { role: 'admin', userId: 'u_admin' });
    const p1 = getStaffProfile(s, 'u1');
    const p2 = getStaffProfile(s, 'u1');
    assert.deepEqual(p1, p2);
    assert.notEqual(p1, p2);
  });

  it('getStaffProfile: returns null for missing', () => {
    const s = fresh();
    assert.equal(getStaffProfile(s, 'u_missing'), null);
  });

  it('getDashboardStats: aggregates from modules', () => {
    const s = fresh();
    const actor = { role: 'admin', userId: 'u_admin' };
    const moduleStates = {
      homework: [
        { studentIds: ['s1', 's2'], completions: { s1: T0 }, dueDate: T0 - 1000 },
        { studentIds: ['s1'], completions: {}, dueDate: T0 + 1000 },
      ],
      chats: { rooms: [{ messages: [{}, {}] }, { messages: [{}] }] },
      bookstore: { listings: [{ status: 'pending', partnerId: 'u_admin' }, { status: 'approved', partnerId: 'u_other' }], orders: [{}] },
      marketplace: { listings: [{ status: 'pending' }], orders: [] },
      buffet: { orders: [{ status: 'new', userId: 'u_admin' }, { status: 'confirmed', userId: 'u_other' }] },
    };
    const stats = getDashboardStats(s, actor, moduleStates);
    assert.equal(stats.homework.total, 2);
    assert.equal(stats.homework.completed, 1);
    assert.equal(stats.homework.overdue, 1);
    assert.equal(stats.chats.rooms, 2);
    assert.equal(stats.chats.messages, 3);
    assert.equal(stats.bookstore.pending, 1);
    assert.equal(stats.bookstore.myListings, 1);
    assert.equal(stats.marketplace.pending, 1);
    assert.equal(stats.buffet.pendingOrders, 2);
    assert.equal(stats.buffet.myOrders, 1);
  });

  it('getDashboardStats: handles missing modules', () => {
    const s = fresh();
    const actor = { role: 'teacher', userId: 'u_teacher' };
    const stats = getDashboardStats(s, actor, {});
    assert.equal(stats.homework.total, 0);
    assert.equal(stats.chats.rooms, 0);
  });

  it('getAiAssistantConfig: returns config for each profession', () => {
    for (const prof of ['teacher', 'admin', 'psychologist', 'librarian']) {
      const cfg = getAiAssistantConfig(prof);
      assert.ok(cfg.system.length > 0);
      assert.ok(Array.isArray(cfg.starters));
      assert.ok(cfg.maxTokens > 0);
    }
  });

  it('getAiAssistantConfig: returns default for unknown', () => {
    const cfg = getAiAssistantConfig('unknown');
    assert.ok(cfg.system.length > 0);
    assert.deepEqual(cfg.starters, []);
  });

  it('serializeStaff: returns JSON-safe snapshot', () => {
    const s = fresh();
    upsertStaffProfile(s, { userId: 'u1', name: 'Test' }, { role: 'admin', userId: 'u_admin' });
    const snap = serializeStaff(s);
    assert.equal(snap.schoolId, 'school-1');
    assert.equal(snap.staff.length, 1);
    assert.equal(snap.audit.length, 1);
    assert.ok(!('clock' in snap));
  });
});
