import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceFailureMode } from './frp-noo-content.js';

test('transient ConsultantPlus outage falls back outside scheduled source check', () => {
  assert.equal(sourceFailureMode(['20.6: КонсультантПлюс: документ доступен только по расписанию'], 'push'), 'fallback-with-warning');
  assert.equal(sourceFailureMode(['HTTP 429'], 'pull_request'), 'fallback-with-warning');
});

test('scheduled source check fails when ConsultantPlus is transiently unavailable', () => {
  assert.equal(sourceFailureMode(['HTTP 429'], 'schedule'), 'fail-live-source-check');
});

test('unexpected parse or structure errors remain fatal', () => {
  assert.equal(sourceFailureMode(['разделы не найдены'], 'push'), 'fail-build');
  assert.equal(sourceFailureMode(['HTTP 429', 'разделы не найдены'], 'push'), 'fail-build');
});

test('no source errors means normal validation', () => {
  assert.equal(sourceFailureMode([], 'push'), 'no-error');
});


import { parseObzrContent, parseObzrResults } from './frp-noo-content.js';

test('OBZR content parser accepts module headings split into separate source paragraphs', () => {
  const parsed = parseObzrContent([
    '162(1).3.1.',
    'Модуль N 1 "Безопасное и устойчивое развитие личности, общества, государства":',
    'фундаментальные ценности и принципы, формирующие основы российского общества;',
    '162(1).3.2.',
    'Модуль N 2 "Военная подготовка. Основы военных знаний":',
    'история возникновения и развития Вооруженных Сил Российской Федерации;',
  ]);
  assert.deepEqual(Object.keys(parsed), ['1', '2']);
  assert.match(parsed[1].title, /Безопасное и устойчивое развитие/);
  assert.match(parsed[1].text.join(' '), /фундаментальные ценности/);
  assert.match(parsed[2].text.join(' '), /Вооруженных Сил/);
});

test('OBZR results parser accepts split headings and preserves each module result', () => {
  const { general, mods } = parseObzrResults([
    '162(1).4.5.2.',
    'Предметные результаты по ОБЗР должны обеспечивать:',
    '1) сформированность представлений о значении безопасного развития;',
    '162(1).4.5.3.',
    'Достижение результатов обеспечивается посредством включения модулей:',
    '162(1).4.5.3.1.',
    'Предметные результаты по модулю N 1 "Безопасное и устойчивое развитие личности":',
    'объяснять значение Конституции Российской Федерации;',
    '162(1).4.5.3.2.',
    'Предметные результаты по модулю N 2 "Военная подготовка":',
    'иметь представление об истории Вооруженных Сил Российской Федерации;',
  ]);
  assert.ok(general.some(x => /безопасного развития/.test(x)));
  assert.ok(general.every(x => !x.startsWith('162(1).4.5.')));
  assert.ok(mods[1]?.length > 1);
  assert.ok(mods[2]?.length > 1);
  assert.match(mods[1][1], /Конституции/);
});
