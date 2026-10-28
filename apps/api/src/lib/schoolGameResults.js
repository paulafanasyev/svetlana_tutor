const GAME_TASK_RE = /^school-game:([a-z0-9-]+):(\d{1,2}):(battle|quest|pairs|memory)$/;

function timestampOf(attempt) {
  const raw = attempt?.createdAt ?? attempt?.at;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'number') return raw;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function summarizeSchoolGameAttempts(attempts = []) {
  const groups = new Map();
  for (const attempt of attempts) {
    const match = GAME_TASK_RE.exec(String(attempt?.taskType || ''));
    if (!match) continue;
    const [, subjectSlug, rawGrade, mode] = match;
    const topic = String(attempt.topic || 'Без темы').slice(0, 120);
    const key = [subjectSlug, rawGrade, mode, topic].join('|');
    let row = groups.get(key);
    if (!row) {
      row = { subjectSlug, grade: Number(rawGrade), mode, topic, total: 0, correct: 0, durationTotalMs: 0, lastAt: 0 };
      groups.set(key, row);
    }
    row.total += 1;
    if (attempt.correct === true) row.correct += 1;
    row.durationTotalMs += Math.max(0, Number(attempt.durationMs) || 0);
    row.lastAt = Math.max(row.lastAt, timestampOf(attempt));
  }
  return [...groups.values()].map((row) => ({
    ...row,
    accuracy: row.total ? row.correct / row.total : 0,
    avgDurationMs: row.total ? Math.round(row.durationTotalMs / row.total) : 0,
    durationTotalMs: undefined,
  })).sort((a, b) => b.lastAt - a.lastAt || a.subjectSlug.localeCompare(b.subjectSlug) || a.topic.localeCompare(b.topic));
}
