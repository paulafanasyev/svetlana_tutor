// Deterministic node:test suite for the homework domain logic.
// Run from apps/web:  node --test src/features/homework/homework.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHomework, serializeHomework, listHomework, getHomework,
  createHomeworkAssignment, markHomeworkComplete, getHomeworkStats,
  HomeworkError, HOMEWORK_ERROR_MESSAGES,
} from './homework.js';

const T0 = 1700000000000;
const TEACHER = { role: 'teacher', userId: 'teacher-1' };
const STUDENT = { role: 'student', userId: 'student-1' };
const STUDENT2 = { role: 'student', userId: 'student-2' };
const PARENT = { role: 'parent', userId: 'parent-1' };
const ADMIN = { role: 'admin', userId: 'admin-1' };

function makeState(opts = {}) {
  let n = 0;
  return createHomework({
    schoolId: 'school-42',
    clock: () => T0,
    nextId: () => `hw-${++n}`,
    ...opts,
  });
}

const code = (c) => (e) => e instanceof HomeworkError && e.code === c;

test('createHomework builds an isolated store', () => {
  const state = makeState();
  assert.equal(state.schoolId, 'school-42');
  assert.deepEqual(state.homework, []);
  assert.deepEqual(state.audit, []);
  assert.throws(() => createHomework({ schoolId: '' }), code('INVALID_SCHOOL'));
});

test('teacher creates homework assignment for a class', () => {
  const state = makeState();
  const hw = createHomeworkAssignment(state, {
    title: 'Решить задачи 1–5',
    className: '7А',
    subject: 'mathematics',
    description: 'Алгебра: квадратные уравнения',
    studentIds: ['student-1', 'student-2'],
    dueDate: T0 + 86400000,
  }, TEACHER);

  assert.equal(hw.id, 'hw-1');
  assert.equal(hw.title, 'Решить задачи 1–5');
  assert.equal(hw.className, '7А');
  assert.equal(hw.subject, 'mathematics');
  assert.deepEqual(hw.studentIds, ['student-1', 'student-2']);
  assert.equal(hw.dueDate, T0 + 86400000);
  assert.equal(hw.createdBy, 'teacher-1');
  assert.equal(hw.createdAt, T0);
  assert.deepEqual(hw.completions, {});
  assert.equal(state.homework.length, 1);
  assert.ok(state.audit.some((e) => e.action === 'homework_created' && e.details.homeworkId === 'hw-1'));
});

test('teacher validates homework shape: title, class, subject, description, students, dueDate', () => {
  const state = makeState();
  const bad = [
    { title: '', className: '7А', subject: 'math', description: 'desc', studentIds: ['s1'], dueDate: T0 + 1000 },
    { title: 'Title', className: '', subject: 'math', description: 'desc', studentIds: ['s1'], dueDate: T0 + 1000 },
    { title: 'Title', className: '7А', subject: '', description: 'desc', studentIds: ['s1'], dueDate: T0 + 1000 },
    { title: 'Title', className: '7А', subject: 'math', description: '', studentIds: ['s1'], dueDate: T0 + 1000 },
    { title: 'Title', className: '7А', subject: 'math', description: 'desc', studentIds: [], dueDate: T0 + 1000 },
    { title: 'Title', className: '7А', subject: 'math', description: 'desc', studentIds: ['s1'], dueDate: 0 },
    { title: 'Title', className: '7А', subject: 'math', description: 'desc', studentIds: ['s1'], dueDate: -1 },
  ];
  for (const b of bad) {
    assert.throws(() => createHomeworkAssignment(state, b, TEACHER), code('INVALID_HOMEWORK'));
  }
  assert.equal(state.homework.length, 0, 'rejected edits change nothing');
});

test('student sees only their own homework', () => {
  const state = makeState();
  createHomeworkAssignment(state, {
    title: 'Task A', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 + 1000,
  }, TEACHER);
  createHomeworkAssignment(state, {
    title: 'Task B', className: '7Б', subject: 'math', description: 'desc',
    studentIds: ['student-2'], dueDate: T0 + 2000,
  }, TEACHER);

  const s1List = listHomework(state, STUDENT);
  assert.equal(s1List.length, 1);
  assert.equal(s1List[0].title, 'Task A');

  const s2List = listHomework(state, STUDENT2);
  assert.equal(s2List.length, 1);
  assert.equal(s2List[0].title, 'Task B');

  const teacherList = listHomework(state, TEACHER);
  assert.equal(teacherList.length, 2);
});

test('student marks homework as complete', () => {
  const state = makeState();
  const hw = createHomeworkAssignment(state, {
    title: 'Task', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 + 1000,
  }, TEACHER);

  const updated = markHomeworkComplete(state, hw.id, STUDENT);
  assert.equal(updated.completions['student-1'], T0);
  assert.ok(state.audit.some((e) => e.action === 'homework_completed' && e.details.homeworkId === hw.id));

  assert.throws(() => markHomeworkComplete(state, hw.id, STUDENT), code('ALREADY_COMPLETED'));
});

test('student cannot complete another student\'s homework', () => {
  const state = makeState();
  const hw = createHomeworkAssignment(state, {
    title: 'Task', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 + 1000,
  }, TEACHER);

  assert.throws(() => markHomeworkComplete(state, hw.id, STUDENT2), code('FORBIDDEN'));
});

test('teacher sees all homework and stats', () => {
  const state = makeState();
  createHomeworkAssignment(state, {
    title: 'Task A', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1', 'student-2'], dueDate: T0 + 1000,
  }, TEACHER);
  createHomeworkAssignment(state, {
    title: 'Task B', className: '7Б', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 - 1000,
  }, TEACHER);

  const all = listHomework(state, TEACHER);
  assert.equal(all.length, 2);

  const stats = getHomeworkStats(state, TEACHER);
  assert.equal(stats.total, 3);
  assert.equal(stats.completed, 0);
  assert.equal(stats.overdue, 1);
});

test('student stats reflect their own progress', () => {
  const state = makeState();
  const hwA = createHomeworkAssignment(state, {
    title: 'Task A', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 + 1000,
  }, TEACHER);
  createHomeworkAssignment(state, {
    title: 'Task B', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 - 1000,
  }, TEACHER);

  markHomeworkComplete(state, hwA.id, STUDENT);

  const stats = getHomeworkStats(state, STUDENT);
  assert.equal(stats.total, 2);
  assert.equal(stats.completed, 1);
  assert.equal(stats.overdue, 1);
});

test('serializeHomework round-trips through JSON', () => {
  const state = makeState();
  createHomeworkAssignment(state, {
    title: 'Task', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 + 1000,
  }, TEACHER);
  markHomeworkComplete(state, 'hw-1', STUDENT);

  const json = JSON.stringify(serializeHomework(state));
  const data = JSON.parse(json);
  let n = 100;
  const restored = createHomework({ ...data, clock: () => T0, nextId: () => `hw-${++n}` });
  assert.equal(restored.schoolId, 'school-42');
  assert.equal(restored.homework.length, 1);
  assert.equal(restored.homework[0].completions['student-1'], T0);
});

test('getHomework returns a clone and validates access', () => {
  const state = makeState();
  const hw = createHomeworkAssignment(state, {
    title: 'Task', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 + 1000,
  }, TEACHER);

  const fetched = getHomework(state, hw.id, STUDENT);
  assert.equal(fetched.title, 'Task');
  fetched.title = 'Hacked';
  assert.equal(state.homework[0].title, 'Task', 'mutation does not leak');

  assert.throws(() => getHomework(state, hw.id, STUDENT2), code('FORBIDDEN'));
  assert.throws(() => getHomework(state, 'ghost', STUDENT), code('NOT_FOUND'));
});

test('admin sees all homework', () => {
  const state = makeState();
  createHomeworkAssignment(state, {
    title: 'Task', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['student-1'], dueDate: T0 + 1000,
  }, TEACHER);

  const all = listHomework(state, ADMIN);
  assert.equal(all.length, 1);
});

test('role validation rejects unknown roles', () => {
  const state = makeState();
  assert.throws(() => listHomework(state, { role: 'hacker', userId: 'x' }), code('INVALID_ROLE'));
  assert.throws(() => createHomeworkAssignment(state, {
    title: 'Task', className: '7А', subject: 'math', description: 'desc',
    studentIds: ['s1'], dueDate: T0 + 1000,
  }, { role: 'hacker', userId: 'x' }), code('INVALID_ROLE'));
});

test('error messages are exposed for UI wiring', () => {
  assert.ok(HOMEWORK_ERROR_MESSAGES.INVALID_SCHOOL.length > 0);
  assert.equal(new HomeworkError('NOT_FOUND').message, HOMEWORK_ERROR_MESSAGES.NOT_FOUND);
});
