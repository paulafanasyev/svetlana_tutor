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

test('КТП формируется по переданным темам и содержит источник и часы программы', () => {
  const output = buildTeacherDocument('calendar-plan', {
    ...form,
    curriculumSource: 'ФОП ООО — https://edsoo.ru/rabochie-programmy/',
    curriculumStatus: 'Содержание: сверено при сборке.',
    curriculumHoursPerWeek: '5',
    curriculumHoursPerYear: '170',
    curriculumTopics: 'Дроби: сравнение дробей\nДроби: сложение дробей',
  });
  assert.match(output, /Календарно-тематическое планирование/);
  assert.match(output, /Дроби: сравнение дробей/);
  assert.match(output, /Дроби: сложение дробей/);
  assert.match(output, /170 ч\/год/);
  assert.match(output, /ФОП ООО/);
});

test('отчёт о выполнении программы считает отклонение только из введённых часов', () => {
  const output = buildTeacherDocument('program-implementation-report', {
    ...form, plannedHours: '64', completedHours: '61',
  });
  assert.match(output, /Отклонение.*-3 ч/);
  const incomplete = buildTeacherDocument('program-implementation-report', {
    ...form, plannedHours: '', completedHours: '61',
  });
  assert.match(incomplete, /не рассчитано/);
});

test('валидатор отклоняет отрицательные часы выполнения программы', () => {
  assert.equal(validateTeacherDocument('program-implementation-report', { plannedHours: '10', completedHours: '-1' }).ok, false);
});

test('сводка цифрового класса включается в отдельный тип отчёта без имён учащихся', () => {
  const output = buildTeacherDocument('classroom-activity-report', {
    ...form,
    classroomSnapshot: 'Уникальных полученных работ: 12\nСредняя отметка по оценённым работам: 4,5',
  });
  assert.match(output, /Сводка по локальному модулю класса/);
  assert.match(output, /Уникальных полученных работ: 12/);
  assert.match(output, /не учёт посещаемости|не учёт посещаемости/i);
});

test('электронный журнал включается в шаблон отчёта без генерации отсутствующих данных', () => {
  const output = buildTeacherDocument('journal-period-report', {
    ...form,
    journalSnapshot: 'Записей в выбранном периоде: 14.\\nСредняя отметка: 4,4.',
  });
  assert.match(output, /Сводный отчёт по электронному журналу/);
  assert.match(output, /Записей в выбранном периоде: 14/);
  const empty = buildTeacherDocument('journal-period-report', { ...form, journalSnapshot: '' });
  assert.match(empty, /Данные журнала не загружены/);
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
