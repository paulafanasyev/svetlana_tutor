import test from 'node:test';
import assert from 'node:assert/strict';
import { buildElectronicJournalReport } from './electronicJournalReport.js';

const date = (value) => new Date(value + 'T12:00:00').getTime();
const entries = [
  { id: '1', classId: 'c1', studentId: 's1', studentName: 'Секрет Имя', kind: 'lesson', topic: 'fractions', mark: 5, comment: 'private note', at: date('2026-10-01') },
  { id: '2', classId: 'c1', studentId: 's1', studentName: 'Секрет Имя', kind: 'quiz', topic: 'fractions', mark: 4, comment: 'private note', at: date('2026-10-02') },
  { id: '3', classId: 'c1', studentId: 's2', studentName: 'Другое Имя', kind: 'homework', topic: 'fractions', mark: 3, comment: 'private note', at: date('2026-10-03') },
  { id: '4', classId: 'c1', studentId: 's3', studentName: 'Ещё Имя', kind: 'note', topic: '', mark: null, comment: 'private note', at: date('2026-10-03') },
  { id: '5', classId: 'c1', studentId: 's2', studentName: 'Другое Имя', kind: 'quiz', topic: 'decimals', mark: 2, comment: 'private note', at: date('2026-09-30') },
];

test('сводка считает записи, типы, оценённые записи и показатели отдельно', () => {
  const report = buildElectronicJournalReport(entries, {
    className: '5А · Математика',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-03',
    generatedAt: new Date('2026-10-25T00:00:00Z'),
  });
  assert.equal(report.entryCount, 4);
  assert.equal(report.gradedEntryCount, 3);
  assert.equal(report.studentsWithEntries, 3);
  assert.equal(report.studentsWithMarks, 2);
  assert.deepEqual(report.markCounts, { 5: 1, 4: 1, 3: 1, 2: 0 });
  assert.equal(report.meanMark, 4);
  assert.equal(report.successRate, 100);
  assert.ok(Math.abs(report.qualityRate - 200 / 3) < 1e-9);
  assert.equal(report.byKind.lesson, 1);
  assert.equal(report.byKind.quiz, 1);
  assert.equal(report.byKind.homework, 1);
  assert.equal(report.byKind.note, 1);
  assert.ok(report.markdown.includes('5А · Математика'));
});

test('сводка не экспортирует имена, IDs и индивидуальные комментарии', () => {
  const report = buildElectronicJournalReport(entries, { className: '5А' });
  assert.doesNotMatch(report.markdown, /Секрет Имя|Другое Имя|Ещё Имя|private note|studentId|s1/);
});

test('диапазон дат исключает записи вне выбранного периода', () => {
  const report = buildElectronicJournalReport(entries, { periodStart: '2026-10-02', periodEnd: '2026-10-02' });
  assert.equal(report.entryCount, 1);
  assert.equal(report.gradedEntryCount, 1);
  assert.equal(report.meanMark, 4);
});

test('не придумывает оценки, когда журнал пуст или в нём нет отметок', () => {
  const report = buildElectronicJournalReport([{ id: 'n', studentId: 's', kind: 'note', mark: null, at: date('2026-10-01') }]);
  assert.equal(report.meanMark, null);
  assert.equal(report.successRate, null);
  assert.match(report.markdown, /не рассчитывается/);
});

test('не принимает перевёрнутый диапазон дат как нормальный период', () => {
  const report = buildElectronicJournalReport(entries, { periodStart: '2026-10-04', periodEnd: '2026-10-01' });
  assert.equal(report.entryCount, 0);
});
