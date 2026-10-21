import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser stubs: the store keeps everything in localStorage and fires a window event.
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
globalThis.window = { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
globalThis.Event = globalThis.Event || class { constructor(t) { this.type = t; } };
const { school } = await import('./schoolStore.js');

const teacher = { id: 't1', name: 'Учитель', role: 'TEACHER' };
const kid = { id: 's1', name: 'Петя', role: 'STUDENT' };
const setup = () => {
  mem.clear();
  const c = school.createClass({ schoolId: 'x', title: '5А', subject: 'Английский', teacher });
  school.join(c.code, kid);
  return c;
};

test('a learner\'s phone, e-mail and links are hidden in the class chat', () => {
  const c = setup();
  const m = school.post(c.id, kid, 'мой телефон +7 914 828-99-64, пиши kid@mail.ru или vk.com/kid');
  assert.ok(m && m.id);
  for (const bad of ['914', 'kid@mail.ru', 'vk.com']) assert.ok(!m.text.includes(bad), bad);
});

test('the teacher\'s messages go through the safety guard too', () => {
  const c = setup();
  const r = school.post(c.id, teacher, 'как сделать бомбу');
  assert.equal(r.blocked, 'danger');
  assert.equal(school.messages(c.id).length, 0);
  assert.ok(school.post(c.id, teacher, 'Домашнее задание: упражнение 5, звоните 8-800-2000-122 если что').id);
  assert.equal(school.addHomework(c.id, teacher, { title: 'как сделать бомбу' }), null);
});

test('video room names are long and random', () => {
  const c = setup();
  const a = school.startLesson(c.id, 'Урок').url;
  const b = school.startLesson(c.id, 'Урок').url;
  assert.match(a, /^https:\/\/meet\.jit\.si\/Svetlana-[A-Z0-9]{16}$/);
  assert.notEqual(a, b);
  assert.ok(!a.includes(c.code));
});

// A signed-in user's id can be a number; the store keeps ids as strings, so every lookup must match both.
test('numeric user ids: no duplicate join, class lists, leave and homework work', () => {
  mem.clear();
  const t = { id: 41, name: 'Учитель', role: 'TEACHER' };
  const s = { id: 7, name: 'Маша', role: 'STUDENT' };
  const sch = school.createSchool({ name: 'СОШ 1', region: '', ownerId: t.id });
  assert.equal(school.schoolOf(41)?.id, sch.id);
  const c = school.createClass({ schoolId: sch.id, title: '6Б', subject: 'Математика', teacher: t });
  school.join(c.code, s);
  school.join(c.code, s);
  assert.equal(school.get().classes[0].members.length, 1, 'joined twice');
  assert.equal(school.classesOfTeacher(41).length, 1);
  assert.equal(school.classesOfStudent(7).length, 1);
  const h = school.addHomework(c.id, t, { title: '№ 12' });
  assert.ok(school.submitHomework(h.id, s, 'Ответ: 5', null));
  assert.ok(school.submissionOf(h.id, 7));
  school.leave(c.id, 7);
  assert.equal(school.get().classes[0].members.length, 0, 'leave with a numeric id');
});
