#!/usr/bin/env python3
"""Rebuild school coverage by grade/subject; never infer completeness from links."""
from datetime import datetime, timezone
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from school_materials_common import DATA, MANIFESTS, CACHE, load, save

LABELS = {
    "russian-language": "Русский язык", "literature": "Литература",
    "native-language": "Родной язык", "native-literature": "Родная литература",
    "foreign-language": "Иностранный язык", "english-language": "Английский язык",
    "german-language": "Немецкий язык", "french-language": "Французский язык",
    "spanish-language": "Испанский язык", "chinese-language": "Китайский язык",
    "literary-reading": "Литературное чтение", "mathematics": "Математика",
    "algebra": "Алгебра", "geometry": "Геометрия",
    "probability-statistics": "Вероятность и статистика", "informatics": "Информатика",
    "history": "История", "social-studies": "Обществознание", "geography": "География",
    "biology": "Биология", "physics": "Физика", "chemistry": "Химия",
    "astronomy": "Астрономия", "world-around-us": "Окружающий мир",
    "economics": "Экономика", "ecology": "Экология", "technology": "Труд (технология)",
    "visual-arts": "Изобразительное искусство", "music": "Музыка",
    "physical-education": "Физическая культура",
    "fundamentals-security-defense-homeland": "Основы безопасности и защиты Родины",
    "fundamentals-spiritual-culture": "Основы духовно-нравственной культуры народов России",
    "chess": "Шахматы", "functional-literacy": "Функциональная грамотность",
    "exam-preparation": "Подготовка к ОГЭ/ЕГЭ",
    "regional-and-native-languages": "Региональные и родные языки",
    "all-school-subjects": "Межпредметные материалы / все школьные предметы",
}
LANGUAGE_SUBJECTS = {"english-language", "german-language", "french-language", "spanish-language", "chinese-language"}
BIBLIOGRAPHY_SUBJECTS = {
    "Русский язык": ["russian-language"], "Литературное чтение": ["literary-reading"],
    "Математика": ["mathematics"], "Информатика": ["informatics"],
    "Английский язык": ["english-language"], "Литература": ["literature"],
    "Математика (алгебра и геометрия)": ["mathematics"], "Алгебра": ["algebra"],
    "Математика (алгебра и начала математического анализа)": ["mathematics", "algebra"],
    "Геометрия": ["geometry"], "История": ["history"], "Физика": ["physics"],
    "Химия": ["chemistry"], "Изобразительное искусство": ["visual-arts"],
    "ОРКСЭ": ["fundamentals-spiritual-culture"], "Труд (технология)": ["technology"],
    "ОБЗР": ["fundamentals-security-defense-homeland"], "Китайский язык": ["chinese-language"],
    "География": ["geography"], "Окружающий мир": ["world-around-us"], "Музыка": ["music"],
    "Биология": ["biology"], "Физическая культура": ["physical-education"],
    "Вероятность и статистика": ["probability-statistics"], "Обществознание": ["social-studies"],
}
READING_LIST_SOURCE = {
    "id": "official-program-reading-list-2026",
    "name": "Список произведений, включённых в федеральные образовательные программы НОО, ООО и СОО (Минпросвещения России, 21.07.2026)",
    "url": "https://docs.edu.gov.ru/document/9e6ddf2b6267693c0cecdd047768cafa/",
    "kind": ["official-reading-list", "federal-program-content", "literature-reference"],
    "access": "public-document", "gradeRange": [1, 11],
    "subjects": ["literature", "literary-reading", "native-literature"],
    "storesFullTextLocally": False,
    "rightsNote": "Ссылка на официальный список произведений. Она не разрешает копировать современные произведения или полные учебники; права и условия переиспользования проверять для каждого текста.",
}


def source_matches(target, source):
    if target == "foreign-language":
        return source == "foreign-language" or source in LANGUAGE_SUBJECTS
    return target == source


def bibliography_matches(target, label):
    return any(source_matches(target, subject) for subject in BIBLIOGRAPHY_SUBJECTS.get(label, []))


def covers(grades, grade):
    if not isinstance(grades, list) or not grades:
        return False
    if len(grades) == 1:
        return grade == grades[0]
    return grades[0] <= grade <= grades[-1]


def records(obj, field):
    value = obj.get(field, [])
    return value if isinstance(value, list) else []


def extracurricular_status():
    manifest_path = MANIFESTS / "federal-extracurricular-programs.json"
    assets_path = CACHE / "assets.json"
    if not manifest_path.exists():
        return "PENDING_FIRST_GITHUB_ACTIONS_RUN", {"status": "MANIFEST_MISSING"}
    manifest = load(manifest_path)
    if not assets_path.exists():
        return "PENDING_RELEASE_ASSET_VERIFICATION", {
            "status": "ASSET_LIST_MISSING", "linksFound": manifest.get("linksFound", 0),
            "verified": manifest.get("verified", 0), "failed": manifest.get("failed", 0)
        }
    assets_doc = load(assets_path)
    assets = {item.get("name"): item.get("size") for item in assets_doc.get("assets", [])}
    files = manifest.get("files", [])
    checks = 0
    for item in files:
        name = item.get("releaseAsset")
        size = item.get("fileSizeBytes")
        valid_record = (
            item.get("status") == "PDF_SIGNATURE_AND_HASH_VERIFIED"
            and bool(name) and len(item.get("sha256") or "") == 64
            and isinstance(size, int) and size > 0
        )
        if valid_record and assets.get(name) == size:
            checks += 1
        else:
            return "INCOMPLETE_OR_FAILED", {
                "status": "INCOMPLETE_OR_FAILED", "linksFound": manifest.get("linksFound", 0),
                "verified": manifest.get("verified", 0), "failed": manifest.get("failed", 0),
                "releaseAssetChecks": checks, "failedAsset": name or item.get("id")
            }
    ok = (
        bool(files) and manifest.get("linksFound") == manifest.get("verified")
        and manifest.get("failed") == 0 and len(files) == manifest.get("verified")
        and checks == len(files)
    )
    if ok:
        return "VERIFIED_IN_RELEASE", {
            "status": "VERIFIED_IN_RELEASE", "linksFound": manifest.get("linksFound"),
            "verified": manifest.get("verified"), "failed": manifest.get("failed"),
            "releaseAssetChecks": checks,
            "manifestPath": "data/school-materials/manifests/federal-extracurricular-programs.json"
        }
    return "INCOMPLETE_OR_FAILED", {
        "status": "INCOMPLETE_OR_FAILED", "linksFound": manifest.get("linksFound", 0),
        "verified": manifest.get("verified", 0), "failed": manifest.get("failed", 0),
        "releaseAssetChecks": checks
    }


def stage_summary(rows, low, high):
    subset = [row for row in rows if low <= row["grade"] <= high]
    return {
        "gradeSubjectRows": len(subset),
        "rowsWithRecords": sum(row["indexedResourceCount"] > 0 for row in subset),
        "rowsWithPrograms": sum(row["officialWorkingProgramCount"] > 0 for row in subset),
        "rowsWithBibliography": sum(row["federalBibliographyRecordCount"] > 0 for row in subset),
        "rowsWithTasks": sum(row["locallyStoredOriginalTaskCount"] > 0 for row in subset),
    }


def main():
    checked_at = datetime.now(timezone.utc).date().isoformat()
    catalog_path = DATA / "official-russian-school-materials.json"
    catalog = load(catalog_path)
    grades = list(range(1, 12))
    subjects = catalog.get("subjects", [])
    unknown = set(subjects) - set(LABELS)
    if unknown:
        raise ValueError("Add labels for catalog subjects: " + ", ".join(sorted(unknown)))
    if len(subjects) != 37:
        raise ValueError("Expected 37 catalog subject IDs; got " + str(len(subjects)))

    practice = load(DATA / "original-school-practice-bank.json")
    bibliography = load(DATA / "federal-textbook-bibliography-2026.json")
    lesson_index = load(DATA / "edsoo-official-lesson-index.json")
    program_doc = load(DATA / "federal-working-programs.json")
    extra_doc = load(DATA / "official-extracurricular-programs.json")
    ocr_path = DATA / "federal-textbook-bibliography-2026-full-extraction.json"
    ocr_doc = load(ocr_path) if ocr_path.exists() else {"records": []}
    program_manifest_path = MANIFESTS / "federal-working-programs.json"
    program_manifest = load(program_manifest_path) if program_manifest_path.exists() else {}

    exercises = records(practice, "exercises")
    biblio = records(bibliography, "records")
    lessons = records(lesson_index, "items")
    programs = records(program_doc, "programs")
    extracurricular = records(extra_doc, "records")
    ocr = records(ocr_doc, "records")
    rows = []

    for grade in grades:
        for subject in subjects:
            biblio_count = sum(
                1 for item in biblio if grade in (item.get("grades") or [])
                and bibliography_matches(subject, item.get("subject", ""))
            )
            lesson_count = sum(
                1 for item in lessons
                if item.get("gradeStatus") == "GRADE_FOUND_IN_INDEX"
                and covers(item.get("gradeRange"), grade)
                and source_matches(subject, item.get("subject", ""))
            )
            matching_programs = [
                item for item in programs
                if covers(item.get("gradeRange"), grade)
                and source_matches(subject, item.get("subject", ""))
            ]
            extra_count = sum(
                1 for item in extracurricular
                if covers(item.get("gradeRange"), grade)
                and source_matches(subject, item.get("subject", ""))
            )
            task_count = sum(
                1 for item in exercises
                if item.get("grade") == grade and source_matches(subject, item.get("subject", ""))
            )
            count = biblio_count + lesson_count + len(matching_programs) + extra_count + task_count
            rows.append({
                "grade": grade, "subject": subject, "subjectLabel": LABELS[subject],
                "indexedResourceCount": count,
                "status": "LINKS_AVAILABLE" if count else "NO_EXACT_GRADE_SUBJECT_RECORD",
                "completeCoverage": "NOT_PROVEN",
                "curriculumApplicability": "SUPPORTED_BY_EXPLICIT_WORKING_PROGRAM" if matching_programs else "NOT_ESTABLISHED_BY_CURRENT_PROGRAM_INDEX",
                "federalBibliographyRecordCount": biblio_count,
                "verifiedOfficialLessonIndexCount": lesson_count,
                "officialWorkingProgramCount": len(matching_programs),
                "releaseAvailableWorkingProgramCount": sum(item.get("storedInRelease") is True for item in matching_programs),
                "officialExtracurricularProgramCount": extra_count,
                "locallyStoredOriginalTaskCount": task_count,
                "federalBibliographyFullTextCount": 0,
                "notes": "Считаются записи в отдельных индексах с совпадением класса и предмета; это не количество уникальных книг. Полный текст учебника не подтверждён. Класс/предмет без точного совпадения требует проверки по действующей ФОП."
            })

    extra_status, extra_evidence = extracurricular_status()
    known_grade_lessons = sum(item.get("gradeStatus") == "GRADE_FOUND_IN_INDEX" for item in lessons)
    rows_with_records = sum(row["indexedResourceCount"] > 0 for row in rows)
    full_text_count = sum(item.get("fullTextAvailable") is True for item in biblio)
    summary = {
        "subjectGradeRows": len(rows), "catalogSubjectCount": len(subjects),
        "rowsWithAtLeastOneIndexedLink": rows_with_records,
        "rowsWithAnExplicitWorkingProgram": sum(row["officialWorkingProgramCount"] > 0 for row in rows),
        "rowsWithAtLeastOneBibliographyRecord": sum(row["federalBibliographyRecordCount"] > 0 for row in rows),
        "rowsWithAGradeVerifiedOfficialLesson": sum(row["verifiedOfficialLessonIndexCount"] > 0 for row in rows),
        "rowsWithAtLeastOneOriginalPracticeTask": sum(row["locallyStoredOriginalTaskCount"] > 0 for row in rows),
        "rowsProvenComplete": 0, "federalBibliographySubsetRecords": len(biblio),
        "federalBibliographySubsetRecordsWithFullText": full_text_count,
        "unverifiedOcrBibliographyRecords": len(ocr),
        "ocrStatus": "OCR_EXTRACTED_NEEDS_RECHECK; excluded from counts used to claim verified grade/subject coverage",
        "officialWorkingProgramRecords": len(programs),
        "directWorkingProgramPDFs": catalog.get("directWorkingProgramPdfCount", 0),
        "workingProgramReleaseAssets": program_manifest.get("verified", catalog.get("federalWorkingProgramReleasePdfCount", 0)),
        "officialExtracurricularProgramRecords": len(extracurricular),
        "officialExtracurricularManifest": {
            "linksFound": extra_evidence.get("linksFound", 0), "verified": extra_evidence.get("verified", 0),
            "failed": extra_evidence.get("failed", 0), "releaseAssetChecks": extra_evidence.get("releaseAssetChecks", 0),
            "status": extra_status
        },
        "originalPracticeTaskCount": len(exercises), "originalPracticeLicense": practice.get("license", "NOT_STATED"),
        "edsooOfficialLessonIndexRecords": len(lessons),
        "lessonRecordsWithGradeEstablished": known_grade_lessons,
        "lessonRecordsNeedingGradeRecheck": len(lessons) - known_grade_lessons,
        "note": "Все строки остаются NOT_PROVEN. Счётчики отражают записи индекса, а не полные тексты учебников. Категории «иностранный язык» и отдельные языки пересекаются; значения по предметам нельзя складывать между строками."
    }
    matrix = {
        "schemaVersion": 2, "name": "school-curriculum-coverage", "checkedAt": checked_at,
        "grades": grades, "subjects": subjects,
        "coveragePolicy": "Матрица охватывает 37 идентификаторов каталога × классы 1–11. Это сетка сверки, а не утверждение, что каждый предмет преподаётся в каждом классе. Наличие записи не доказывает полноту; VERIFIED_COMPLETE запрещён без проверки программы, полного инвентаря и прав.",
        "statusDefinitions": {
            "LINKS_AVAILABLE": "Есть запись в библиографии, подтверждённом по классу индексе уроков, рабочих программах, внеурочной программе или авторском банке с точным совпадением по классу и предмету.",
            "NO_EXACT_GRADE_SUBJECT_RECORD": "В подсчитываемых индексах нет точной записи для этой пары; это не доказывает отсутствие предмета или материалов.",
            "NOT_PROVEN": "Полнота не установлена по актуальной программе, полному инвентарю и подтверждённым правам.",
            "VERIFIED_COMPLETE": "Только после полной сверки источников, файлов и прав; сейчас не назначается."
        },
        "rowScopeNote": "Категории «иностранный язык» и конкретные языки, а также «все школьные предметы» пересекаются. Суммы между ними не являются числом уникальных материалов.",
        "rows": rows, "summary": summary
    }
    save(DATA / "school-curriculum-coverage.json", matrix)

    if not any(item.get("id") == READING_LIST_SOURCE["id"] for item in catalog.get("sources", [])):
        catalog.setdefault("sources", []).append(READING_LIST_SOURCE)
    catalog["lastVerified"] = checked_at
    catalog["extracurricularProgramsLocalSyncStatus"] = extra_status
    catalog["extracurricularSyncEvidence"] = extra_evidence
    if program_manifest:
        catalog["federalWorkingProgramReleasePdfCount"] = program_manifest.get("verified", catalog.get("federalWorkingProgramReleasePdfCount", 0))
        catalog["failedFederalWorkingProgramPdfCount"] = program_manifest.get("failed", catalog.get("failedFederalWorkingProgramPdfCount", 0))
    catalog["currentCoverageNote"] = (
        "Сверка " + checked_at + ": матрица " + str(len(rows)) + " строк (37 предметных идентификаторов × 11 классов); "
        + str(rows_with_records) + " сочетаний имеют индексные записи; ни одна строка не доказана полностью. "
        "Полные тексты актуальных издательских учебников не собраны; полнота остаётся NOT PROVEN. "
        + str(len(ocr)) + " OCR-библиографических записей исключены из подтверждённого подсчёта до ручной перепроверки."
    )
    save(catalog_path, catalog)

    stages = [
        ("Начальная школа (1–4)", stage_summary(rows, 1, 4)),
        ("Основная школа (5–9)", stage_summary(rows, 5, 9)),
        ("Средняя школа (10–11)", stage_summary(rows, 10, 11))
    ]
    lines = [
        "# Сверка и наполнение школьных материалов — " + checked_at, "",
        "Матрица содержит " + str(len(rows)) + " сочетаний (37 идентификаторов каталога × 11 классов). Это сетка аудита, а не заявление, что каждый предмет преподаётся в каждом классе. Полнота не подтверждена ни в одной строке.", "",
        "| Этап | Клеток | Есть записи | Есть рабочая программа | Есть библиография | Есть авторское задание |",
        "|---|---:|---:|---:|---:|---:|"
    ]
    for name, values in stages:
        lines.append("| " + name + " | " + str(values["gradeSubjectRows"]) + " | " + str(values["rowsWithRecords"]) + " | " + str(values["rowsWithPrograms"]) + " | " + str(values["rowsWithBibliography"]) + " | " + str(values["rowsWithTasks"]) + " |")
    lines += [
        "", "## Проверенные количества", "",
        "- Федеральный перечень учебников 2026: [официальный приказ № 436](https://publication.pravo.gov.ru/document/0001202607230005).",
        "- Частичный библиографический набор: " + str(len(biblio)) + " записей; полных текстов среди них: " + str(full_text_count) + ".",
        "- OCR-выгрузка ФПУ: " + str(len(ocr)) + " записей со статусом OCR_EXTRACTED_NEEDS_RECHECK; не входит в подтверждённые счётчики.",
        "- Федеральные рабочие программы: " + str(len(programs)) + " записей; прямых PDF: " + str(catalog.get("directWorkingProgramPdfCount", 0)) + "; по манифесту файлов в Release: " + str(summary["workingProgramReleaseAssets"]) + ".",
        "- Внеурочная деятельность: " + str(len(extracurricular)) + " записей; синхронизация активов: " + extra_status + ".",
        "- Материалы ЕДСОО: " + str(len(lessons)) + " ссылок; класс установлен у " + str(known_grade_lessons) + "; требуется перепроверить класс у " + str(len(lessons) - known_grade_lessons) + ".",
        "- Авторский банк: " + str(len(exercises)) + " заданий с ответами и объяснениями; лицензия " + str(practice.get("license", "NOT_STATED")) + ".",
        "- Официальный список произведений для федеральных программ: [ссылка Минпросвещения](https://docs.edu.gov.ru/document/9e6ddf2b6267693c0cecdd047768cafa/). Добавление ссылки не разрешает копировать защищённые тексты.", "",
        "## Официальные источники", "",
        "- [Федеральный перечень учебников](https://publication.pravo.gov.ru/document/0001202607230005)",
        "- [Реестр ФОП и рабочих программ](https://fgosreestr.edsoo.ru/educational-programs)",
        "- [Федеральные рабочие программы ЕДСОО](https://edsoo.ru/rabochie-programmy/)",
        "- [Внеурочная деятельность ЕДСОО](https://edsoo.ru/rabochie-programmy-vd/)",
        "- [Демоверсии ОГЭ](https://fipi.ru/oge/demoversii-specifikacii-kodifikatory)",
        "- [Демоверсии ЕГЭ](https://fipi.ru/ege/demoversii-specifikacii-kodifikatory)",
        "- [Открытый банк ОГЭ](https://fipi.ru/oge/otkrytyy-bank-zadaniy-oge)",
        "- [Открытый банк ЕГЭ](https://fipi.ru/ege/otkrytyy-bank-zadaniy-ege)",
        "- [Российская электронная школа](https://resh.edu.ru/)", "",
        "## Остаточные пробелы", "",
        "1. Полные современные учебники не включены как локальные полные тексты; нужны разрешённые копии или подтверждённые официальные точки доступа.",
        "2. OCR-выгрузка требует ручной сверки названий, авторов, предметов, классов и кодов с официальным PDF.",
        "3. Ссылки ЕДСОО без установленного класса требуют проверки на странице-источнике.",
        "4. Наличие JSON в git не доказывает доступность материала ученику в интерфейсе репетитора.", "",
        "## Статус", "",
        "- Сверка счётчиков по классу/предмету: выполняется этим скриптом и тестируется в CI.",
        "- Полнота учебников и материалов 1–11: NOT PROVEN.",
        "- Полные защищённые тексты не копируются без подтверждённых прав.", ""
    ]
    (DATA / "RECONCILIATION-2026-10-21.md").write_text("\n".join(lines), encoding="utf-8")
    print("SUMMARY grades=11 subjects=" + str(len(subjects)) + " rows=" + str(len(rows)) + " rows_with_records=" + str(rows_with_records) + " rows_complete=0 extras=" + extra_status)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
