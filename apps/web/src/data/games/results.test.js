import { describe, expect, it } from 'vitest';
import { makeSchoolGameTaskType, summarizeSchoolGameAttempts } from './results.js';

describe('school game result metadata', () => {
  it('encodes subject, grade and game mode without losing the existing Attempt taskType contract', () => {
    expect(makeSchoolGameTaskType('history', 6, 'memory')).toBe('school-game:history:6:memory');
    expect(makeSchoolGameTaskType('algebra', 10, 'battle')).toBe('school-game:algebra:10:battle');
  });

  it('rejects invalid subject, grade and mode metadata', () => {
    expect(() => makeSchoolGameTaskType('History!', 6, 'memory')).toThrow(TypeError);
    expect(() => makeSchoolGameTaskType('history', 12, 'memory')).toThrow(TypeError);
    expect(() => makeSchoolGameTaskType('history', 6, 'quiz')).toThrow(TypeError);
  });

  it('summarizes correct answers, duration and latest timestamp by subject, grade, mode and topic', () => {
    const rows = summarizeSchoolGameAttempts([
      { taskType: 'school-game:history:6:memory', topic: 'Даты', correct: true, durationMs: 1200, at: 1000 },
      { taskType: 'school-game:history:6:memory', topic: 'Даты', correct: false, durationMs: 800, at: 2000 },
      { taskType: 'school-game:math:6:memory', topic: 'Формулы', correct: true, durationMs: 1000, at: 1500 },
      { taskType: 'vocab', topic: 'family', correct: true, durationMs: 400, at: 3000 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      subjectSlug: 'history', grade: 6, mode: 'memory', topic: 'Даты',
      total: 2, correct: 1, accuracy: 0.5, avgDurationMs: 1000, lastAt: 2000,
    });
    expect(rows[1]).toMatchObject({ subjectSlug: 'math', topic: 'Формулы', total: 1, correct: 1, accuracy: 1 });
  });

  it('does not treat a missing answer flag as correct', () => {
    const [row] = summarizeSchoolGameAttempts([
      { taskType: 'school-game:russian:3:quest', topic: 'Орфография', durationMs: 100, at: 500 },
    ]);
    expect(row.correct).toBe(0);
    expect(row.accuracy).toBe(0);
  });
});
