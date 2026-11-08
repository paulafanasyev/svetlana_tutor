// Pure domain: staff dashboard and AI assistant configuration.
// No React, no localStorage, no network — aggregates data from other modules.

export const STAFF_ERROR_MESSAGES = Object.freeze({
  INVALID_SCHOOL: 'Некорректный идентификатор школы.',
  FORBIDDEN: 'Недостаточно прав для этого действия.',
  INVALID_PROFILE: 'Некорректный профиль сотрудника.',
});

export class StaffError extends Error {
  constructor(code, details) {
    super(STAFF_ERROR_MESSAGES[code] || code);
    this.name = 'StaffError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const fail = (code, details) => { throw new StaffError(code, details); };

export const STAFF_ROLES = ['teacher', 'admin'];
export const AI_PROFESSIONS = ['teacher', 'admin', 'psychologist', 'librarian'];

const MAX_AI_SESSIONS = 100;

function clone(x) { return JSON.parse(JSON.stringify(x)); }

function validateRole(role) {
  if (!STAFF_ROLES.includes(role)) fail('FORBIDDEN', { role });
  return role;
}

function validateUserId(userId) {
  if (typeof userId !== 'string' || !userId.trim()) fail('FORBIDDEN', { reason: 'identity-required' });
  return userId.trim();
}

function recordAudit(state, action, actor, details) {
  state.audit.push({
    at: state.clock(),
    action,
    actorRole: actor?.role || null,
    actorId: actor?.userId || null,
    details: { ...details },
  });
  if (state.audit.length > 500) state.audit.splice(0, state.audit.length - 500);
}

// ── factory ─────────────────────────────────────────────────────────────────

/**
 * Creates a staff dashboard aggregator.
 * @param {object} options
 * @param {string} options.schoolId
 * @param {Function} options.clock
 * @param {Array} [options.staff] — rehydrated staff profiles
 * @param {Array} [options.audit] — rehydrated audit log
 */
export function createStaff({
  schoolId = null,
  staff = [],
  audit = [],
  clock = () => Date.now(),
} = {}) {
  if (schoolId !== null && (typeof schoolId !== 'string' || !schoolId.trim())) {
    fail('INVALID_SCHOOL', { schoolId });
  }
  if (typeof clock !== 'function') fail('INVALID_SCHOOL', { reason: 'clock must be a function' });

  return {
    schoolId: typeof schoolId === 'string' ? schoolId.trim() : null,
    staff: Array.isArray(staff) ? staff.map(clone) : [],
    audit: Array.isArray(audit) ? audit.map((e) => ({ ...e, details: { ...(e.details || {}) } })) : [],
    clock,
  };
}

export function serializeStaff(state) {
  return {
    schoolId: state.schoolId,
    staff: state.staff.map(clone),
    audit: state.audit.map((e) => ({ ...e, details: { ...e.details } })),
  };
}

// ── staff profile ───────────────────────────────────────────────────────────

export function getStaffProfile(state, userId) {
  const uid = validateUserId(userId);
  const profile = state.staff.find((s) => s.userId === uid);
  if (!profile) return null;
  return clone(profile);
}

export function upsertStaffProfile(state, profile, actor) {
  const role = validateRole(actor?.role);
  const uid = validateUserId(actor?.userId);
  if (!profile || typeof profile !== 'object') fail('INVALID_PROFILE');

  const targetId = profile.userId || uid;
  if (targetId !== uid && role !== 'admin') fail('FORBIDDEN', { reason: 'cannot-edit-other' });

  const existing = state.staff.find((s) => s.userId === targetId);
  const updated = {
    userId: targetId,
    role: profile.role || existing?.role || 'teacher',
    name: typeof profile.name === 'string' ? profile.name.trim() : existing?.name || '',
    subjects: Array.isArray(profile.subjects) ? profile.subjects.filter((s) => typeof s === 'string') : existing?.subjects || [],
    classes: Array.isArray(profile.classes) ? profile.classes.filter((c) => typeof c === 'string') : existing?.classes || [],
    aiProfession: profile.aiProfession || existing?.aiProfession || 'teacher',
    aiPreferences: profile.aiPreferences || existing?.aiPreferences || {},
    updatedAt: state.clock(),
  };

  if (existing) {
    const idx = state.staff.findIndex((s) => s.userId === targetId);
    state.staff[idx] = updated;
  } else {
    state.staff.push(updated);
  }

  recordAudit(state, 'staff_profile_updated', actor, { targetUserId: targetId });
  return clone(updated);
}

// ── dashboard stats ─────────────────────────────────────────────────────────

/**
 * Aggregates stats from all modules for the staff dashboard.
 * Accepts module states as parameters (dependency injection).
 */
export function getDashboardStats(state, actor, moduleStates = {}) {
  const role = validateRole(actor?.role);
  const uid = validateUserId(actor?.userId);

  const stats = {
    homework: { total: 0, completed: 0, overdue: 0 },
    chats: { rooms: 0, messages: 0 },
    bookstore: { pending: 0, myListings: 0, orders: 0 },
    marketplace: { pending: 0, myListings: 0, orders: 0 },
    buffet: { pendingOrders: 0, myOrders: 0 },
  };

  if (moduleStates.homework) {
    const hw = moduleStates.homework;
    if (role === 'admin' || role === 'teacher') {
      stats.homework.total = hw.length;
      for (const h of hw) {
        for (const sid of h.studentIds) {
          if (h.completions[sid]) stats.homework.completed++;
          else if (h.dueDate < state.clock()) stats.homework.overdue++;
        }
      }
    }
  }

  if (moduleStates.chats) {
    const chat = moduleStates.chats;
    stats.chats.rooms = chat.rooms?.length || 0;
    stats.chats.messages = chat.rooms?.reduce((sum, r) => sum + (r.messages?.length || 0), 0) || 0;
  }

  if (moduleStates.bookstore) {
    const bs = moduleStates.bookstore;
    stats.bookstore.pending = bs.listings?.filter((l) => l.status === 'pending').length || 0;
    stats.bookstore.myListings = bs.listings?.filter((l) => l.partnerId === uid).length || 0;
    stats.bookstore.orders = bs.orders?.length || 0;
  }

  if (moduleStates.marketplace) {
    const mp = moduleStates.marketplace;
    stats.marketplace.pending = mp.listings?.filter((l) => l.status === 'pending').length || 0;
    stats.marketplace.myListings = mp.listings?.filter((l) => l.partnerId === uid).length || 0;
    stats.marketplace.orders = mp.orders?.length || 0;
  }

  if (moduleStates.buffet) {
    const buf = moduleStates.buffet;
    stats.buffet.pendingOrders = buf.orders?.filter((o) => o.status === 'new' || o.status === 'confirmed').length || 0;
    stats.buffet.myOrders = buf.orders?.filter((o) => o.userId === uid).length || 0;
  }

  return stats;
}

// ── AI assistant configuration ──────────────────────────────────────────────

export function getAiAssistantConfig(profession) {
  if (!AI_PROFESSIONS.includes(profession)) {
    return {
      system: 'Ты — помощник в цифровой школе. Отвечай на русском, практично и структурированно.',
      starters: [],
      maxTokens: 500,
    };
  }

  const configs = {
    teacher: {
      system: 'Ты — профессиональный помощник школьного учителя в России. Отвечай на русском, практично и структурированно. Помогай готовить планы уроков, КТП, задания, критерии оценивания, обратную связь, сообщения родителям и черновики отчётов. Не выдумывай сведения, нормативные требования, оценки или данные об учениках. Помечай черновики как требующие проверки учителем.',
      starters: [
        ['План урока', 'Составь план урока на 45 минут по теме: [предмет, класс, тема].'],
        ['Домашняя работа', 'Подготовь домашнюю работу по теме [тема] для [класс].'],
        ['Проверка работы', 'Помоги проверить работу по этим критериям: [вставьте работу].'],
        ['Отчёт по классу', 'Подготовь черновик краткого отчёта по результатам класса.'],
      ],
      maxTokens: 700,
    },
    admin: {
      system: 'Ты — помощник руководителя школы. Отвечай на русском, практично. Помогай с управлением персоналом, координацией учителей, анализом данных, подготовкой административных документов. Не выдумывай данные о сотрудниках, учениках или финансовых показателях.',
      starters: [
        ['Анализ данных', 'Проанализируй показатели школы: [данные]. Предложи улучшения.'],
        ['Координация', 'Составь план координации учителей по предмету [предмет].'],
        ['Документ', 'Подготовь черновик приказа по [тема].'],
        ['Отчёт', 'Подготовь сводный отчёт за [период] по [направление].'],
      ],
      maxTokens: 700,
    },
    psychologist: {
      system: 'Ты — школьный психолог. Отвечай на русском, тактично. Помогай с поддержкой учеников, выявлением проблем, рекомендациями учителям и родителям. Не ставь диагнозы. Не выдумывай данные о конкретных учениках.',
      starters: [
        ['Поддержка ученика', 'Ученик проявляет [поведение]. Предложи стратегию поддержки.'],
        ['Конфликт', 'В классе конфликт между [описание]. Предложи медиацию.'],
        ['Рекомендация', 'Дай рекомендацию учителю по работе с [категория] учениками.'],
      ],
      maxTokens: 600,
    },
    librarian: {
      system: 'Ты — школьный библиотекарь. Отвечай на русском, практично. Помогай с подбором литературы, организацией книжного фонда, рекомендациями ученикам и учителям. Не выдумывай несуществующие книги.',
      starters: [
        ['Подбор литературы', 'Подбери книги по теме [тема] для [класс].'],
        ['Каталог', 'Помоги организовать каталог по разделу [раздел].'],
        ['Рекомендация', 'Порекомендуй чтение для ученика с интересом к [интерес].'],
      ],
      maxTokens: 500,
    },
  };

  return configs[profession];
}
