import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRequestedGrade, detectRequestedSubject, TEACHER_REFERENCE_SOURCES } from '../features/assistant/teacherKnowledge.js';

test('извлекает класс из типовых запросов учителя', () => {
  assert.equal(extractRequestedGrade('Составь КТП по математике для 7 класса'), 7);
  assert.equal(extractRequestedGrade('Отчёт для 11-го класса'), 11);
  assert.equal(extractRequestedGrade('Класс: 3. Подготовь работу по окружающему миру'), 3);
  assert.equal(extractRequestedGrade('Сделай отчёт по параллели'), null);
});

test('определяет школьные предметы и не путает близкие названия', () => {
  assert.equal(detectRequestedSubject('План урока алгебры для 8 класса'), 'Математика');
  assert.equal(detectRequestedSubject('Подготовь диктант по русскому языку'), 'Русский язык');
  assert.equal(detectRequestedSubject('Составь занятие по биологии'), 'Биология');
  assert.equal(detectRequestedSubject('Подготовь урок по литературному чтению для 2 класса'), 'Литературное чтение');
  assert.equal(detectRequestedSubject('Составь урок китайского языка'), 'Китайский язык');
  assert.equal(detectRequestedSubject('План занятия по ОДНКНР'), 'Основы духовно-нравственной культуры народов России');
  assert.equal(detectRequestedSubject('Урок по вероятности и статистике'), 'Математика');
  assert.equal(detectRequestedSubject('Подготовь отчёт по классу'), null);
});

test('справочный контекст содержит основные официальные каталоги и датированные ориентиры', () => {
  assert.ok(TEACHER_REFERENCE_SOURCES.some((item) => /№ 779/.test(item.note)));
  assert.ok(TEACHER_REFERENCE_SOURCES.some((item) => item.url.includes('edsoo.ru')));
  assert.ok(TEACHER_REFERENCE_SOURCES.some((item) => item.url.includes('publication.pravo.gov.ru')));
});
