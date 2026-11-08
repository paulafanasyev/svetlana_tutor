// Deterministic node:test suite for the chat domain logic.
// Run from apps/web:  node --test src/features/chat/chat.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createChat, serializeChat, listRooms, getRoom, createRoom,
  sendMessage, addMember, removeMember, getRoomStats,
  ChatError, ROOM_TYPES, CHAT_ERROR_MESSAGES,
} from './chat.js';

const T0 = 1700000000000;
const USER1 = 'user-1';
const USER2 = 'user-2';
const USER3 = 'user-3';

function makeState(opts = {}) {
  let n = 0;
  return createChat({
    schoolId: 'school-42',
    clock: () => T0,
    nextId: () => `room-${++n}`,
    ...opts,
  });
}

const code = (c) => (e) => e instanceof ChatError && e.code === c;

test('createChat builds an isolated store', () => {
  const state = makeState();
  assert.equal(state.schoolId, 'school-42');
  assert.deepEqual(state.rooms, []);
  assert.deepEqual(state.audit, []);
  assert.throws(() => createChat({ schoolId: '' }), code('INVALID_SCHOOL'));
});

test('user creates a school-wide public room', () => {
  const state = makeState();
  const room = createRoom(state, {
    name: 'Общий чат школы',
    type: 'school',
    members: [],
    isPublic: true,
  }, USER1);

  assert.equal(room.id, 'room-1');
  assert.equal(room.name, 'Общий чат школы');
  assert.equal(room.type, 'school');
  assert.equal(room.isPublic, true);
  assert.ok(room.members.includes(USER1), 'creator is auto-added');
  assert.equal(room.createdBy, USER1);
  assert.equal(room.createdAt, T0);
  assert.equal(state.rooms.length, 1);
  assert.ok(state.audit.some((e) => e.action === 'room_created'));
});

test('room types are validated', () => {
  const state = makeState();
  for (const type of ROOM_TYPES) {
    const room = createRoom(state, { name: 'Test', type, members: [], isPublic: false }, USER1);
    assert.equal(room.type, type);
  }
  assert.throws(() => createRoom(state, { name: 'Bad', type: 'invalid', members: [] }, USER1), code('INVALID_ROOM'));
});

test('user creates a personal room and invites another user', () => {
  const state = makeState();
  const room = createRoom(state, {
    name: 'Личный чат',
    type: 'personal',
    members: [USER2],
    isPublic: false,
  }, USER1);

  assert.ok(room.members.includes(USER1));
  assert.ok(room.members.includes(USER2));

  const added = addMember(state, room.id, USER3, USER1);
  assert.ok(added.members.includes(USER3));
  assert.equal(added.members.length, 3);
});

test('non-member cannot access private room', () => {
  const state = makeState();
  const room = createRoom(state, {
    name: 'Private',
    type: 'group',
    members: [USER2],
    isPublic: false,
  }, USER1);

  assert.throws(() => getRoom(state, room.id, USER3), code('NOT_A_MEMBER'));
  assert.throws(() => sendMessage(state, room.id, 'hello', USER3), code('NOT_A_MEMBER'));
});

test('public room is accessible to all users', () => {
  const state = makeState();
  const room = createRoom(state, {
    name: 'Public',
    type: 'school',
    members: [],
    isPublic: true,
  }, USER1);

  const fetched = getRoom(state, room.id, USER3);
  assert.equal(fetched.name, 'Public');

  const msg = sendMessage(state, room.id, 'hello everyone', USER3);
  assert.equal(msg.text, 'hello everyone');
  assert.equal(msg.userId, USER3);
});

test('user sends messages in a room', () => {
  const state = makeState();
  const room = createRoom(state, {
    name: 'Chat',
    type: 'group',
    members: [],
    isPublic: true,
  }, USER1);

  const msg1 = sendMessage(state, room.id, 'First message', USER1);
  const msg2 = sendMessage(state, room.id, 'Second message', USER2);

  assert.equal(msg1.text, 'First message');
  assert.equal(msg2.text, 'Second message');

  const fetched = getRoom(state, room.id, USER1);
  assert.equal(fetched.messages.length, 2);
  assert.equal(fetched.messages[0].text, 'First message');
  assert.equal(fetched.messages[1].text, 'Second message');
});

test('sendMessage validates text', () => {
  const state = makeState();
  const room = createRoom(state, { name: 'Chat', type: 'group', members: [], isPublic: true }, USER1);

  assert.throws(() => sendMessage(state, room.id, '', USER1), code('INVALID_MESSAGE'));
  assert.throws(() => sendMessage(state, room.id, '   ', USER1), code('INVALID_MESSAGE'));
});

test('listRooms returns public rooms + user\'s private rooms', () => {
  const state = makeState();
  createRoom(state, { name: 'Public', type: 'school', members: [], isPublic: true }, USER1);
  createRoom(state, { name: 'Private A', type: 'group', members: [USER2], isPublic: false }, USER1);
  createRoom(state, { name: 'Private B', type: 'group', members: [USER3], isPublic: false }, USER1);

  const user1Rooms = listRooms(state, USER1);
  assert.equal(user1Rooms.length, 3); // public + 2 private (creator is member)

  const user2Rooms = listRooms(state, USER2);
  assert.equal(user2Rooms.length, 2); // public + Private A

  const user3Rooms = listRooms(state, USER3);
  assert.equal(user3Rooms.length, 2); // public + Private B
});

test('member can be removed from room (except creator)', () => {
  const state = makeState();
  const room = createRoom(state, {
    name: 'Chat',
    type: 'group',
    members: [USER2, USER3],
    isPublic: false,
  }, USER1);

  const updated = removeMember(state, room.id, USER2, USER1);
  assert.ok(!updated.members.includes(USER2));
  assert.ok(updated.members.includes(USER1));
  assert.ok(updated.members.includes(USER3));

  // Cannot remove creator
  assert.throws(() => removeMember(state, room.id, USER1, USER3), code('FORBIDDEN'));
});

test('getRoomStats returns member and message counts', () => {
  const state = makeState();
  const room = createRoom(state, {
    name: 'Chat',
    type: 'group',
    members: [USER2],
    isPublic: false,
  }, USER1);

  sendMessage(state, room.id, 'msg1', USER1);
  sendMessage(state, room.id, 'msg2', USER2);

  const stats = getRoomStats(state, room.id);
  assert.equal(stats.memberCount, 2);
  assert.equal(stats.messageCount, 2);
  assert.equal(stats.lastMessage.text, 'msg2');
});

test('serializeChat round-trips through JSON', () => {
  const state = makeState();
  createRoom(state, { name: 'Chat', type: 'group', members: [], isPublic: true }, USER1);
  sendMessage(state, 'room-1', 'hello', USER1);

  const json = JSON.stringify(serializeChat(state));
  const data = JSON.parse(json);
  let n = 100;
  const restored = createChat({ ...data, clock: () => T0, nextId: () => `room-${++n}` });
  assert.equal(restored.schoolId, 'school-42');
  assert.equal(restored.rooms.length, 1);
  assert.equal(restored.rooms[0].messages.length, 1);
});

test('room validation rejects bad shape', () => {
  const state = makeState();
  const bad = [
    { name: '', type: 'group', members: [] },
    { name: 'Test', type: 'invalid', members: [] },
    { name: 'Test', type: 'group', members: 'not-array' },
  ];
  for (const b of bad) {
    assert.throws(() => createRoom(state, b, USER1), code('INVALID_ROOM'));
  }
  assert.equal(state.rooms.length, 0);
});

test('error messages are exposed for UI wiring', () => {
  assert.ok(CHAT_ERROR_MESSAGES.INVALID_SCHOOL.length > 0);
  assert.equal(new ChatError('ROOM_NOT_FOUND').message, CHAT_ERROR_MESSAGES.ROOM_NOT_FOUND);
});
