import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../core/store.js';
import RuOnly from './RuOnly.jsx';
import { TEACHER_DOCUMENTS, buildTeacherDocument, safeDocumentFilename, validateTeacherDocument } from './teacherDocuments.js';
import { PROGRAMS, splitTopic } from './fop.js';
import federalProgramCatalog from '../../data/federalWorkingProgramCatalog.json' with { type: 'json' };
import { school } from './schoolStore.js';
import { buildClassroomActivitySnapshot } from './classroomActivityReport.js';

const fieldClass = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold';
const today = () => {
  const date = new Date();
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
};
const keyFor = (userId) => 'svetlana.teacher-workspace.v1:' + String(userId || 'local');

function readDrafts(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item) => item && item.id && item.content) : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function markdownHtml(markdown) {
  const lines = String(markdown || '').split('\n');
  const out = [];
  let inList = false;
  lines.forEach((raw) => {
    const line = escapeHtml(raw);
    if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + line.slice(2) + '</li>');
      return;
    }
    if (inList) { out.push('</ul>'); inList = false; }
    if (!line.trim()) { out.push('<div class="space"></div>'); return; }
    if (line.startsWith('# ')) out.push('<h1>' + line.slice(2) + '</h1>');
    else if (line.startsWith('## ')) out.push('<h2>' + line.slice(3) + '</h2>');
    else if (line.startsWith('### ')) out.push('<h3>' + line.slice(4) + '</h3>');
    else if (line.startsWith('&gt; ')) out.push('<p class="note">' + line.slice(5) + '</p>');
    else out.push('<p>' + line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</p>');
  });
  if (inList) out.push('</ul>');
  return out.join('\n');
}

const INITIAL_FORM = (user) => ({
  schoolName: '',
  teacherName: user?.name || '',
  position: 'учитель',
  className: '',
  schoolClassId: '',
  classroomSnapshot: '',
  grade: '5',
  subject: 'Математика',
  curriculumProgramId: 'math-5',
  officialSourceId: '',
  curriculumTopics: '',
  curriculumSource: '',
  curriculumStatus: '',
  curriculumHoursPerWeek: '',
  curriculumHoursPerYear: '',
  plannedHours: '',
  completedHours: '',
  period: '',
  date: today(),
  topic: '',
  durationMinutes: '45',
  goals: '',
  outcomes: '',
  materials: '',
  homework: '',
  studentCount: '',
  workCount: '',
  five: '',
  four: '',
  three: '',
  two: '',
  attendance: '',
  strengths: '',
  gaps: '',
  actions: '',
  deadline: '',
  participants: '',
  agenda: '',
  decisions: '',
  studentAlias: '',
  baseline: '',
  support: '',
  reason: '',
  evidence: '',
});

function Field({ label, name, value, onChange, multiline = false, type = 'text', help }) {
  const control = multiline
    ? <textarea className={fieldClass} rows={3} value={value} onChange={(e) => onChange(name, e.target.value)} />
    : <input className={fieldClass} type={type} value={value} onChange={(e) => onChange(name, e.target.value)} />;
  return (
    <label className="block space-y-1">
      <span className="text-xs font-black text-ink/65">{label}</span>
      {control}
      {help && <span className="block text-[11px] font-semibold text-ink/45">{help}</span>}
    </label>
  );
}

function downloadFile(filename, contents, mime) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TeacherWorkspace() {
  const { user } = useApp();
  const navigate = useNavigate();
  const storageKey = keyFor(user?.id);
  const [schoolDb, setSchoolDb] = useState(() => school.get());
  useEffect(() => school.subscribe(setSchoolDb), []);
  const teacherClasses = useMemo(() => (schoolDb.classes || []).filter((cls) => cls.teacherId === String(user?.id)), [schoolDb.classes, user?.id]);
  const [form, setForm] = useState(() => INITIAL_FORM(user));
  const [docType, setDocType] = useState('lesson-plan');
  const [content, setContent] = useState('');
  const [drafts, setDrafts] = useState(() => readDrafts(storageKey));
  const [activeId, setActiveId] = useState('');
  const [notice, setNotice] = useState('');

  const gradePrograms = useMemo(() => PROGRAMS.filter((program) => Number(program.grade) === Number(form.grade)), [form.grade]);
  const selectedProgram = gradePrograms.find((program) => program.id === form.curriculumProgramId) || gradePrograms[0] || null;
  const gradeOfficialSources = useMemo(() => (Array.isArray(federalProgramCatalog.programs) ? federalProgramCatalog.programs : [])
    .filter((item) => item.subject !== 'all-school-subjects' && Array.isArray(item.gradeRange) && Number(form.grade) >= Number(item.gradeRange[0]) && Number(form.grade) <= Number(item.gradeRange[1]) && typeof item.url === 'string' && item.url.startsWith('https://'))
    .sort((a, b) => String(a.title).localeCompare(String(b.title), 'ru')), [form.grade]);
  const selectedOfficialSource = gradeOfficialSources.find((item) => item.id === form.officialSourceId) || gradeOfficialSources[0] || null;

  const doc = useMemo(() => TEACHER_DOCUMENTS.find((item) => item.id === docType) || TEACHER_DOCUMENTS[0], [docType]);
  const updateForm = (name, value) => setForm((old) => ({ ...old, [name]: value }));

  const chooseGrade = (rawGrade) => {
    const grade = Number(rawGrade);
    const sameSubject = PROGRAMS.find((program) => Number(program.grade) === grade && program.subject === form.subject);
    const nextProgram = sameSubject || PROGRAMS.find((program) => Number(program.grade) === grade) || null;
    setForm((old) => ({
      ...old,
      grade: String(grade),
      subject: nextProgram?.subject || old.subject,
      curriculumProgramId: nextProgram?.id || '',
    }));
    setContent('');
    setActiveId('');
  };

  const chooseProgram = (id) => {
    const program = PROGRAMS.find((item) => item.id === id);
    if (!program) return;
    setForm((old) => ({ ...old, grade: String(program.grade), subject: program.subject, curriculumProgramId: program.id }));
    setContent('');
    setActiveId('');
  };

  const fillFromCurriculum = () => {
    if (!selectedProgram) {
      setNotice('В локальном каталоге не найдена программа для выбранного класса.');
      return;
    }
    const topics = selectedProgram.sections.flatMap((section) =>
      (Array.isArray(section.topics) ? section.topics : []).flatMap((topic) =>
        splitTopic(topic).map((item) => item.trim()).filter(Boolean).map((item) => section.title + ': ' + item)
      )
    ).slice(0, Math.max(1, Number(selectedProgram.hours_per_year) || 100));
    const source = selectedProgram.source_doc || selectedProgram.content_source || 'Федеральная рабочая программа';
    const sourceUrl = selectedProgram.source_url || selectedProgram.content_source_url || '';
    const contentStatus = selectedProgram.content_src === 'live' ? 'сверено при сборке' : selectedProgram.content_src === 'fop' ? 'текст ФОП из локального каталога' : 'корпус/проверка не завершена';
    const resultsStatus = selectedProgram.results_src === 'live' ? 'сверено при сборке' : selectedProgram.results_src === 'fop' ? 'текст ФОП из локального каталога' : selectedProgram.results_src === 'corpus' ? 'корпус/проверка не завершена' : 'статус не указан';
    const results = Array.isArray(selectedProgram.results) ? selectedProgram.results.slice(0, 8).map((item) => '- ' + item).join('\n') : '';
    setForm((old) => ({
      ...old,
      grade: String(selectedProgram.grade),
      subject: selectedProgram.subject,
      curriculumProgramId: selectedProgram.id,
      curriculumTopics: topics.join('\n'),
      curriculumSource: source + (sourceUrl ? ' — ' + sourceUrl : ''),
      curriculumStatus: 'Содержание: ' + contentStatus + '. Планируемые результаты: ' + resultsStatus + '.',
      curriculumHoursPerWeek: String(selectedProgram.hours_per_week ?? ''),
      curriculumHoursPerYear: String(selectedProgram.hours_per_year ?? ''),
      topic: old.topic.trim() || (selectedProgram.subject + ', ' + selectedProgram.grade + ' класс — ' + (selectedProgram.sections[0]?.title || 'тема программы')),
      goals: old.goals.trim() || ('Планировать освоение разделов федеральной рабочей программы. Проверить соответствие локальной рабочей программе школы.'),
      outcomes: old.outcomes.trim() || results,
      materials: old.materials.trim() || ('Источник: ' + source + (sourceUrl ? '\n' + sourceUrl : '') + '\n' + 'Статус: ' + contentStatus + '; результаты: ' + resultsStatus + '.'),
    }));
    setContent('');
    setActiveId('');
    setNotice('Подставлено ' + topics.length + ' строк тем из локальной программы. Проверьте редакцию, часы и соответствие программе вашей школы.');
  };

  const loadClassroomSnapshot = () => {
    const snapshot = buildClassroomActivitySnapshot(schoolDb, form.schoolClassId);
    if (!snapshot) {
      setNotice('Выберите класс, созданный в разделе «Классы и чат» этого браузера.');
      return;
    }
    setForm((old) => ({
      ...old,
      subject: snapshot.subject || old.subject,
      className: snapshot.classTitle || old.className,
      classroomSnapshot: snapshot.markdown,
    }));
    setDocType('classroom-activity-report');
    setContent('');
    setActiveId('');
    setNotice('Сводка загружена из локального модуля: без имён учеников и текстов ответов. Посещаемость модуль не отслеживает.');
  };

  const generate = () => {
    const check = validateTeacherDocument(docType, form);
    setContent(buildTeacherDocument(docType, form));
    setActiveId('');
    setNotice(check.errors.length ? 'Черновик создан. Проверьте поля: ' + check.errors.join(' ') : 'Черновик создан. Проверьте факты и локальную форму школы.');
  };

  const persistDrafts = (list) => {
    setDrafts(list);
    try { localStorage.setItem(storageKey, JSON.stringify(list)); }
    catch { setNotice('Не удалось сохранить в браузере: возможно, закончилось место. Скачайте файл на устройство.'); }
  };

  const saveDraft = () => {
    const draftContent = content || buildTeacherDocument(docType, form);
    const id = activeId || String(Date.now());
    const record = {
      id,
      title: doc.title + ' · ' + (form.className || form.grade + ' класс') + ' · ' + (form.period || form.date),
      type: docType,
      form,
      content: draftContent,
      savedAt: new Date().toISOString(),
    };
    const next = [record, ...drafts.filter((item) => item.id !== id)].slice(0, 30);
    persistDrafts(next);
    setContent(draftContent);
    setActiveId(id);
    setNotice('Черновик сохранён только в этом браузере на этом устройстве.');
  };

  const openDraft = (draft) => {
    setDocType(draft.type);
    setForm({ ...INITIAL_FORM(user), ...(draft.form || {}) });
    setContent(draft.content);
    setActiveId(draft.id);
    setNotice('Открыт сохранённый черновик.');
  };

  const deleteDraft = (id) => {
    persistDrafts(drafts.filter((item) => item.id !== id));
    if (activeId === id) { setActiveId(''); setContent(''); }
    setNotice('Черновик удалён из локального списка.');
  };

  const saveMarkdown = () => {
    const text = content || buildTeacherDocument(docType, form);
    downloadFile(safeDocumentFilename(doc.title + '-' + (form.className || form.grade)) + '.md', text, 'text/markdown;charset=utf-8');
  };

  const savePrintableHtml = () => {
    const text = content || buildTeacherDocument(docType, form);
    const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      escapeHtml(doc.title) + '</title><style>body{font:15px/1.55 Arial,sans-serif;color:#172033;max-width:850px;margin:30px auto;padding:0 24px}h1{font-size:25px;border-bottom:2px solid #334155;padding-bottom:10px}h2{font-size:18px;margin-top:24px}p{margin:7px 0}ul{padding-left:23px}.space{height:8px}.note{font-size:12px;color:#475569;border-left:3px solid #94a3b8;padding:8px 12px;background:#f8fafc}@media print{body{margin:0 auto;padding:0 8mm}}</style></head><body>' +
      markdownHtml(text) + '</body></html>';
    downloadFile(safeDocumentFilename(doc.title + '-' + (form.className || form.grade)) + '.html', html, 'text/html;charset=utf-8');
    setNotice('HTML-файл готов. Откройте его в браузере и выберите «Печать» → «Сохранить как PDF».');
  };

  const continueWithAi = () => {
    const text = content || buildTeacherDocument(docType, form);
    const prompt = 'Доработай черновик документа для школьного учителя в России. Не выдумывай факты, нормативные требования или результаты; отсутствующие сведения пометь как [уточнить]. Сохрани структуру, предложи профессиональную редактуру и отдельно перечисли, что учителю нужно проверить перед использованием.\n\nЧерновик:\n' + text;
    try { localStorage.setItem('svetlana.teacher-workspace.pendingPrompt:' + String(user?.id || 'local'), prompt); } catch {}
    navigate('/assistant');
  };

  const grouped = useMemo(() => {
    const map = new Map();
    TEACHER_DOCUMENTS.forEach((item) => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="space-y-5 p-3 sm:p-5">
      <header className="card p-5 space-y-2">
        <div className="text-xs font-black uppercase tracking-wide text-primary">Светлана · рабочее место учителя</div>
        <h1 className="h2">Документы и отчётность</h1>
        <p className="text-sm font-semibold text-ink/65">Создавайте редактируемые черновики, проверяйте сводные показатели и сохраняйте документы для дальнейшей работы. При загрузке локальной ИИ-модели черновик можно передать в помощник учителя для редакторской доработки.</p>
        <p className="text-xs font-semibold text-ink/50">Данные хранятся в localStorage этого браузера без шифрования и не синхронизируются между устройствами. Не вводите лишние персональные, медицинские или семейные сведения; на общем устройстве не сохраняйте идентифицирующие данные учеников.</p>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <a className="underline text-primary" href="https://publication.pravo.gov.ru/document/0001202412050007" target="_blank" rel="noreferrer">Приказ Минпросвещения № 779</a>
          <a className="underline text-primary" href="https://edsoo.ru/rabochie-programmy/" target="_blank" rel="noreferrer">Федеральные рабочие программы ЕДСОО</a>
          <a className="underline text-primary" href="https://fipi.ru/" target="_blank" rel="noreferrer">ФИПИ</a>
          <a className="underline text-primary" href="https://publication.pravo.gov.ru/document/0001202607230005" target="_blank" rel="noreferrer">Федеральный перечень учебников № 436</a>
        </div>
      </header>
      <RuOnly />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section className="space-y-4 min-w-0">
          <div className="card p-4 space-y-4">
            <div className="font-black">1. Тип документа</div>
            <label className="block space-y-1">
              <span className="text-xs font-black text-ink/65">Шаблон</span>
              <select className={fieldClass} value={docType} onChange={(e) => { setDocType(e.target.value); setActiveId(''); }} >
                {grouped.map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="font-black pt-2">2. Данные документа</div>
            <Field label="Образовательная организация" name="schoolName" value={form.schoolName} onChange={updateForm} />
            <Field label="ФИО / инициалы учителя" name="teacherName" value={form.teacherName} onChange={updateForm} help="Для публикации или теста используйте инициалы." />
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-xs font-black text-ink/65">Класс обучения</span>
                <select className={fieldClass} value={String(form.grade)} onChange={(e) => chooseGrade(e.target.value)}>
                  {Array.from({ length: 11 }, (_, index) => String(index + 1)).map((grade) => <option key={grade} value={grade}>{grade} класс</option>)}
                </select>
              </label>
              <Field label="Литера класса" name="className" value={form.className} onChange={updateForm} />
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-black text-ink/65">Предмет и федеральная программа</span>
              <select className={fieldClass} value={selectedProgram?.id || ''} onChange={(e) => chooseProgram(e.target.value)}>
                {gradePrograms.map((program) => <option key={program.id} value={program.id}>{program.subject} · {program.hours_per_week} ч/нед.</option>)}
              </select>
              {selectedProgram && <span className="block text-[11px] font-semibold text-ink/50">{selectedProgram.source_doc || selectedProgram.content_source || 'Источник не указан'} · содержание: {selectedProgram.content_src || 'не указано'} · результаты: {selectedProgram.results_src || 'не указано'}</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost !py-2" onClick={fillFromCurriculum} disabled={!selectedProgram}>Заполнить из ФОП/ФРП</button>
              <button type="button" className="btn-ghost !py-2" onClick={() => navigate('/planner?p=' + encodeURIComponent(selectedProgram?.id || ''))} disabled={!selectedProgram}>Открыть КТП</button>
            </div>
            <div className="card p-3 space-y-2">
              <div className="font-black text-sm">Официальные материалы по классу</div>
              <p className="text-xs font-semibold text-ink/50">Каталог содержит 61 запись федеральных программ и ссылок (55 прямых PDF-ссылок по состоянию на 21.10.2026). Это метаданные: текст PDF не добавляется в контекст ИИ автоматически.</p>
              {gradeOfficialSources.length ? (
                <>
                  <select className={fieldClass} aria-label="Официальный источник по классу" value={selectedOfficialSource?.id || ''} onChange={(e) => updateForm('officialSourceId', e.target.value)}>
                    {gradeOfficialSources.map((item) => <option key={item.id} value={item.id}>{item.title}{item.pages ? ' · ' + item.pages + ' стр.' : ''}</option>)}
                  </select>
                  {selectedOfficialSource && <div className="text-[11px] font-semibold text-ink/50">{selectedOfficialSource.level || selectedOfficialSource.documentType || 'Официальный ресурс'} · {selectedOfficialSource.contentStoredLocally ? 'текст доступен локально' : 'текст не встроен в ИИ'} · актуальность и класс нужно сверить с оригиналом.</div>}
                  {selectedOfficialSource && <a className="inline-block text-sm font-bold text-primary underline" href={selectedOfficialSource.url} target="_blank" rel="noreferrer">{/\\.pdf(?:$|\\?)/i.test(selectedOfficialSource.url) ? 'Открыть официальный PDF' : 'Открыть официальный ресурс'}</a>}
                </>
              ) : <p className="text-xs font-semibold text-ink/50">В каталоге нет отдельной записи для выбранного класса. Откройте <a className="underline text-primary" href="https://edsoo.ru/rabochie-programmy/" target="_blank" rel="noreferrer">общий каталог ЕДСОО</a>.</p>}
            </div>
            <Field label="Темы программы (по одной строке; для КТП)" name="curriculumTopics" value={form.curriculumTopics} onChange={updateForm} multiline help="Заполните кнопкой выше, затем исправьте темы и формулировки, если нужно." />
            <Field label="Источник программы" name="curriculumSource" value={form.curriculumSource} onChange={updateForm} multiline />
            <Field label="Статус проверки источника" name="curriculumStatus" value={form.curriculumStatus} onChange={updateForm} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Часов в неделю" name="curriculumHoursPerWeek" value={form.curriculumHoursPerWeek} onChange={updateForm} type="number" />
              <Field label="Часов в год" name="curriculumHoursPerYear" value={form.curriculumHoursPerYear} onChange={updateForm} type="number" />
            </div>
            <Field label="Период" name="period" value={form.period} onChange={updateForm} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Дата документа" name="date" value={form.date} onChange={updateForm} type="date" />
              <Field label="Длительность урока, мин" name="durationMinutes" value={form.durationMinutes} onChange={updateForm} type="number" />
            </div>
            <Field label="Тема / предмет отчёта" name="topic" value={form.topic} onChange={updateForm} multiline />
            <Field label="Цель" name="goals" value={form.goals} onChange={updateForm} multiline />
            <Field label="Планируемый результат / критерии" name="outcomes" value={form.outcomes} onChange={updateForm} multiline />
            <Field label="Материалы / ключ ответов для учителя" name="materials" value={form.materials} onChange={updateForm} multiline />
            <Field label="Домашнее задание" name="homework" value={form.homework} onChange={updateForm} multiline />

            <div className="font-black pt-2">3. Отчётные данные (если применимо)</div>
            <Field label="Численность класса" name="studentCount" value={form.studentCount} onChange={updateForm} type="number" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Плановые часы за период" name="plannedHours" value={form.plannedHours} onChange={updateForm} type="number" />
              <Field label="Фактически проведено часов" name="completedHours" value={form.completedHours} onChange={updateForm} type="number" />
            </div>
            <div className="card p-3 space-y-2">
              <div className="font-black text-sm">Сводка из «Классы и чат»</div>
              <p className="text-xs font-semibold text-ink/50">Использует только локальные задания и сданные работы. Имена и тексты учеников в отчёт не включаются; посещаемость не собирается.</p>
              {teacherClasses.length ? (
                <div className="flex flex-wrap gap-2">
                  <select className={fieldClass + ' flex-1 min-w-[12rem]'} aria-label="Класс для сводки" value={form.schoolClassId} onChange={(e) => updateForm('schoolClassId', e.target.value)}>
                    <option value="">Выберите класс</option>
                    {teacherClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.title} · {cls.subject || 'предмет не указан'}</option>)}
                  </select>
                  <button type="button" className="btn-ghost !py-2" onClick={loadClassroomSnapshot} disabled={!form.schoolClassId}>Загрузить сводку</button>
                </div>
              ) : <p className="text-xs font-semibold text-ink/50">Классы учителя в этом браузере пока не созданы. Сначала создайте класс в «Классы и чат».</p>}
              <Field label="Сводка для отчёта (без имён учеников)" name="classroomSnapshot" value={form.classroomSnapshot} onChange={updateForm} multiline help="Текст можно проверить и исправить вручную перед экспортом." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Отметок «5»" name="five" value={form.five} onChange={updateForm} type="number" />
              <Field label="Отметок «4»" name="four" value={form.four} onChange={updateForm} type="number" />
              <Field label="Отметок «3»" name="three" value={form.three} onChange={updateForm} type="number" />
              <Field label="Отметок «2»" name="two" value={form.two} onChange={updateForm} type="number" />
            </div>
            <Field label="Посещаемость / выполненные работы" name="attendance" value={form.attendance} onChange={updateForm} multiline />
            <Field label="Сильные стороны / подтверждённые результаты" name="strengths" value={form.strengths} onChange={updateForm} multiline />
            <Field label="Затруднения / темы для повторения" name="gaps" value={form.gaps} onChange={updateForm} multiline />
            <Field label="Меры / следующие шаги / поддержка" name="actions" value={form.actions} onChange={updateForm} multiline />
            <Field label="Срок контрольной проверки" name="deadline" value={form.deadline} onChange={updateForm} type="date" />
            <Field label="Код ученика / инициалы" name="studentAlias" value={form.studentAlias} onChange={updateForm} />
            <Field label="Исходная учебная ситуация" name="baseline" value={form.baseline} onChange={updateForm} multiline />
            <Field label="План поддержки" name="support" value={form.support} onChange={updateForm} multiline />
            <Field label="Участники собрания" name="participants" value={form.participants} onChange={updateForm} multiline />
            <Field label="Повестка" name="agenda" value={form.agenda} onChange={updateForm} multiline />
            <Field label="Решения собрания" name="decisions" value={form.decisions} onChange={updateForm} multiline />
            <Field label="Основание / причина записки" name="reason" value={form.reason} onChange={updateForm} multiline />
            <Field label="Подтверждающие сведения / документы" name="evidence" value={form.evidence} onChange={updateForm} multiline />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary !py-2" onClick={generate}>Сформировать черновик</button>
              <button type="button" className="btn-ghost !py-2" onClick={() => { setForm(INITIAL_FORM(user)); setContent(''); setActiveId(''); setNotice('Форма очищена.'); }}>Очистить поля</button>
            </div>
            {notice && <p className="text-sm font-bold text-primary" role="status">{notice}</p>}
          </div>

          <div className="card p-4 space-y-3">
            <div className="font-black">Сохранённые черновики ({drafts.length})</div>
            {drafts.length === 0 && <p className="text-sm font-semibold text-ink/50">Сохранённых документов пока нет.</p>}
            {drafts.map((draft) => (
              <div key={draft.id} className="rounded-xl bg-soft/60 p-3 space-y-2">
                <button type="button" className="text-left font-black underline text-primary" onClick={() => openDraft(draft)}>{draft.title}</button>
                <div className="text-[11px] font-semibold text-ink/45">Сохранён: {new Date(draft.savedAt).toLocaleString('ru-RU')}</div>
                <button type="button" className="text-xs font-bold text-red-700 underline" onClick={() => deleteDraft(draft.id)}>Удалить</button>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4 sm:p-5 space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase text-primary">Редактор</div>
              <h2 className="h3">{doc.title}</h2>
            </div>
            {activeId && <span className="rounded-full bg-soft px-3 py-1 text-xs font-bold">Открыт черновик</span>}
          </div>
          <textarea className="w-full min-h-[500px] rounded-xl border border-black/10 bg-white p-3 text-sm leading-6" aria-label="Текст документа" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Нажмите «Сформировать черновик», чтобы создать документ. Затем отредактируйте его текст здесь." />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary !py-2" onClick={saveDraft}>Сохранить в браузере</button>
            <button type="button" className="btn-ghost !py-2" onClick={saveMarkdown}>Скачать Markdown</button>
            <button type="button" className="btn-ghost !py-2" onClick={savePrintableHtml}>HTML для печати / PDF</button>
            <button type="button" className="btn-ghost !py-2" onClick={continueWithAi}>Доработать в ИИ-чате</button>
          </div>
          <p className="text-xs font-semibold text-ink/50">Шаблоны помогают оформить документ, но не подтверждают обязательность его ведения. Приказ Минпросвещения России № 779 вступил в силу 1 марта 2025 года; применимость документа к вашей должности и локальным правилам проверьте по официальному тексту и актам организации.</p>
        </section>
      </div>
    </div>
  );
}
