import test from 'node:test';
import assert from 'node:assert/strict';
import { UMK_BY_GRADE, getUmk, subjectsForGrade, UMK_GRADES } from './umk.js';

test('UMK covers all grades 1-11', () => {
  assert.deepEqual(UMK_GRADES, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  for (const g of UMK_GRADES) {
    assert.ok(UMK_BY_GRADE[g], `grade ${g} present`);
  }
});

test('grade 5 math is Мерзляк/Полонский/Якир', () => {
  const umk = getUmk(5, 'Математика');
  assert.ok(umk);
  assert.match(umk.authors, /Мерзляк/);
  assert.match(umk.authors, /Полонский/);
  assert.match(umk.authors, /Якир/);
  assert.equal(umk.publisher, 'Вентана-Граф');
});

test('grade 7 algebra and geometry are separate textbooks', () => {
  const alg = getUmk(7, 'Алгебра');
  const geo = getUmk(7, 'Геометрия');
  assert.ok(alg);
  assert.ok(geo);
  assert.match(alg.authors, /Мерзляк/);
  assert.match(geo.authors, /Атанасян/);
  assert.notEqual(alg.title, geo.title);
});

test('grade 8 chemistry appears', () => {
  const chem = getUmk(8, 'Химия');
  assert.ok(chem);
  assert.match(chem.authors, /Габриелян/);
});

test('getUmk returns null for invalid inputs', () => {
  assert.equal(getUmk(0, 'Математика'), null);
  assert.equal(getUmk(12, 'Математика'), null);
  assert.equal(getUmk(5, 'Несуществующий предмет'), null);
  assert.equal(getUmk('abc', 'Математика'), null);
  assert.equal(getUmk(null, 'Математика'), null);
});

test('subjectsForGrade returns correct subjects for grade 1', () => {
  const subjects = subjectsForGrade(1);
  assert.ok(subjects.includes('Русский язык'));
  assert.ok(subjects.includes('Математика'));
  assert.ok(subjects.includes('Литературное чтение'));
  assert.ok(subjects.includes('Окружающий мир'));
  assert.ok(!subjects.includes('Физика'));
});

test('subjectsForGrade returns empty for invalid grade', () => {
  assert.deepEqual(subjectsForGrade(0), []);
  assert.deepEqual(subjectsForGrade(99), []);
});

test('every UMK entry has authors, title and publisher', () => {
  for (const [grade, subjects] of Object.entries(UMK_BY_GRADE)) {
    for (const [subject, entry] of Object.entries(subjects)) {
      assert.ok(entry.authors, `authors for grade ${grade} ${subject}`);
      assert.ok(entry.title, `title for grade ${grade} ${subject}`);
      assert.ok(entry.publisher, `publisher for grade ${grade} ${subject}`);
    }
  }
});

test('grade 10-11 have профильный level for algebra', () => {
  const a10 = getUmk(10, 'Алгебра и начала математического анализа');
  const a11 = getUmk(11, 'Алгебра и начала математического анализа');
  assert.ok(a10);
  assert.ok(a11);
  assert.match(a10.title, /профильный/);
  assert.match(a11.title, /профильный/);
});
