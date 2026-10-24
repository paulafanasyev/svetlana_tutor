import test from 'node:test';
import assert from 'node:assert/strict';
import { TEACHER_DOCUMENTS, buildTeacherDocument, getGradeCounts, validateTeacherDocument, safeDocumentFilename } from './teacherDocuments.js';

const form = {
  schoolName: 'Школа № 17',
  teacherName: 'И. И. Иванова',
  grade: '7',
  className: '7А',
  subject: 'Математика',
  period: 'I четверть',
  date: '2026-10-24',
  topic: 'Дроби и проценты',
  studentCount: '25',
  five: '8',
  four: '10',
  three: '5',
  two: '2',
};

test('у каждого типа документа есть непустой редактируемый черновик', () => {
  assert.ok(TEACHER_DOCUMENTS.length >= 10);
  for (const doc of TEACHER_DOCUMENTS) {
    const output = buildTeacherDocument(doc.id, form);
    assert.ok(output.includes(doc.title), doc.id);
    assert.ok(output.includes('ЧЕРНОВИК'), doc.id);
    assert.ok(output.includes('Школа № 17'), doc.id);
    assert.ok(output.length > 100, doc.id);
  }
});

test('сводка корректно считает успеваемость и качество по введённым отметкам', () => {
  const counts = getGradeCounts(form);
  assert.equal(counts.total, 25);
  assert.equal(counts.assessed, 25);
  assert.equal(counts.successRate, 92);
  assert.equal(counts.qualityRate, 72);
});

test('сводка не выдумывает показатели при неполных данных', () => {
  const output = buildTeacherDocument('class-report', { ...form, five: '', four: '', three: '', two: '' });
  assert.match(output, /не рассчитаны/);
  assert.match(output, /нет достаточных исходных числовых данных/);
});

test('сумма отметок не должна превышать численность класса', () => {
  const result = validateTeacherDocument('class-report', { ...form, studentCount: '20' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /сумма отметок/.test(error)));
});

test('валидатор отклоняет отрицательные и дробные значения числовых полей', () => {
  assert.equal(validateTeacherDocument('class-report', { ...form, five: '-1' }).ok, false);
  assert.equal(validateTeacherDocument('class-report', { ...form, studentCount: '3.5' }).ok, false);
});

test('имя файла очищается от управляющих символов пути', () => {
  assert.equal(safeDocumentFilename('../Итог: 7/А'), 'Итог-7-А');
});
