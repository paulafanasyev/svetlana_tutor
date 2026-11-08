// Bridges the pure homework domain (homework.js) to the app: localStorage
// persistence, the logged-in user, and React re-renders. Mirrors useBookstore.
import { useCallback, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { storage } from '../../core/storage.js';
import {
  createHomework, serializeHomework, listHomework, getHomework,
  createHomeworkAssignment, markHomeworkComplete, getHomeworkStats,
} from './homework.js';

const SCHOOL_KEY = 'aet_homework_school_v1';
const DEMO_SCHOOL_ID = 'school-demo';

export function homeworkRoleOf(user) {
  if (!user) return 'student';
  if (user.role === 'ADMIN') return 'admin';
  if (user.role === 'TEACHER') return 'teacher';
  if (user.role === 'PARENT') return 'parent';
  return 'student';
}

const newId = () => 'hw-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

function loadState() {
  const school = storage.get(SCHOOL_KEY, null) || {};
  return createHomework({
    schoolId: school.schoolId || DEMO_SCHOOL_ID,
    homework: Array.isArray(school.homework) ? school.homework : [],
    audit: Array.isArray(school.audit) ? school.audit : [],
    clock: () => Date.now(),
    nextId: newId,
  });
}

function persist(state) {
  const snap = serializeHomework(state);
  storage.set(SCHOOL_KEY, {
    schoolId: snap.schoolId,
    homework: snap.homework,
    audit: snap.audit,
  });
}

export function useHomework() {
  const { user } = useApp();
  const userId = user?.id || null;
  const role = homeworkRoleOf(user);
  const stateRef = useRef(null);
  if (stateRef.current === null) stateRef.current = loadState();
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
  const isTeacher = role === 'teacher' || role === 'admin';
  const isStudent = role === 'student';
  const isParent = role === 'parent';

  return {
    role, isTeacher, isStudent, isParent, userId,
    schoolId: state.schoolId,
    list: () => listHomework(state, actor),
    get: (id) => getHomework(state, id, actor),
    stats: () => getHomeworkStats(state, actor),
    assign: (raw) => run((s) => createHomeworkAssignment(s, raw, actor)),
    complete: (id) => run((s) => markHomeworkComplete(s, id, actor)),
  };
}
