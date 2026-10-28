import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSchoolGameTaskType, summarizeSchoolGameAttempts } from './games/results.js';

test('school game task type keeps subject, class and mode', () => {
  assert.equal(makeSchoolGameTaskType('history', 6, 'memory'), 'school-game:history:6:memory');
  assert.equal(makeSchoolGameTaskType('algebra', 10, 'quest'), 'school-game:algebra:10:quest');
  assert.throws(() => makeSchoolGameTaskType('history', 12, 'memory'), /Invalid/);
  assert.throws(() => makeSchoolGameTaskType('history', 6, 'unknown'), /Invalid/);
});

test('school game results aggregate by subject, grade, mode and topic', () => {
  const rows = summarizeSchoolGameAttempts([
    { taskType: 'school-game:history:6:memory', topic: 'Крещение Руси', correct: true, durationMs: 3000, at: 1000 },
    { taskType: 'school-game:history:6:memory', topic: 'Крещение Руси', correct: false, durationMs: 5000, at: 3000 },
    { taskType: 'school-game:history:6:quest', topic: 'Крещение Руси', correct: true, durationMs: 2000, at: 2000 },
    { taskType: 'school-game:history:7:memory', topic: 'Крещение Руси', correct: true, durationMs: 1000, at: 4000 },
    { taskType: 'school-game', topic: 'old aggregate', correct: false, durationMs: 1000, at: 5000 },
    { taskType: 'english', topic: 'vocabulary', correct: true, durationMs: 1000, at: 6000 },
  ]);
  assert.equal(rows.length, 3);
  const sixthMemory = rows.find((x) => x.subjectSlug === 'history' && x.grade === 6 && x.mode === 'memory');
  assert.deepEqual(
    { total: sixthMemory.total, correct: sixthMemory.correct, accuracy: sixthMemory.accuracy, avgDurationMs: sixthMemory.avgDurationMs, lastAt: sixthMemory.lastAt },
    { total: 2, correct: 1, accuracy: 0.5, avgDurationMs: 4000, lastAt: 3000 },
  );
  assert.equal(rows[0].grade, 7);
});

test('school game results accept API timestamp fields and ignore malformed attempts', () => {
  const rows = summarizeSchoolGameAttempts([
    { taskType: 'school-game:math:4:pairs', topic: 'Таблица умножения', correct: true, durationMs: 800, createdAt: '2026-10-28T10:00:00.000Z' },
    { taskType: 'school-game:math:4:pairs', topic: 'Таблица умножения', correct: false, durationMs: 1200, createdAt: new Date('2026-10-28T10:00:03.000Z') },
    { taskType: 'school-game:math:4:bad-mode', topic: 'no', correct: true, durationMs: 1, at: 1 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].total, 2);
  assert.equal(rows[0].lastAt, Date.parse('2026-10-28T10:00:03.000Z'));
});
