// Homework assignment domain logic («Домашние задания ЦШ»).
//
// PURE, framework-independent ES module: no React, no network, no localStorage.
// Teachers assign homework to classes or individual students; students mark tasks
// as complete; parents/teachers view progress. All money/time uses injectable clock
// for deterministic tests.
//
// Roles: 'teacher' | 'student' | 'parent' | 'admin'. Teachers create and view all;
// students see only their own; parents see their child's; admin sees all.
//
// Rejections throw HomeworkError with a stable `.code` and Russian `.message`.

export const HOMEWORK_STATUSES = Object.freeze(['assigned', 'completed', 'overdue']);
export const HOMEWORK_ERROR_MESSAGES = Object.freeze({
  INVALID_SCHOOL: 'Некорректный идентификатор школы.',
  INVALID_ROLE: 'Неизвестная роль пользователя.',
  INVALID_USER: 'Не указан идентификатор пользователя.',
  FORBIDDEN: 'Недостаточно прав для этого действия.',
  INVALID_HOMEWORK: 'Некорректное задание: нужны название, класс, предмет, описание и срок сдачи.',
  NOT_FOUND: 'Задание не найдено.',
  ALREADY_COMPLETED: 'Задание уже выполнено.',
  INVALID_STATUS: 'Недопустимый статус задания.',
});

export class HomeworkError extends Error {
  constructor(code, details) {
    super(HOMEWORK_ERROR_MESSAGES[code] || code);
    this.name = 'HomeworkError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const fail = (code, details) => { throw new HomeworkError(code, details); };

function cloneHomework(hw) {
  return { ...hw, studentIds: [...hw.studentIds], completions: { ...hw.completions } };
}

function validateRole(role) {
  if (!['teacher', 'student', 'parent', 'admin'].includes(role)) fail('INVALID_ROLE', { role });
  return role;
}

function validateUserId(userId) {
  if (typeof userId !== 'string' || !userId.trim()) fail('INVALID_USER', { userId });
  return userId.trim();
}

function requireTeacher(actor) {
  if (!actor || typeof actor !== 'object') fail('FORBIDDEN');
  const role = validateRole(actor.role);
  if (role !== 'teacher' && role !== 'admin') fail('FORBIDDEN', { role });
  return { role, userId: validateUserId(actor.userId) };
}

function requireStudent(actor) {
  if (!actor || typeof actor !== 'object') fail('FORBIDDEN');
  const role = validateRole(actor.role);
  if (role !== 'student') fail('FORBIDDEN', { role });
  return { role, userId: validateUserId(actor.userId) };
}

function requireParent(actor) {
  if (!actor || typeof actor !== 'object') fail('FORBIDDEN');
  const role = validateRole(actor.role);
  if (role !== 'parent') fail('FORBIDDEN', { role });
  return { role, userId: validateUserId(actor.userId) };
}

function recordAudit(state, action, actor, details) {
  state.audit.push({
    at: state.clock(),
    action,
    actorRole: actor && actor.role ? actor.role : null,
    actorId: actor && actor.userId ? actor.userId : null,
    details: { ...details },
  });
  if (state.audit.length > 500) state.audit.splice(0, state.audit.length - 500);
}

function normalizeHomework(raw) {
  if (!raw || typeof raw !== 'object') fail('INVALID_HOMEWORK');
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fail('INVALID_HOMEWORK', { field: 'id' });
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : fail('INVALID_HOMEWORK', { field: 'title' });
  const className = typeof raw.className === 'string' && raw.className.trim() ? raw.className.trim() : fail('INVALID_HOMEWORK', { field: 'className' });
  const subject = typeof raw.subject === 'string' && raw.subject.trim() ? raw.subject.trim() : fail('INVALID_HOMEWORK', { field: 'subject' });
  const description = typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : fail('INVALID_HOMEWORK', { field: 'description' });
  if (!Array.isArray(raw.studentIds) || raw.studentIds.length === 0) fail('INVALID_HOMEWORK', { field: 'studentIds' });
  if (!raw.studentIds.every((sid) => typeof sid === 'string' && sid.trim())) fail('INVALID_HOMEWORK', { field: 'studentIds' });
  if (typeof raw.dueDate !== 'number' || !Number.isFinite(raw.dueDate) || raw.dueDate <= 0) fail('INVALID_HOMEWORK', { field: 'dueDate' });
  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : fail('INVALID_HOMEWORK', { field: 'createdAt' });
  const createdBy = typeof raw.createdBy === 'string' && raw.createdBy.trim() ? raw.createdBy.trim() : fail('INVALID_HOMEWORK', { field: 'createdBy' });

  return {
    id,
    title,
    className,
    subject,
    description,
    studentIds: raw.studentIds.map((s) => s.trim()),
    dueDate: raw.dueDate,
    createdAt,
    createdBy,
    completions: raw.completions && typeof raw.completions === 'object' ? { ...raw.completions } : {},
  };
}

export function createHomework({
  schoolId = null,
  homework = [],
  audit = [],
  clock = () => Date.now(),
  nextId,
} = {}) {
  if (schoolId !== null && (typeof schoolId !== 'string' || !schoolId.trim())) fail('INVALID_SCHOOL', { schoolId });
  if (typeof clock !== 'function') fail('INVALID_SCHOOL', { reason: 'clock must be a function' });
  if (!Array.isArray(homework)) fail('INVALID_HOMEWORK', { reason: 'homework must be an array' });
  const items = homework.map(normalizeHomework);
  if (new Set(items.map((h) => h.id)).size !== items.length) fail('INVALID_HOMEWORK', { reason: 'duplicate ids' });

  let counter = 0;
  const idGen = typeof nextId === 'function' ? nextId : () => `hw-${++counter}`;

  return {
    schoolId: typeof schoolId === 'string' ? schoolId.trim() : null,
    homework: items,
    audit: (Array.isArray(audit) ? audit : []).map((e) => ({ ...e, details: { ...(e.details || {}) } })),
    clock,
    nextId: idGen,
  };
}

export function serializeHomework(state) {
  return {
    schoolId: state.schoolId,
    homework: state.homework.map(cloneHomework),
    audit: state.audit.map((e) => ({ ...e, details: { ...e.details } })),
  };
}

export function listHomework(state, actor) {
  if (!actor || typeof actor !== 'object') fail('FORBIDDEN');
  const role = validateRole(actor.role);
  const userId = validateUserId(actor.userId);

  if (role === 'teacher' || role === 'admin') {
    return state.homework.map(cloneHomework);
  }
  if (role === 'student') {
    return state.homework.filter((h) => h.studentIds.includes(userId)).map(cloneHomework);
  }
  if (role === 'parent') {
    // Parent sees homework for their child. For now, assume parent.userId maps to a student.
    // In a real system, parent would have a childId field. Simplified: parent sees all (scoped later).
    return state.homework.map(cloneHomework);
  }
  fail('FORBIDDEN', { role });
}

export function getHomework(state, homeworkId, actor) {
  if (!actor || typeof actor !== 'object') fail('FORBIDDEN');
  const role = validateRole(actor.role);
  const userId = validateUserId(actor.userId);
  const hw = state.homework.find((h) => h.id === homeworkId);
  if (!hw) fail('NOT_FOUND', { homeworkId });
  if (role === 'student' && !hw.studentIds.includes(userId)) fail('FORBIDDEN', { homeworkId });
  return cloneHomework(hw);
}

export function createHomeworkAssignment(state, raw, actor) {
  const teacher = requireTeacher(actor);
  const hw = normalizeHomework({
    ...raw,
    id: raw.id || state.nextId(),
    createdAt: state.clock(),
    createdBy: teacher.userId,
  });
  if (state.homework.some((h) => h.id === hw.id)) fail('INVALID_HOMEWORK', { reason: 'duplicate id' });
  state.homework.push(hw);
  recordAudit(state, 'homework_created', teacher, { homeworkId: hw.id, title: hw.title, className: hw.className, studentCount: hw.studentIds.length });
  return cloneHomework(hw);
}

export function markHomeworkComplete(state, homeworkId, actor) {
  const student = requireStudent(actor);
  const hw = state.homework.find((h) => h.id === homeworkId);
  if (!hw) fail('NOT_FOUND', { homeworkId });
  if (!hw.studentIds.includes(student.userId)) fail('FORBIDDEN', { homeworkId });
  if (hw.completions[student.userId]) fail('ALREADY_COMPLETED', { homeworkId, userId: student.userId });
  hw.completions[student.userId] = state.clock();
  recordAudit(state, 'homework_completed', student, { homeworkId, completedAt: hw.completions[student.userId] });
  return cloneHomework(hw);
}

export function getHomeworkStats(state, actor) {
  if (!actor || typeof actor !== 'object') fail('FORBIDDEN');
  const role = validateRole(actor.role);
  const userId = validateUserId(actor.userId);

  const now = state.clock();
  let total = 0, completed = 0, overdue = 0;

  if (role === 'student') {
    const myHw = state.homework.filter((h) => h.studentIds.includes(userId));
    total = myHw.length;
    completed = myHw.filter((h) => h.completions[userId]).length;
    overdue = myHw.filter((h) => !h.completions[userId] && h.dueDate < now).length;
  } else if (role === 'teacher' || role === 'admin') {
    for (const hw of state.homework) {
      total += hw.studentIds.length;
      for (const sid of hw.studentIds) {
        if (hw.completions[sid]) completed++;
        else if (hw.dueDate < now) overdue++;
      }
    }
  } else if (role === 'parent') {
    for (const hw of state.homework) {
      total += hw.studentIds.length;
      for (const sid of hw.studentIds) {
        if (hw.completions[sid]) completed++;
        else if (hw.dueDate < now) overdue++;
      }
    }
  }

  return { total, completed, overdue };
}
