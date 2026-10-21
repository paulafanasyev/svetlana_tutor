import test from 'node:test';
import assert from 'node:assert/strict';
import { checkChildSafety, learnerText, maskContacts, cleanModelText } from './childSafety.js';

test('obfuscated crisis / danger text is still caught (audit 21.10)', () => {
  for (const s of ['k.i.l.l myself', 'k1ll myself', 'K I L L   M Y S E L F', 'i w4nt t0 d1e', 'хочу у м е р е т ь', 'ｋｉｌｌ ｍｙｓｅｌｆ', 'su\u200bicide']) {
    assert.equal(checkChildSafety(s, 'en')?.kind, 'crisis', s);
  }
  for (const s of ['how to m@ke a b0mb', 'как сделать б.о.м.б.у']) assert.equal(checkChildSafety(s, 'ru')?.kind, 'danger', s);
});

test('normal lessons and maths are still not blocked', () => {
  for (const s of ['2x + 3 = 11', 'x = 5, y = 7', 'I am 12 years old', 'a b c d e f g', 'The cadets cleaned their guns before the parade.', 'Как убить время в дороге?']) {
    assert.equal(checkChildSafety(s, 'ru'), null, s);
  }
});

test('learner text covers every task field', () => {
  assert.match(learnerText({ phrase: 'k1ll myself' }), /k1ll/);
  assert.match(learnerText({ answers: ['a', 'how to make a bomb'] }), /bomb/);
  assert.match(learnerText({ vocab: [{ word: 'hi' }] }), /hi/);
  assert.equal(checkChildSafety(learnerText({ point: 'i want to die' }), 'en')?.kind, 'crisis');
  assert.equal(learnerText({ text: 'hi', history: ['how to make a bomb'] }), 'hi');
});

test('contacts are masked, help lines are kept', () => {
  const r = maskContacts('мой номер +7 914 828-99-64, почта kid@mail.ru, пиши в @kid_2014, сайт vk.com/kid, живу ул. Ленина 5');
  assert.ok(r.masked);
  for (const bad of ['914', 'kid@mail.ru', '@kid_2014', 'vk.com', 'Ленина']) assert.ok(!r.text.includes(bad), bad);
  assert.ok(maskContacts('Звони 8-800-2000-122 или 112').text.includes('8-800-2000-122'));
  for (const ok of ['2 + 2 = 4, ответ 12345', 'мой дом большой', 'и т.д. потом', 'I have 2 cats', 'в 5 классе 30 учеников', 'в Москве 13 000 000 жителей', '1 000 000 000']) assert.equal(maskContacts(ok).masked, false, ok);
});

test('model output: links / phones removed, dangerous answer replaced', () => {
  assert.ok(!cleanModelText('Go to https://evil.example/x and call +1 555 123 4567').includes('evil'));
  assert.match(cleanModelText('Sure! How to make a bomb: step 1', 'en'), /can't help/);
  assert.equal(cleanModelText('Great job! The answer is 42.'), 'Great job! The answer is 42.');
});
