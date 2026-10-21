// Demo school store: schools, classes, members, chat, remote lessons, lesson plans and homework.
// Everything lives in this browser's localStorage. A server version is planned for the Russian hosting.
// Chat safety (audit 20.10): only the class teacher and members can post; every message goes through the
// child-safety guard (ai/childSafety.js): dangerous text is not posted, a crisis message is not posted either
// but becomes a private signal for the teacher, and the child sees help lines. Any member can report a message;
// the teacher hides / restores messages and closes signals. 3 reports hide a message until the teacher decides.
// Audit 21.10: the teacher's own messages and homework go through the guard too; a learner's phone, e-mail,
// links, @nicknames and street address are masked before the message is saved; video room names are unguessable.
// All ids are stored as strings; lookups convert the caller's id with String() (a signed-in user's id may be a number).
import { sanitizeCheck, validMark } from './homeworkCheck.js';
import { checkChildSafety, maskContacts } from '../../ai/childSafety.js';

const KEY = 'aet_school_v1';
const EVT = 'aet-school-change';
const AUTO_HIDE_REPORTS = 3;

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v, max = 120) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const txt = (v, max = 3000) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');
const num = (v) => (Number.isFinite(v) ? v : 0);
const isUrl = (v) => typeof v === 'string' && /^https:\/\/meet\.jit\.si\/[A-Za-z0-9-]+$/.test(v);
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const ids = (v) => arr(v).filter((x) => typeof x === 'string').slice(0, 50);

function load() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { d = {}; }
  if (!isObj(d)) d = {};
  const schools = arr(d.schools)
    .filter((s) => isObj(s) && typeof s.id === 'string')
    .map((s) => ({ id: s.id, name: str(s.name), region: str(s.region, 80), ownerId: str(s.ownerId), createdAt: num(s.createdAt) }))
    .filter((s) => s.name);
  const classes = arr(d.classes)
    .filter((c) => isObj(c) && typeof c.id === 'string' && typeof c.code === 'string')
    .map((c) => ({
      id: c.id,
      schoolId: str(c.schoolId),
      title: str(c.title, 20),
      subject: str(c.subject, 60),
      teacherId: str(c.teacherId),
      teacherName: str(c.teacherName, 60),
      code: str(c.code, 10).toUpperCase(),
      members: arr(c.members).filter((m) => isObj(m) && typeof m.id === 'string').map((m) => ({ id: m.id, name: str(m.name, 60), joinedAt: num(m.joinedAt) })),
      lesson: isObj(c.lesson) && isUrl(c.lesson.url) ? { url: c.lesson.url, topic: str(c.lesson.topic, 140), startedAt: num(c.lesson.startedAt) } : null,
      createdAt: num(c.createdAt),
    }))
    .filter((c) => c.title && c.code);
  const messages = {};
  if (isObj(d.messages)) {
    for (const [k, v] of Object.entries(d.messages)) {
      messages[k] = arr(v)
        .filter((m) => isObj(m) && typeof m.id === 'string')
        .map((m) => ({ id: m.id, userId: str(m.userId), name: str(m.name, 60), role: str(m.role, 20), text: typeof m.text === 'string' ? m.text.slice(0, 2000) : '', kind: m.kind === 'hw' ? 'hw' : 'msg', at: num(m.at), hidden: m.hidden === true, reports: ids(m.reports) }))
        .filter((m) => m.text);
    }
  }
  const incidents = arr(d.incidents)
    .filter((x) => isObj(x) && typeof x.id === 'string' && typeof x.classId === 'string')
    .map((x) => ({ id: x.id, classId: x.classId, userId: str(x.userId), name: str(x.name, 60), kind: ['crisis', 'danger', 'report'].includes(x.kind) ? x.kind : 'report', text: typeof x.text === 'string' ? x.text.slice(0, 2000) : '', msgId: str(x.msgId), by: str(x.by, 60), at: num(x.at), resolved: x.resolved === true }))
    .slice(-300);
  const plans = {};
  if (isObj(d.plans)) for (const [k, v] of Object.entries(d.plans)) if (isObj(v)) plans[k] = v;
  const homework = arr(d.homework)
    .filter((h) => isObj(h) && typeof h.id === 'string' && typeof h.classId === 'string')
    .map((h) => ({ id: h.id, classId: h.classId, teacherId: str(h.teacherId), title: str(h.title, 140), text: txt(h.text), expected: str(h.expected, 300), due: isDay(h.due) ? h.due : '', createdAt: num(h.createdAt) }))
    .filter((h) => h.title);
  const submissions = arr(d.submissions)
    .filter((x) => isObj(x) && typeof x.id === 'string' && typeof x.hwId === 'string' && typeof x.studentId === 'string')
    .map((x) => ({ id: x.id, hwId: x.hwId, studentId: x.studentId, name: str(x.name, 60), text: txt(x.text, 5000), at: num(x.at), check: sanitizeCheck(x.check), mark: validMark(x.mark), comment: str(x.comment, 500), reviewedAt: num(x.reviewedAt) }))
    .filter((x) => x.text);
  return { schools, classes, messages, incidents, plans, homework, submissions };
}
function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
  try { window.dispatchEvent(new Event(EVT)); } catch {}
  return db;
}
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
const clean = (s, max = 120) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
const ruDay = (d) => (isDay(d) ? `${d.slice(8, 10)}.${d.slice(5, 7)}` : '');
const inClass = (c, userId) => !!c && (c.teacherId === String(userId) || c.members.some((m) => m.id === String(userId)));

export const school = {
  get: load,
  subscribe(fn) {
    const h = (e) => { if (!e || e.type !== 'storage' || e.key === KEY) fn(load()); };
    window.addEventListener(EVT, h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener(EVT, h); window.removeEventListener('storage', h); };
  },

  createSchool({ name, region, ownerId }) {
    const db = load();
    const s = { id: uid('sch'), name: clean(name), region: clean(region, 80), ownerId: String(ownerId), createdAt: Date.now() };
    if (!s.name) return null;
    db.schools.push(s);
    save(db);
    return s;
  },
  schoolOf(ownerId) { return load().schools.find((s) => s.ownerId === String(ownerId)) || null; },
  schoolById(id) { return load().schools.find((s) => s.id === id) || null; },

  createClass({ schoolId, title, subject, teacher }) {
    const db = load();
    let code = makeCode();
    while (db.classes.some((c) => c.code === code)) code = makeCode();
    const c = { id: uid('cls'), schoolId, title: clean(title, 20), subject: clean(subject, 60), teacherId: String(teacher.id), teacherName: clean(teacher.name, 60), code, members: [], lesson: null, createdAt: Date.now() };
    if (!c.title) return null;
    db.classes.push(c);
    save(db);
    return c;
  },
  classesOfTeacher(id) { return load().classes.filter((c) => c.teacherId === String(id)); },
  classesOfStudent(id) { return load().classes.filter((c) => c.members.some((m) => m.id === String(id))); },

  join(code, user) {
    const db = load();
    const c = db.classes.find((x) => x.code === clean(code, 10).toUpperCase());
    if (!c) return null;
    if (!c.members.some((m) => m.id === String(user.id))) c.members.push({ id: String(user.id), name: clean(user.name, 60), joinedAt: Date.now() });
    save(db);
    return c;
  },
  leave(classId, userId) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (c) c.members = c.members.filter((m) => m.id !== String(userId));
    save(db);
  },

  // Returns the posted message, or { blocked: 'crisis' | 'danger' | 'member', help } when it was not posted.
  post(classId, user, text, kind = 'msg') {
    const body = String(text || '').trim().slice(0, 2000);
    if (!body) return null;
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (!inClass(c, user?.id)) return { blocked: 'member', help: '' };
    const isTeacher = c.teacherId === String(user.id);
    // The teacher's text is checked too: dangerous instructions are never posted. A teacher writing about help
    // for children in crisis (e.g. sharing the helpline) is not a crisis signal, so only 'danger' blocks a teacher.
    const found = checkChildSafety(body, 'ru');
    const hit = isTeacher && found && found.kind !== 'danger' ? null : found;
    if (hit) {
      db.incidents.push({ id: uid('inc'), classId, userId: String(user.id), name: clean(user.name, 60), kind: hit.kind, text: body, msgId: '', by: '', at: Date.now(), resolved: false });
      save(db);
      return { blocked: hit.kind, help: hit.text };
    }
    const list = db.messages[classId] || (db.messages[classId] = []);
    const shown = isTeacher ? body : maskContacts(body).text;
    const m = { id: uid('msg'), userId: String(user.id), name: clean(user.name, 60), role: String(user.role || ''), text: shown, kind: kind === 'hw' && isTeacher ? 'hw' : 'msg', at: Date.now(), hidden: false, reports: [] };
    list.push(m);
    if (list.length > 500) list.splice(0, list.length - 500);
    save(db);
    return m;
  },
  messages(classId) { return load().messages[classId] || []; },

  // Any class member can report a message (once). The teacher gets a signal; 3 reports hide it for now.
  report(classId, msgId, user) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    const m = (db.messages[classId] || []).find((x) => x.id === msgId);
    if (!m || !inClass(c, user?.id) || m.userId === String(user.id) || m.reports.includes(String(user.id))) return false;
    m.reports.push(String(user.id));
    if (m.reports.length >= AUTO_HIDE_REPORTS) m.hidden = true;
    db.incidents.push({ id: uid('inc'), classId, userId: m.userId, name: m.name, kind: 'report', text: m.text, msgId, by: clean(user.name, 60), at: Date.now(), resolved: false });
    save(db);
    return true;
  },
  // Only the class teacher hides or restores a message.
  setHidden(classId, msgId, teacherId, hidden) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    const m = (db.messages[classId] || []).find((x) => x.id === msgId);
    if (!c || !m || c.teacherId !== String(teacherId)) return false;
    m.hidden = !!hidden;
    if (!hidden) m.reports = [];
    save(db);
    return true;
  },
  incidentsOf(classId) { return load().incidents.filter((x) => x.classId === classId && !x.resolved).sort((a, b) => b.at - a.at); },
  resolveIncident(incidentId, teacherId) {
    const db = load();
    const x = db.incidents.find((i) => i.id === incidentId);
    const c = x && db.classes.find((k) => k.id === x.classId);
    if (!c || c.teacherId !== String(teacherId)) return false;
    x.resolved = true;
    save(db);
    return true;
  },

  startLesson(classId, topic) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (!c) return null;
    // 16 random characters from the crypto source: the room name cannot be guessed from the class code.
    const rnd = new Uint8Array(16);
    try { crypto.getRandomValues(rnd); } catch { for (let i = 0; i < rnd.length; i++) rnd[i] = Math.floor(Math.random() * 256); }
    const room = `Svetlana-${Array.from(rnd, (b) => ALPHA[b % ALPHA.length]).join('')}`;
    c.lesson = { url: `https://meet.jit.si/${room}`, topic: clean(topic, 140), startedAt: Date.now() };
    save(db);
    return c.lesson;
  },
  endLesson(classId) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (c) c.lesson = null;
    save(db);
  },

  // ---- Homework: the teacher assigns, the student submits, Svetlana checks, the teacher confirms the mark.
  addHomework(classId, teacher, { title, text, expected, due } = {}) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (!c || c.teacherId !== String(teacher?.id)) return null;
    const h = { id: uid('hw'), classId, teacherId: String(teacher.id), title: clean(title, 140), text: txt(text), expected: clean(expected, 300), due: isDay(due) ? due : '', createdAt: Date.now() };
    if (!h.title) return null;
    if (checkChildSafety(`${h.title} ${h.text} ${h.expected}`, 'ru')) return null;
    db.homework.push(h);
    const list = db.messages[classId] || (db.messages[classId] = []);
    list.push({ id: uid('msg'), userId: h.teacherId, name: clean(teacher.name, 60), role: String(teacher.role || ''), text: `${h.title}${h.due ? ` (сдать до ${ruDay(h.due)})` : ''}${h.text ? `\n${h.text}` : ''}\nСдать на проверку можно в разделе «Домашние задания».`.slice(0, 2000), kind: 'hw', at: h.createdAt, hidden: false, reports: [] });
    save(db);
    return h;
  },
  removeHomework(hwId, teacherId) {
    const db = load();
    const h = db.homework.find((x) => x.id === hwId);
    if (!h || h.teacherId !== String(teacherId)) return false;
    db.homework = db.homework.filter((x) => x.id !== hwId);
    db.submissions = db.submissions.filter((x) => x.hwId !== hwId);
    save(db);
    return true;
  },
  homeworkOf(classId) { return load().homework.filter((h) => h.classId === classId).sort((a, b) => b.createdAt - a.createdAt); },
  submissionsOf(hwId) { return load().submissions.filter((x) => x.hwId === hwId); },
  submissionOf(hwId, studentId) { return load().submissions.find((x) => x.hwId === hwId && x.studentId === String(studentId)) || null; },

  // Saves (or replaces) the student's answer together with Svetlana's check. A marked answer is locked.
  submitHomework(hwId, student, text, check) {
    const db = load();
    const h = db.homework.find((x) => x.id === hwId);
    const c = h && db.classes.find((x) => x.id === h.classId);
    if (!c || !c.members.some((m) => m.id === String(student?.id))) return null;
    const body = txt(text, 5000);
    if (!body) return null;
    const old = db.submissions.find((x) => x.hwId === hwId && x.studentId === String(student.id));
    if (old && old.mark) return null;
    const sub = { id: old?.id || uid('sub'), hwId, studentId: String(student.id), name: clean(student.name, 60), text: body, at: Date.now(), check: sanitizeCheck(check), mark: null, comment: '', reviewedAt: 0 };
    db.submissions = db.submissions.filter((x) => x !== old);
    db.submissions.push(sub);
    save(db);
    return sub;
  },
  reviewHomework(subId, teacherId, { mark, comment } = {}) {
    const db = load();
    const sub = db.submissions.find((x) => x.id === subId);
    const h = sub && db.homework.find((x) => x.id === sub.hwId);
    if (!h || h.teacherId !== String(teacherId)) return null;
    sub.mark = validMark(mark);
    sub.comment = clean(comment, 500);
    sub.reviewedAt = sub.mark ? Date.now() : 0;
    save(db);
    return sub;
  },

  savePlan(userId, programId, plan) {
    const db = load();
    db.plans[`${userId}:${programId}`] = { ...plan, savedAt: Date.now() };
    save(db);
  },
  // Returns a sanitized saved plan or null.
  getPlan(userId, programId) {
    const p = load().plans[`${userId}:${programId}`];
    if (!p) return null;
    const ints = (v) => arr(v).filter((x) => Number.isInteger(x));
    const lessons = arr(p.lessons)
      .filter((l) => isObj(l))
      .map((l, i) => ({ n: Number.isInteger(l.n) ? l.n : i + 1, date: typeof l.date === 'string' ? l.date : '', section: str(l.section, 300), topic: typeof l.topic === 'string' ? l.topic.slice(0, 2000) : '', hw: typeof l.hw === 'string' ? l.hw.slice(0, 500) : '' }));
    return { start: typeof p.start === 'string' ? p.start : '', days: ints(p.days).filter((x) => x >= 1 && x <= 6), secs: ints(p.secs).filter((x) => x >= 0), lessons };
  },
};
