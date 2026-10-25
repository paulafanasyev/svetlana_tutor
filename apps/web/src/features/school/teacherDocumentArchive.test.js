import test from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeTeacherDocumentArchive,
  parseTeacherDocumentArchive,
  mergeTeacherDocumentDrafts,
  filterTeacherDocumentDrafts,
  TEACHER_DOCUMENT_ARCHIVE_FORMAT,
  TEACHER_DOCUMENT_ARCHIVE_VERSION,
} from './teacherDocumentArchive.js';

const draft = (overrides = {}) => ({
  id: 'draft-1',
  title: 'План урока · 5 класс',
  type: 'lesson-plan',
  form: { grade: '5', subject: 'Математика', topic: 'Дроби' },
  content: '# ЧЕРНОВИК\nПлан урока',
  savedAt: '2026-10-25T10:00:00.000Z',
  versions: [{ savedAt: '2026-10-24T10:00:00.000Z', content: 'Старая версия' }],
  ...overrides,
});

test('резервный архив сохраняет документы и до пяти версий без потери полей', () => {
  const archive = serializeTeacherDocumentArchive([draft()], '2026-10-25T11:00:00.000Z');
  const decoded = JSON.parse(archive);
  assert.equal(decoded.format, TEACHER_DOCUMENT_ARCHIVE_FORMAT);
  assert.equal(decoded.version, TEACHER_DOCUMENT_ARCHIVE_VERSION);
  assert.equal(decoded.draftCount, 1);
  assert.deepEqual(parseTeacherDocumentArchive(archive), [draft()]);
});

test('импорт отвергает чужой формат, неподдерживаемую версию и неверный JSON', () => {
  assert.throws(() => parseTeacherDocumentArchive('{'), /корректным JSON/);
  assert.throws(() => parseTeacherDocumentArchive(JSON.stringify({ format: 'other', version: 1, drafts: [] })), /не архив черновиков/);
  assert.throws(() => parseTeacherDocumentArchive(JSON.stringify({ format: TEACHER_DOCUMENT_ARCHIVE_FORMAT, version: 99, drafts: [] })), /не поддерживается/);
});

test('импорт отвергает повторы ID, неизвестные типы и некорректные поля', () => {
  const base = { format: TEACHER_DOCUMENT_ARCHIVE_FORMAT, version: 1, drafts: [draft(), draft()] };
  assert.throws(() => parseTeacherDocumentArchive(JSON.stringify(base)), /повторяющийся идентификатор/);
  assert.throws(() => parseTeacherDocumentArchive(JSON.stringify({ ...base, drafts: [draft({ type: 'unknown' })] })), /Неизвестный тип/);
  assert.throws(() => parseTeacherDocumentArchive(JSON.stringify({ ...base, drafts: [draft({ form: [] })] })), /поля формы/);
});

test('импорт очищает опасные имена ключей и допускает только простые значения формы', () => {
  const raw = JSON.stringify({
    format: TEACHER_DOCUMENT_ARCHIVE_FORMAT,
    version: 1,
    drafts: [draft({ form: { grade: '5', '__proto__': { polluted: true }, 'constructor': 'bad' } })],
  });
  const parsed = parseTeacherDocumentArchive(raw);
  assert.equal(parsed[0].form.grade, '5');
  assert.equal(Object.hasOwn(parsed[0].form, 'constructor'), false);
});

test('объединение не перезаписывает имеющиеся документы и безопасно разрешает одинаковые ID', () => {
  const existing = [draft({ content: 'Текущая версия' })];
  const incoming = [draft({ content: 'Импортированная версия' }), draft({ id: 'draft-2', title: 'Другой документ' })];
  const result = mergeTeacherDocumentDrafts(existing, incoming, 30);
  assert.equal(result.addedCount, 2);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.drafts[0].content, 'Текущая версия');
  assert.equal(result.drafts[1].id, 'draft-1-import-1');
  assert.equal(result.drafts[1].content, 'Импортированная версия');
});

test('объединение сохраняет текущие записи, если локальный лимит исчерпан', () => {
  const existing = Array.from({ length: 30 }, (_, i) => draft({ id: 'local-' + i }));
  const result = mergeTeacherDocumentDrafts(existing, [draft({ id: 'incoming' })], 30);
  assert.equal(result.drafts.length, 30);
  assert.equal(result.addedCount, 0);
  assert.equal(result.skippedCount, 1);
  assert.ok(result.drafts.some((item) => item.id === 'local-0'));
});

test('archive metadata count must match its actual content', () => {
  const archive = JSON.parse(serializeTeacherDocumentArchive([draft()], '2026-10-25T11:00:00.000Z'));
  archive.draftCount = 9;
  assert.throws(() => parseTeacherDocumentArchive(JSON.stringify(archive)), /не совпадает/);
});

test('export refuses to create an archive that cannot be imported within size limits', () => {
  assert.throws(() => serializeTeacherDocumentArchive([draft({ content: 'x'.repeat(200_001) })]), /200 000 символов/);
});

test('поиск находит документы по названию, тексту и полям класса/предмета', () => {
  const items = [
    draft({ id: 'a', title: 'План урока', form: { grade: '5', subject: 'Математика' }, content: 'Дроби' }),
    draft({ id: 'b', title: 'Отчёт за четверть', form: { grade: '8', subject: 'История' }, content: 'Источники' }),
  ];
  assert.deepEqual(filterTeacherDocumentDrafts(items, 'математика').map((item) => item.id), ['a']);
  assert.deepEqual(filterTeacherDocumentDrafts(items, 'источники').map((item) => item.id), ['b']);
  assert.deepEqual(filterTeacherDocumentDrafts(items, '  '), items);
  assert.deepEqual(filterTeacherDocumentDrafts(items, 'нет такого документа'), []);
});

