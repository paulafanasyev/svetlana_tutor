// Chat system domain logic («Чаты ЦШ»).
//
// PURE, framework-independent ES module: no React, no network, no localStorage.
// Supports multiple chat rooms (school-wide, staff, class, group, personal).
// Messages are text-only for now (file exchange metadata can be added later).
//
// Roles: any user can participate in chats they have access to. Room visibility
// is controlled by room.members (list of userIds) or room.isPublic (school-wide).
//
// Rejections throw ChatError with a stable `.code` and Russian `.message`.

export const CHAT_ERROR_MESSAGES = Object.freeze({
  INVALID_SCHOOL: 'Некорректный идентификатор школы.',
  INVALID_USER: 'Не указан идентификатор пользователя.',
  FORBIDDEN: 'Недостаточно прав для этого действия.',
  INVALID_ROOM: 'Некорректная комната: нужны название и тип.',
  INVALID_MESSAGE: 'Некорректное сообщение: нужен текст.',
  ROOM_NOT_FOUND: 'Комната не найдена.',
  NOT_A_MEMBER: 'Вы не являетесь участником этой комнаты.',
});

export class ChatError extends Error {
  constructor(code, details) {
    super(CHAT_ERROR_MESSAGES[code] || code);
    this.name = 'ChatError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const fail = (code, details) => { throw new ChatError(code, details); };

export const ROOM_TYPES = Object.freeze(['school', 'staff', 'class', 'group', 'personal']);

function cloneRoom(room) {
  return { ...room, members: [...room.members], messages: room.messages.map((m) => ({ ...m })) };
}

function validateUserId(userId) {
  if (typeof userId !== 'string' || !userId.trim()) fail('INVALID_USER', { userId });
  return userId.trim();
}

function recordAudit(state, action, userId, details) {
  state.audit.push({
    at: state.clock(),
    action,
    userId,
    details: { ...details },
  });
  if (state.audit.length > 500) state.audit.splice(0, state.audit.length - 500);
}

function normalizeRoom(raw) {
  if (!raw || typeof raw !== 'object') fail('INVALID_ROOM');
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fail('INVALID_ROOM', { field: 'id' });
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fail('INVALID_ROOM', { field: 'name' });
  const type = ROOM_TYPES.includes(raw.type) ? raw.type : fail('INVALID_ROOM', { field: 'type' });
  if (!Array.isArray(raw.members)) fail('INVALID_ROOM', { field: 'members' });
  const members = raw.members.map((m) => validateUserId(m));
  const isPublic = Boolean(raw.isPublic);
  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : fail('INVALID_ROOM', { field: 'createdAt' });
  const createdBy = typeof raw.createdBy === 'string' && raw.createdBy.trim() ? raw.createdBy.trim() : fail('INVALID_ROOM', { field: 'createdBy' });

  return {
    id,
    name,
    type,
    members,
    isPublic,
    createdAt,
    createdBy,
    messages: Array.isArray(raw.messages) ? raw.messages.map((m) => ({ ...m })) : [],
  };
}

export function createChat({
  schoolId = null,
  rooms = [],
  audit = [],
  clock = () => Date.now(),
  nextId,
} = {}) {
  if (schoolId !== null && (typeof schoolId !== 'string' || !schoolId.trim())) fail('INVALID_SCHOOL', { schoolId });
  if (typeof clock !== 'function') fail('INVALID_SCHOOL', { reason: 'clock must be a function' });
  if (!Array.isArray(rooms)) fail('INVALID_ROOM', { reason: 'rooms must be an array' });
  const items = rooms.map(normalizeRoom);
  if (new Set(items.map((r) => r.id)).size !== items.length) fail('INVALID_ROOM', { reason: 'duplicate ids' });

  let counter = 0;
  const idGen = typeof nextId === 'function' ? nextId : () => `room-${++counter}`;

  return {
    schoolId: typeof schoolId === 'string' ? schoolId.trim() : null,
    rooms: items,
    audit: (Array.isArray(audit) ? audit : []).map((e) => ({ ...e, details: { ...(e.details || {}) } })),
    clock,
    nextId: idGen,
  };
}

export function serializeChat(state) {
  return {
    schoolId: state.schoolId,
    rooms: state.rooms.map(cloneRoom),
    audit: state.audit.map((e) => ({ ...e, details: { ...e.details } })),
  };
}

export function listRooms(state, userId) {
  const uid = validateUserId(userId);
  return state.rooms.filter((r) => r.isPublic || r.members.includes(uid)).map(cloneRoom);
}

export function getRoom(state, roomId, userId) {
  const uid = validateUserId(userId);
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) fail('ROOM_NOT_FOUND', { roomId });
  if (!room.isPublic && !room.members.includes(uid)) fail('NOT_A_MEMBER', { roomId });
  return cloneRoom(room);
}

export function createRoom(state, raw, userId) {
  const uid = validateUserId(userId);
  const room = normalizeRoom({
    ...raw,
    id: raw.id || state.nextId(),
    createdAt: state.clock(),
    createdBy: uid,
  });
  if (state.rooms.some((r) => r.id === room.id)) fail('INVALID_ROOM', { reason: 'duplicate id' });
  // Creator is automatically a member
  if (!room.members.includes(uid)) room.members.push(uid);
  state.rooms.push(room);
  recordAudit(state, 'room_created', uid, { roomId: room.id, name: room.name, type: room.type });
  return cloneRoom(room);
}

export function sendMessage(state, roomId, text, userId) {
  const uid = validateUserId(userId);
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) fail('ROOM_NOT_FOUND', { roomId });
  if (!room.isPublic && !room.members.includes(uid)) fail('NOT_A_MEMBER', { roomId });
  if (typeof text !== 'string' || !text.trim()) fail('INVALID_MESSAGE', { text });

  const msg = {
    id: 'msg-' + state.clock() + '-' + Math.random().toString(36).slice(2, 7),
    userId: uid,
    text: text.trim(),
    createdAt: state.clock(),
  };
  room.messages.push(msg);
  recordAudit(state, 'message_sent', uid, { roomId, messageId: msg.id });
  return { ...msg };
}

export function addMember(state, roomId, newMemberId, actorId) {
  const actor = validateUserId(actorId);
  const newMember = validateUserId(newMemberId);
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) fail('ROOM_NOT_FOUND', { roomId });
  if (!room.members.includes(actor)) fail('NOT_A_MEMBER', { roomId });
  if (room.members.includes(newMember)) return cloneRoom(room); // idempotent
  room.members.push(newMember);
  recordAudit(state, 'member_added', actor, { roomId, newMember });
  return cloneRoom(room);
}

export function removeMember(state, roomId, memberId, actorId) {
  const actor = validateUserId(actorId);
  const member = validateUserId(memberId);
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) fail('ROOM_NOT_FOUND', { roomId });
  if (!room.members.includes(actor)) fail('NOT_A_MEMBER', { roomId });
  if (!room.members.includes(member)) return cloneRoom(room); // idempotent
  if (member === room.createdBy) fail('FORBIDDEN', { reason: 'cannot remove creator' });
  room.members = room.members.filter((m) => m !== member);
  recordAudit(state, 'member_removed', actor, { roomId, member });
  return cloneRoom(room);
}

export function getRoomStats(state, roomId) {
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) fail('ROOM_NOT_FOUND', { roomId });
  return {
    memberCount: room.members.length,
    messageCount: room.messages.length,
    lastMessage: room.messages.length > 0 ? room.messages[room.messages.length - 1] : null,
  };
}
