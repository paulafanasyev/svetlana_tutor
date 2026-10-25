import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClassroomActivitySnapshot } from './classroomActivityReport.js';

const db = {
  classes: [{ id: 'c1', title: '7А', subject: 'Математика', teacherId: 't1', members: [{ id: 's1' }, { id: 's2' }] }],
  homework: [
    { id: 'h1', classId: 'c1', teacherId: 't1', title: 'Дроби' },
    { id: 'h2', classId: 'c1', teacherId: 't1', title: 'Проценты' },
  ],
  submissions: [
    { id: 'a1', hwId: 'h1', studentId: 's1', name: 'Alice', text: 'answer', mark: 5, at: 100 },
    { id: 'a2', hwId: 'h1', studentId: 's2', name: 'Bob', text: 'answer', mark: null, at: 110 },
    { id: 'a3', hwId: 'h2', studentId: 's1', name: 'Alice', text: 'answer', mark: 4, at: 120 },
    { id: 'a4', hwId: 'h2', studentId: 'outsider', name: 'Carol', text: 'answer', mark: 2, at: 130 },
  ],
};

test('сводка считает уникальные ответы, долю сдачи и только выставленные учителем отметки', () => {
  const report = buildClassroomActivitySnapshot(db, 'c1', new Date('2026-10-25T00:00:00Z'));
  assert.equal(report.memberCount, 2);
  assert.equal(report.homeworkCount, 2);
  assert.equal(report.expectedResponses, 4);
  assert.equal(report.receivedResponses, 3);
  assert.equal(report.pendingResponses, 1);
  assert.equal(report.completionRate, 75);
  assert.equal(report.reviewedCount, 2);
  assert.equal(report.averageMark, 4.5);
  assert.deepEqual(report.markCounts, { 5: 1, 4: 1, 3: 0, 2: 0 });
});

test('сводка не раскрывает имена и тексты ответов учащихся', () => {
  const report = buildClassroomActivitySnapshot(db, 'c1', new Date('2026-10-25T00:00:00Z'));
  assert.doesNotMatch(report.markdown, /Alice|Bob|Carol|answer/);
});

test('не найденный класс возвращает null', () => {
  assert.equal(buildClassroomActivitySnapshot(db, 'missing'), null);
});

test('при отсутствии заданий не придумывает процент сдачи или среднюю оценку', () => {
  const report = buildClassroomActivitySnapshot({ ...db, homework: [], submissions: [] }, 'c1');
  assert.equal(report.completionRate, null);
  assert.equal(report.averageMark, null);
  assert.match(report.markdown, /не рассчитывается/);
});
