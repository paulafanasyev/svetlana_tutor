import { TEACHER_DOCUMENTS } from './teacherDocuments.js';

export const TEACHER_DOCUMENT_ARCHIVE_FORMAT = 'svetlana-teacher-document-archive';
export const TEACHER_DOCUMENT_ARCHIVE_VERSION = 1;
export const MAX_ARCHIVE_DRAFTS = 100;
export const MAX_ARCHIVE_CHARACTERS = 5 * 1024 * 1024;
const MAX_DOCUMENT_CHARACTERS = 200_000;
const MAX_FORM_FIELDS = 80;
const MAX_FIELD_CHARACTERS = 20_000;
const DOCUMENT_TYPES = new Set(TEACHER_DOCUMENTS.map((item) => item.id));

export function serializeTeacherDocumentArchive(drafts, exportedAt = new Date().toISOString()) {
  if (!Array.isArray(drafts)) throw new Error('Список черновиков имеет неверный формат.');
  if (drafts.length > MAX_ARCHIVE_DRAFTS) {
    throw new Error('В архиве может быть не более ' + MAX_ARCHIVE_DRAFTS + ' черновиков.');
  }
  const serialized = JSON.stringify({
    format: TEACHER_DOCUMENT_ARCHIVE_FORMAT,
    version: TEACHER_DOCUMENT_ARCHIVE_VERSION,
    exportedAt,
    draftCount: drafts.length,
    drafts,
  }, null, 2);
  if (serialized.length > MAX_ARCHIVE_CHARACTERS) {
    throw new Error('Архив больше допустимых 5 МБ.');
  }
  parseTeacherDocumentArchive(serialized);
  return serialized;
}

function cleanForm(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('У черновика отсутствуют корректные поля формы.');
  }
  const keys = Object.keys(value);
  if (keys.length > MAX_FORM_FIELDS) throw new Error('Слишком много полей в форме черновика.');
  const form = {};
  for (const key of keys) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(key) || ['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    const field = value[key];
    if (typeof field === 'string') {
      if (field.length > MAX_FIELD_CHARACTERS) throw new Error('Поле формы слишком длинное: ' + key);
      form[key] = field;
    } else if (typeof field === 'number' && Number.isFinite(field)) {
      form[key] = field;
    } else if (typeof field === 'boolean' || field === null) {
      form[key] = field;
    } else {
      throw new Error('В поле формы недопустимый тип данных: ' + key);
    }
  }
  return form;
}

function cleanVersions(versions) {
  if (versions === undefined) return [];
  if (!Array.isArray(versions)) throw new Error('История версий имеет неверный формат.');
  return versions.slice(0, 5).map((version) => {
    if (!version || typeof version !== 'object' || typeof version.content !== 'string') {
      throw new Error('В архиве найдена некорректная версия документа.');
    }
    if (version.content.length > MAX_DOCUMENT_CHARACTERS) throw new Error('Сохранённая версия документа слишком длинная.');
    const time = typeof version.savedAt === 'string' && !Number.isNaN(Date.parse(version.savedAt))
      ? version.savedAt
      : '';
    const clean = { savedAt: time, content: version.content };
    if (version.form !== undefined) clean.form = cleanForm(version.form);
    if (typeof version.type === 'string' && DOCUMENT_TYPES.has(version.type)) clean.type = version.type;
    if (typeof version.title === 'string' && version.title.length <= 300) clean.title = version.title;
    return clean;
  });
}

export function parseTeacherDocumentArchive(serialized) {
  if (typeof serialized !== 'string' || !serialized.trim()) throw new Error('Файл архива пуст.');
  if (serialized.length > MAX_ARCHIVE_CHARACTERS) throw new Error('Файл больше допустимых 5 МБ.');
  let archive;
  try {
    archive = JSON.parse(serialized);
  } catch {
    throw new Error('Файл не является корректным JSON-архивом.');
  }
  if (!archive || typeof archive !== 'object' || Array.isArray(archive)
      || archive.format !== TEACHER_DOCUMENT_ARCHIVE_FORMAT) {
    throw new Error('Это не архив черновиков «Светланы — Репетитор».');
  }
  if (archive.version !== TEACHER_DOCUMENT_ARCHIVE_VERSION) {
    throw new Error('Версия архива не поддерживается: ' + String(archive.version) + '.');
  }
  if (!Array.isArray(archive.drafts)) throw new Error('В архиве отсутствует список черновиков.');
  if (archive.draftCount !== undefined && archive.draftCount !== archive.drafts.length) {
    throw new Error('Количество черновиков в заголовке архива не совпадает с содержимым.');
  }
  if (archive.drafts.length > MAX_ARCHIVE_DRAFTS) {
    throw new Error('В одном архиве может быть не более ' + MAX_ARCHIVE_DRAFTS + ' черновиков.');
  }

  const seenIds = new Set();
  const drafts = archive.drafts.map((draft, index) => {
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
      throw new Error('Некорректный черновик № ' + (index + 1) + '.');
    }
    const id = typeof draft.id === 'string' ? draft.id.trim() : '';
    const title = typeof draft.title === 'string' ? draft.title.trim() : '';
    const type = typeof draft.type === 'string' ? draft.type : '';
    const content = typeof draft.content === 'string' ? draft.content : '';
    if (!id || id.length > 120 || seenIds.has(id)) throw new Error('Пустой или повторяющийся идентификатор черновика.');
    if (!title || title.length > 300) throw new Error('Название черновика отсутствует или слишком длинное.');
    if (!DOCUMENT_TYPES.has(type)) throw new Error('Неизвестный тип документа в черновике: ' + type);
    if (content.length > MAX_DOCUMENT_CHARACTERS) throw new Error('Текст черновика превышает допустимые 200 000 символов.');
    if (typeof draft.savedAt !== 'string' || Number.isNaN(Date.parse(draft.savedAt))) {
      throw new Error('У черновика отсутствует корректная дата сохранения.');
    }
    seenIds.add(id);
    return {
      id,
      title,
      type,
      form: draft.form === undefined ? {} : cleanForm(draft.form),
      content,
      savedAt: draft.savedAt,
      versions: cleanVersions(draft.versions),
    };
  });
  return drafts;
}

export function mergeTeacherDocumentDrafts(existing, incoming, limit = 30) {
  const kept = Array.isArray(existing) ? existing.slice(0, limit) : [];
  const available = Math.max(0, limit - kept.length);
  const known = new Set(kept.map((draft) => String(draft.id)));
  const added = [];
  let skipped = 0;
  for (const source of Array.isArray(incoming) ? incoming : []) {
    if (added.length >= available) {
      skipped += 1;
      continue;
    }
    let id = String(source.id);
    if (known.has(id)) {
      let suffix = 1;
      while (known.has(id + '-import-' + suffix)) suffix += 1;
      id = id + '-import-' + suffix;
    }
    known.add(id);
    added.push({ ...source, id });
  }
  return { drafts: [...kept, ...added], addedCount: added.length, skippedCount: skipped };
}
