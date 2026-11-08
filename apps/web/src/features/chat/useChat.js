// Bridges the pure chat domain (chat.js) to the app: localStorage
// persistence, the logged-in user, and React re-renders. Mirrors useHomework.
import { useCallback, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { storage } from '../../core/storage.js';
import {
  createChat, serializeChat, listRooms, getRoom, createRoom,
  sendMessage, addMember, removeMember, getRoomStats,
} from './chat.js';

const SCHOOL_KEY = 'aet_chat_school_v1';
const DEMO_SCHOOL_ID = 'school-demo';

const newId = () => 'room-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

function loadState() {
  const school = storage.get(SCHOOL_KEY, null) || {};
  return createChat({
    schoolId: school.schoolId || DEMO_SCHOOL_ID,
    rooms: Array.isArray(school.rooms) ? school.rooms : [],
    audit: Array.isArray(school.audit) ? school.audit : [],
    clock: () => Date.now(),
    nextId: newId,
  });
}

function persist(state) {
  const snap = serializeChat(state);
  storage.set(SCHOOL_KEY, {
    schoolId: snap.schoolId,
    rooms: snap.rooms,
    audit: snap.audit,
  });
}

export function useChat() {
  const { user } = useApp();
  const userId = user?.id || null;
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

  return {
    userId,
    rooms: userId ? listRooms(state, userId) : [],
    getRoom: (id) => userId ? getRoom(state, id, userId) : null,
    getStats: (id) => getRoomStats(state, id),
    createRoom: (raw) => run((s) => userId ? createRoom(s, raw, userId) : null),
    send: (roomId, text) => run((s) => userId ? sendMessage(s, roomId, text, userId) : null),
    addMember: (roomId, memberId) => run((s) => userId ? addMember(s, roomId, memberId, userId) : null),
    removeMember: (roomId, memberId) => run((s) => userId ? removeMember(s, roomId, memberId, userId) : null),
  };
}
