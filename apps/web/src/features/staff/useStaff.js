// Bridges the pure staff domain (staff.js) to the app: localStorage persistence,
// the logged-in user, and React re-renders. Aggregates data from other module hooks.
import { useCallback, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { storage } from '../../core/storage.js';
import {
  createStaff, serializeStaff, getStaffProfile, upsertStaffProfile,
  getDashboardStats, getAiAssistantConfig,
} from './staff.js';

const STAFF_KEY = 'aet_staff_school_v1';

export function staffRoleOf(user) {
  if (!user) return 'teacher';
  if (user.role === 'ADMIN') return 'admin';
  return 'teacher';
}

function loadState() {
  const saved = storage.get(STAFF_KEY, null) || {};
  return createStaff({
    schoolId: saved.schoolId || 'school-demo',
    staff: Array.isArray(saved.staff) ? saved.staff : [],
    audit: Array.isArray(saved.audit) ? saved.audit : [],
    clock: () => Date.now(),
  });
}

function persist(state) {
  const snap = serializeStaff(state);
  storage.set(STAFF_KEY, snap);
}

export function useStaff() {
  const { user } = useApp();
  const userId = user?.id || null;
  const role = staffRoleOf(user);
  const stateRef = useRef(null);
  if (stateRef.current === null) {
    stateRef.current = loadState();
  }
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
  const profile = userId ? getStaffProfile(state, userId) : null;

  return {
    role,
    userId,
    profile,
    getDashboard: (moduleStates) => getDashboardStats(state, actor, moduleStates),
    getAiConfig: (profession) => getAiAssistantConfig(profession || profile?.aiProfession || role),
    updateProfile: (patch) => run((s) => upsertStaffProfile(s, { ...profile, ...patch, userId }, actor)),
  };
}
