# School materials: import report

## curriculum-gap-triage-2026-10-28.json (205391 bytes)
top-level: schemaVersion:int, generatedAt:str, purpose:str, sources:dict[3], metrics:dict[11], policy:list[4], programEvidence:list[45], items:list[166], officialSourceRegistry:list[11]
- `programEvidence` record keys: id(45), title(45), subject(45), gradeRange(45), url(45), sourceLandingPage(45), checkedAt(45), year(45), rightsStatus(45)
  - rightsStatus: LINK_TO_OFFICIAL_SOURCE; keep active attribution link; do not assume this permits a mirror=45
  - records mentioning «до 31 августа 20XX»: 0
- `items` record keys: grade(166), subject(166), indexedResourceCount(166), sourceMatrixStatus(166), currentApplicability(166), completeCoverage(166), triageStatus(166), decision(166), exactProgramIds(166), relatedProgramHintIds(166), nextStep(166), officialScopeHintIds(166)
  - records mentioning «до 31 августа 20XX»: 0
- `officialSourceRegistry` record keys: id(11), title(11), url(11), publisher(11), sourceType(11), gradeRange(11), subjects(11), scopeNote(11)
  - records mentioning «до 31 августа 20XX»: 0

## curriculum-gap-triage-2026-10-29.json (204138 bytes)
top-level: schemaVersion:int, generatedAt:str, purpose:str, sources:dict[3], metrics:dict[12], policy:list[5], resolvedComponentRows:list[11], items:list[155], programEvidence:list[45], officialSourceRegistry:list[11]
- `resolvedComponentRows` record keys: grade(11), subject(11), previousStatus(11), resolutionStatus(11), mappingId(11), relationship(11), programSourceIds(11), evidenceUrls(11), completeCoverage(11), note(11)
  - records mentioning «до 31 августа 20XX»: 0
- `items` record keys: grade(155), subject(155), indexedResourceCount(155), sourceMatrixStatus(155), currentApplicability(155), completeCoverage(155), triageStatus(155), decision(155), exactProgramIds(155), relatedProgramHintIds(155), nextStep(155), officialScopeHintIds(155)
  - records mentioning «до 31 августа 20XX»: 0
- `programEvidence` record keys: id(45), title(45), subject(45), gradeRange(45), url(45), sourceLandingPage(45), checkedAt(45), year(45), rightsStatus(45)
  - rightsStatus: LINK_TO_OFFICIAL_SOURCE; keep active attribution link; do not assume this permits a mirror=45
  - records mentioning «до 31 августа 20XX»: 0
- `officialSourceRegistry` record keys: id(11), title(11), url(11), publisher(11), sourceType(11), gradeRange(11), subjects(11), scopeNote(11)
  - records mentioning «до 31 августа 20XX»: 0

## edsoo-official-lesson-index.json (142208 bytes)
top-level: schemaVersion:int, name:str, source:str, checkedAt:str, discoveredCount:int, note:str, items:list[103], gradeVerificationSummary:dict[4]
- `items` record keys: id(103), sourceId(103), title(103), url(103), description(103), gradeRange(103), gradeStatus(103), subject(103), topic(103), kind(103), accessStatus(103), rightsStatus(103), contentStoredLocally(103), metadataCompleteness(103), checkedAt(103), note(103), gradeEvidence(96), gradeEvidenceUrl(96), gradeEvidenceType(96)
  - rightsStatus: LINK_ONLY_REUSE_TERMS_NOT_CONFIRMED=103
  - records mentioning «до 31 августа 20XX»: 0

## federal-textbook-bibliography-2026-full-extraction.json (1568798 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, source:dict[6], extraction:dict[7], records:list[934]
- `records` record keys: id(934), federalListNumber(934), sectionCode(934), title(934), authors(934), publisher(934), subject(934), subjectLabel(934), gradeRange(934), grades(934), gradeRaw(934), specialClass(934), sourceOrder(934), sourceUrl(934), officialLandingPage(934), sourceSectionUrl(934), extractionStatus(934), accessStatus(934), fullTextAvailable(934), fullTextStoredLocally(934), rightsStatus(934), checkedAt(934), extractionNote(934)
  - extractionStatus: OCR_EXTRACTED_NEEDS_RECHECK=934
  - rightsStatus: NOT_PROVEN_FOR_REPUBLICATION=934
  - records mentioning «до 31 августа 20XX»: 0
  - samples:
    ```json
    {"id": "fpu2026-pdf-0005-1-1-1-1-1-1", "federalListNumber": 5, "sectionCode": "1.1.1.1.1.1", "title": "Русский язык Азбука: 1-й класс; учебник: в 2 частях; 16-е издание, переработанное", "authors": "Горский В.Г., Кирюшкин В.А., Виноградская Л.А. и другие", "publisher": "Акционерное общество «Издательство Просвещение»", "subject": "russian-language", "subjectLabel": "Русский язык", "gradeRange": [1, 1], "grades": [1], "gradeRaw": "1", "specialClass": false, "sourceOrder": "Приказ Минпросвещения России от 22.06.2026 № 436", "sourceUrl": "https://minjust.consultant.ru/files/60664", "officialLandingPage": "https://minjust.consultant.ru/documents/60664", "sourceSectionUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/", "extractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "fullTextAvailable": false, "fullTextStoredLocally": false, "rights
    ```
    ```json
    {"id": "fpu2026-pdf-0006-1-1-1-1-2", "federalListNumber": 6, "sectionCode": "1.1.1.1.2", "title": "Русский ялык 1-й класс: учебник; 15-е издание, переработанное", "authors": "Канакина В.П., Горецкий В.Г.", "publisher": "Акционерное общество «Издательство «Провсещение»", "subject": "russian-language", "subjectLabel": "Русский язык", "gradeRange": [1, 1], "grades": [1], "gradeRaw": "1", "specialClass": false, "sourceOrder": "Приказ Минпросвещения России от 22.06.2026 № 436", "sourceUrl": "https://minjust.consultant.ru/files/60664", "officialLandingPage": "https://minjust.consultant.ru/documents/60664", "sourceSectionUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/", "extractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "fullTextAvailable": false, "fullTextStoredLocally": false, "rightsStatus": "NOT_PROVEN_FOR_REPUBLICATION", "checkedA
    ```
    ```json
    {"id": "fpu2026-pdf-0007-1-1-1-1-1-3", "federalListNumber": 7, "sectionCode": "1.1.1.1.1.3", "title": "Русский ялык 2-й класс: учебник; в 2 частях; 14-е издание, переработанное", "authors": "Канакина В.П., Горецкий В.Г.", "publisher": "Акционерное общество «Издательство «Провсещение»", "subject": "russian-language", "subjectLabel": "Русский язык", "gradeRange": [2, 2], "grades": [2], "gradeRaw": "2", "specialClass": false, "sourceOrder": "Приказ Минпросвещения России от 22.06.2026 № 436", "sourceUrl": "https://minjust.consultant.ru/files/60664", "officialLandingPage": "https://minjust.consultant.ru/documents/60664", "sourceSectionUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/", "extractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "fullTextAvailable": false, "fullTextStoredLocally": false, "rightsStatus": "NOT_PROVEN_FOR_REPUBLICA
    ```
    ```json
    {"id": "fpu2026-pdf-0529-1-1-2-9-14-2", "federalListNumber": 529, "sectionCode": "1.1.2.9.14.2", "title": "История нашего края. Ростовская область. XVII - XIX века; учебник для 6 класса общеобразовательных организаций; 1-е издание", "authors": "Осадченко Н.Г., Галий И.П.; под научной редакция Дружбы О.В.", "publisher": null, "subject": "history", "subjectLabel": "История", "gradeRange": [6, 6], "grades": [6], "gradeRaw": "6", "specialClass": false, "sourceOrder": "Приказ Минпросвещения России от 22.06.2026 № 436", "sourceUrl": "https://minjust.consultant.ru/files/60664", "officialLandingPage": "https://minjust.consultant.ru/documents/60664", "sourceSectionUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/", "extractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "fullTextAvailable": false, "fullTextStoredLocally": false, "rightsStatus":
    ```
    ```json
    {"id": "fpu2026-pdf-0530-1-1-2-9-14-3", "federalListNumber": 530, "sectionCode": "1.1.2.9.14.3", "title": "История нашего края. Ростовская область. XX - первая четверть XXI века; учебник для 7 класса общеобразовательных организаций; 1-е издание", "authors": "Рогозин В.А., Денисова Г.С.; под научной редакцией Дружбы О.В.", "publisher": null, "subject": "history", "subjectLabel": "История", "gradeRange": [7, 7], "grades": [7], "gradeRaw": "7", "specialClass": false, "sourceOrder": "Приказ Минпросвещения России от 22.06.2026 № 436", "sourceUrl": "https://minjust.consultant.ru/files/60664", "officialLandingPage": "https://minjust.consultant.ru/documents/60664", "sourceSectionUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/", "extractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "fullTextAvailable": false, "fullTextStoredLocally": false,
    ```

## federal-textbook-bibliography-2026.json (161801 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, officialDocument:dict[5], totalRecords:int, extractionStatus:str, note:str, records:list[144]
- `records` record keys: id(144), federalListNumber(144), subject(144), grades(144), title(144), authors(144), publisher(144), level(144), order(144), sourceUrl(144), bibliographicStatus(144), sourceRecordVerified(144), fullTextAvailable(144), fullTextStoredLocally(144), accessStatus(144), rightsStatus(144), note(144), alternateRecord(2)
  - rightsStatus: NOT_PROVEN_FOR_REPUBLICATION=144
  - records mentioning «до 31 августа 20XX»: 0
  - samples:
    ```json
    {"id": "fpu2026-book-0006", "federalListNumber": 6, "subject": "Русский язык", "grades": [1], "title": "Русский язык: 1-й класс: учебник", "authors": "Канакина В.П., Горецкий В.Г.", "publisher": "АО «Издательство «Просвещение»", "level": "НОО", "order": "№436 от 22.06.2026", "sourceUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/2ff7a8c72de3994f30496a0ccbb1ddafdaddf518/", "bibliographicStatus": "PARTIAL_INDEX_ENTRY", "sourceRecordVerified": true, "fullTextAvailable": false, "fullTextStoredLocally": false, "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "rightsStatus": "NOT_PROVEN_FOR_REPUBLICATION", "note": "Запись в каталоге не означает, что полный текст учебника доступен или разрешён к копированию."}
    ```
    ```json
    {"id": "fpu2026-book-0007", "federalListNumber": 7, "subject": "Русский язык", "grades": [2], "title": "Русский язык: 2-й класс: учебник: в 2 частях", "authors": "Канакина В.П., Горецкий В.Г.", "publisher": "АО «Издательство «Просвещение»", "level": "НОО", "order": "№436 от 22.06.2026", "sourceUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/2ff7a8c72de3994f30496a0ccbb1ddafdaddf518/", "bibliographicStatus": "PARTIAL_INDEX_ENTRY", "sourceRecordVerified": true, "fullTextAvailable": false, "fullTextStoredLocally": false, "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "rightsStatus": "NOT_PROVEN_FOR_REPUBLICATION", "note": "Запись в каталоге не означает, что полный текст учебника доступен или разрешён к копированию."}
    ```
    ```json
    {"id": "fpu2026-book-0008", "federalListNumber": 8, "subject": "Русский язык", "grades": [3], "title": "Русский язык: 3-й класс: учебник: в 2 частях", "authors": "Канакина В.П., Горецкий В.Г.", "publisher": "АО «Издательство «Просвещение»", "level": "НОО", "order": "№436 от 22.06.2026", "sourceUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/2ff7a8c72de3994f30496a0ccbb1ddafdaddf518/", "bibliographicStatus": "PARTIAL_INDEX_ENTRY", "sourceRecordVerified": true, "fullTextAvailable": false, "fullTextStoredLocally": false, "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "rightsStatus": "NOT_PROVEN_FOR_REPUBLICATION", "note": "Запись в каталоге не означает, что полный текст учебника доступен или разрешён к копированию."}
    ```
    ```json
    {"id": "fpu2026-book-0347", "federalListNumber": 347, "subject": "Геометрия", "grades": [7, 8, 9], "title": "Геометрия", "authors": "Атанасян Л.С., Бутузов В.Ф., Кадомцев С.Б. и другие", "publisher": "АО «Издательство «Просвещение»", "level": "ООО", "order": "№436 от 22.06.2026", "sourceUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/4cf01534f8ee978a2e0f2342feda2bf164d24489/", "bibliographicStatus": "PARTIAL_INDEX_ENTRY", "sourceRecordVerified": true, "fullTextAvailable": false, "fullTextStoredLocally": false, "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "rightsStatus": "NOT_PROVEN_FOR_REPUBLICATION", "note": "Запись в каталоге не означает, что полный текст учебника доступен или разрешён к копированию."}
    ```
    ```json
    {"id": "fpu2026-book-0199", "federalListNumber": 199, "subject": "Окружающий мир", "grades": [1], "title": "Окружающий мир: 1-й класс: учебник: в 2 частях", "authors": "Плешаков А.А.", "publisher": "АО «Издательство «Просвещение»", "level": "НОО", "order": "№436 от 22.06.2026", "sourceUrl": "https://www.consultant.ru/document/cons_doc_LAW_540209/210e0071d6a151ed5440d01314f522dc45f4f450/", "bibliographicStatus": "PARTIAL_INDEX_ENTRY", "sourceRecordVerified": true, "fullTextAvailable": false, "fullTextStoredLocally": false, "accessStatus": "BIBLIOGRAPHIC_RECORD_ONLY", "rightsStatus": "NOT_PROVEN_FOR_REPUBLICATION", "note": "Запись в каталоге не означает, что полный текст учебника доступен или разрешён к копированию."}
    ```

## federal-textbook-list-2026-sections.json (62913 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, officialDocument:dict[8], discoveredSectionLinksCount:int, coverage:str, sections:list[61]
- `sections` record keys: id(61), title(61), url(61), sourceId(61), subjectLabel(61), catalogueSnippet(61), entryNumberHint(61), verifiedAt(61), status(61), contentStoredLocally(61), rightsStatus(61), note(61)
  - status: SOURCE_LINK_VERIFIED_SNIPPET_ONLY=61
  - rightsStatus: official legal act/metadata; individual textbook files not included=61
  - records mentioning «до 31 августа 20XX»: 0
  - samples:
    ```json
    {"id": "fpu2026-section-001", "title": "1.1.2.7. Математика (учебный предмет) \\ КонсультантПлюс", "url": "https://www.consultant.ru/document/cons_doc_LAW_540209/1a3c4bf2637a6079228b3b08aba2c9546014ee53", "sourceId": "federal-textbook-list-2026", "subjectLabel": "Математика", "catalogueSnippet": "473. 1.1.2.7. Математика (учебный предмет) 474. 1.1.2.7.1.1. Математика: 5-й класс: базовый уровень: учебник: в 2 частях; 3-е издание, переработанное Виленки...", "entryNumberHint": 473, "verifiedAt": "2026-10-21", "status": "SOURCE_LINK_VERIFIED_SNIPPET_ONLY", "contentStoredLocally": false, "rightsStatus": "official legal act/metadata; individual textbook files not included", "note": "Section URL is a navigational bibliographic reference. The snippet is not the complete list of records in the section."}
    ```
    ```json
    {"id": "fpu2026-section-002", "title": "2.1.2.4. Математика (учебный предмет) \\ КонсультантПлюс", "url": "https://www.consultant.ru/document/cons_doc_LAW_540209/f40f12fbbe3054ea34002968107dc793335b9d8a", "sourceId": "federal-textbook-list-2026", "subjectLabel": "Математика", "catalogueSnippet": "1046. 2.1.2.4. Математика (учебный предмет) 1047. 2.1.2.4.1.1. Математика: 5-й класс: углубленный уровень: учебник в 2 частях; 1-е издание Дорофеев Г.В., Пет...", "entryNumberHint": 1046, "verifiedAt": "2026-10-21", "status": "SOURCE_LINK_VERIFIED_SNIPPET_ONLY", "contentStoredLocally": false, "rightsStatus": "official legal act/metadata; individual textbook files not included", "note": "Section URL is a navigational bibliographic reference. The snippet is not the complete list of records in the section."}
    ```
    ```json
    {"id": "fpu2026-section-003", "title": "1.3.6.2.2.1. Математика (учебный предмет) \\ КонсультантПлюс", "url": "https://www.consultant.ru/document/cons_doc_LAW_540209/5b409aeb2b359a723bef45320f6d7996e75de87d", "sourceId": "federal-textbook-list-2026", "subjectLabel": "Математика", "catalogueSnippet": "890. 1.3.6.2.2.1. Математика (учебный предмет) 891. 1.3.6.2.2.1.1.1. Математика: 5-й класс: учебник для общеобразовательных организаций, реализующих адаптиро...", "entryNumberHint": 890, "verifiedAt": "2026-10-21", "status": "SOURCE_LINK_VERIFIED_SNIPPET_ONLY", "contentStoredLocally": false, "rightsStatus": "official legal act/metadata; individual textbook files not included", "note": "Section URL is a navigational bibliographic reference. The snippet is not the complete list of records in the section."}
    ```
    ```json
    {"id": "fpu2026-section-031", "title": "1.1.1.4. Литературное чтение на родном языке ...", "url": "https://www.consultant.ru/document/cons_doc_LAW_540209/6847b3839c7c6ca350776eb76b72f74bec6d7ace", "sourceId": "federal-textbook-list-2026", "subjectLabel": "Литературное чтение", "catalogueSnippet": "117. 1.1.1.4. Литературное чтение на родном языке (учебный предмет) 118. 1.1.1.4.1.1. Пос (хакас) литературнай . 1 класс: пос (хакас) апарылчатхан ...", "entryNumberHint": 117, "verifiedAt": "2026-10-21", "status": "SOURCE_LINK_VERIFIED_SNIPPET_ONLY", "contentStoredLocally": false, "rightsStatus": "official legal act/metadata; individual textbook files not included", "note": "Section URL is a navigational bibliographic reference. The snippet is not the complete list of records in the section."}
    ```
    ```json
    {"id": "fpu2026-section-032", "title": "1.1.2.9. История (учебный предмет)", "url": "https://www.consultant.ru/document/cons_doc_LAW_540209/eb97a1787c2876237b0e287fea3d5055aec2d8ac", "sourceId": "federal-textbook-list-2026", "subjectLabel": "История", "catalogueSnippet": "История нашего края. Республика Ингушетия. 7 класс: учебник для общеобразовательных организаций; 1-е издание. Акиева П.Х.,. Долгиева М.Б,.", "entryNumberHint": null, "verifiedAt": "2026-10-21", "status": "SOURCE_LINK_VERIFIED_SNIPPET_ONLY", "contentStoredLocally": false, "rightsStatus": "official legal act/metadata; individual textbook files not included", "note": "Section URL is a navigational bibliographic reference. The snippet is not the complete list of records in the section."}
    ```

## federal-textbook-ocr-crosswalk-2026.json (385358 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, sourceDocument:str, matchingPolicy:str, summary:dict[11], records:list[934]
- `records` record keys: ocrId(934), federalListNumber(934), sectionCode(934), structuredRecordId(934), ocrGradeRange(934), structuredGrade(934), normalizedTitleExact(934), ocrExtractionStatus(934), status(934)
  - status: KEY_AND_GRADE_MATCH_TITLE_NEEDS_RECHECK=480, NO_STRUCTURED_MATCH_NEEDS_MANUAL_REVIEW=308, KEY_GRADE_TITLE_MATCH_NEEDS_MANUAL_CONFIRMATION=139, DUPLICATE_KEY_NEEDS_MANUAL_REVIEW=6, KEY_MATCH_GRADE_MISMATCH_NEEDS_MANUAL_REVIEW=1
  - records mentioning «до 31 августа 20XX»: 0
  - samples:
    ```json
    {"ocrId": "fpu2026-pdf-0005-1-1-1-1-1-1", "federalListNumber": 5, "sectionCode": "1.1.1.1.1.1", "structuredRecordId": "fpu2026-0005", "ocrGradeRange": [1, 1], "structuredGrade": 1, "normalizedTitleExact": true, "ocrExtractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "status": "KEY_GRADE_TITLE_MATCH_NEEDS_MANUAL_CONFIRMATION"}
    ```
    ```json
    {"ocrId": "fpu2026-pdf-0006-1-1-1-1-2", "federalListNumber": 6, "sectionCode": "1.1.1.1.2", "structuredRecordId": null, "ocrGradeRange": [1, 1], "structuredGrade": null, "normalizedTitleExact": false, "ocrExtractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "status": "NO_STRUCTURED_MATCH_NEEDS_MANUAL_REVIEW"}
    ```
    ```json
    {"ocrId": "fpu2026-pdf-0007-1-1-1-1-1-3", "federalListNumber": 7, "sectionCode": "1.1.1.1.1.3", "structuredRecordId": "fpu2026-0007", "ocrGradeRange": [2, 2], "structuredGrade": 2, "normalizedTitleExact": false, "ocrExtractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "status": "KEY_AND_GRADE_MATCH_TITLE_NEEDS_RECHECK"}
    ```
    ```json
    {"ocrId": "fpu2026-pdf-0529-1-1-2-9-14-2", "federalListNumber": 529, "sectionCode": "1.1.2.9.14.2", "structuredRecordId": "fpu2026-0529", "ocrGradeRange": [6, 6], "structuredGrade": 6, "normalizedTitleExact": true, "ocrExtractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "status": "KEY_GRADE_TITLE_MATCH_NEEDS_MANUAL_CONFIRMATION"}
    ```
    ```json
    {"ocrId": "fpu2026-pdf-0530-1-1-2-9-14-3", "federalListNumber": 530, "sectionCode": "1.1.2.9.14.3", "structuredRecordId": "fpu2026-0530", "ocrGradeRange": [7, 7], "structuredGrade": 7, "normalizedTitleExact": true, "ocrExtractionStatus": "OCR_EXTRACTED_NEEDS_RECHECK", "status": "KEY_GRADE_TITLE_MATCH_NEEDS_MANUAL_CONFIRMATION"}
    ```

## federal-textbooks-2026-basic-5-9.json (640099 bytes)
top-level: schemaVersion:int, title:str, source:str, officialSource:str, checkedAt:str, gradeBand:str, recordCount:int, notes:list[3], records:list[423]
- `records` record keys: id(423), listRow(423), sectionCode(423), listSection(423), schoolStage(423), grade(423), title(423), authors(423), publisher(423), relatedTeachingMaterials(423), approvalBasis(423), approvalOrganization(423), approvalOrder(423), allowedUseUntil(423), metadataSource(423), officialDocument(423), checkedAt(423), contentStoredLocally(423), status(423), rightsStatus(423)
  - status: BIBLIOGRAPHIC_ENTRY_EXTRACTED=423
  - rightsStatus: LINK_ONLY; bibliography does not grant permission to redistribute textbook files=423
  - records mentioning «до 31 августа 20XX»: 334
  - samples:
    ```json
    {"id": "fpu2026-0233", "listRow": 233, "sectionCode": "1.1.2.1.1.1", "listSection": "1.1", "schoolStage": "basic", "grade": 5, "title": "Русский язык: 5-й класс: учебник: в 2 частях; 5-е издание, переработанное", "authors": "Ладыженская Т.А., Баранов М.Т., Тростенцова Л.А. и другие", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ Министерства просвещения Российской Федерации от 31 мая 2021 г. № 287 \"Об утверждении федерального государственного образовательного стандарта основного общего образования\" (зарегистрирован Министерством юстиции Российской Федерации 5 июля 2021 г., регистрационный № 64101) с изменениями, внесенными приказами Министерства просвещения Российской Федерации от 18 июля 2022 г. № 568 (зарегистрирован Министерством юстиции Российской Федерации 17 августа 2022 г., регистрационный № 69675),
    ```
    ```json
    {"id": "fpu2026-0234", "listRow": 234, "sectionCode": "1.1.2.1.1.2", "listSection": "1.1", "schoolStage": "basic", "grade": 6, "title": "Русский язык: 6-й класс: учебник: в 2 частях; 5-е издание, переработанное", "authors": "Баранов М.Т., Ладыженская Т.А., Тростенцова Л.А. и другие", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 287", "approvalOrganization": "Акционерное общество \"Издательство \"Просвещение\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2027 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov.ru/document/0001202607230005", "checkedAt": "2026-10-21", "contentStoredLocally": false, "status": "BIBLIOGRAPHIC_ENTRY_EXTRACTED", "rightsStatus": "LINK_ONLY; bibliography does 
    ```
    ```json
    {"id": "fpu2026-0235", "listRow": 235, "sectionCode": "1.1.2.1.1.3", "listSection": "1.1", "schoolStage": "basic", "grade": 7, "title": "Русский язык: 7-й класс: учебник: в 2 частях; 5-е издание, переработанное", "authors": "Баранов М.Т., Ладыженская Т.А., Тростенцова Л.А. и другие", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 287", "approvalOrganization": "Акционерное общество \"Издательство \"Просвещение\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2027 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov.ru/document/0001202607230005", "checkedAt": "2026-10-21", "contentStoredLocally": false, "status": "BIBLIOGRAPHIC_ENTRY_EXTRACTED", "rightsStatus": "LINK_ONLY; bibliography does 
    ```
    ```json
    {"id": "fpu2026-0461", "listRow": 461, "sectionCode": "1.1.2.6.3.4", "listSection": "1.1", "schoolStage": "basic", "grade": 8, "title": "Французский язык: второй иностранный язык: 8-й класс: учебник; 6-е издание, переработанное", "authors": "Селиванова Н.А., Шашурина А.Ю.", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 287", "approvalOrganization": "Акционерное общество \"Издательство \"Просвещение\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2032 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov.ru/document/0001202607230005", "checkedAt": "2026-10-21", "contentStoredLocally": false, "status": "BIBLIOGRAPHIC_ENTRY_EXTRACTED", "rightsStatus": "LINK_ONLY; bibliography does not grant 
    ```
    ```json
    {"id": "fpu2026-0462", "listRow": 462, "sectionCode": "1.1.2.6.3.5", "listSection": "1.1", "schoolStage": "basic", "grade": 9, "title": "Французский язык: второй иностранный язык: 9-й класс: учебник; 10-е издание, переработанное", "authors": "Селиванова Н.А., Шашурина А.Ю.", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 287", "approvalOrganization": "Акционерное общество \"Издательство \"Просвещение\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2032 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov.ru/document/0001202607230005", "checkedAt": "2026-10-21", "contentStoredLocally": false, "status": "BIBLIOGRAPHIC_ENTRY_EXTRACTED", "rightsStatus": "LINK_ONLY; bibliography does not grant
    ```

## federal-textbooks-2026-primary-1-4.json (394751 bytes)
top-level: schemaVersion:int, title:str, source:str, officialSource:str, checkedAt:str, gradeBand:str, recordCount:int, notes:list[3], records:list[237]
- `records` record keys: id(237), listRow(237), sectionCode(237), listSection(237), schoolStage(237), grade(237), title(237), authors(237), publisher(237), relatedTeachingMaterials(237), approvalBasis(237), approvalOrganization(237), approvalOrder(237), allowedUseUntil(237), metadataSource(237), officialDocument(237), checkedAt(237), contentStoredLocally(237), status(237), rightsStatus(237)
  - status: BIBLIOGRAPHIC_ENTRY_EXTRACTED=237
  - rightsStatus: LINK_ONLY; bibliography does not grant permission to redistribute textbook files=237
  - records mentioning «до 31 августа 20XX»: 233
  - samples:
    ```json
    {"id": "fpu2026-0005", "listRow": 5, "sectionCode": "1.1.1.1.1.1", "listSection": "1.1", "schoolStage": "primary", "grade": 1, "title": "Русский язык. Азбука: 1-й класс: учебник: в 2 частях; 16-е издание, переработанное", "authors": "Горецкий В.Г., Кирюшкин В.А., Виноградская Л.А. и другие", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ Министерства просвещения Российской Федерации от 31 мая 2021 г. № 286 \"Об утверждении федерального государственного образовательного стандарта начального общего образования\" (зарегистрирован Министерством юстиции Российской Федерации 5 июля 2021 г., регистрационный № 64100) с изменениями, внесенными приказами Министерства просвещения Российской Федерации от 18 июля 2022 г. № 569 (зарегистрирован Министерством юстиции Российской Федерации 17 августа 2022 г., регистрационный 
    ```
    ```json
    {"id": "fpu2026-0006", "listRow": 6, "sectionCode": "1.1.1.1.1.2", "listSection": "1.1", "schoolStage": "primary", "grade": 1, "title": "Русский язык: 1-й класс: учебник; 15-е издание, переработанное", "authors": "Канакина В.П., Горецкий В.Г.", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 286", "approvalOrganization": "Акционерное общество \"Издательство \"Просвещение\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2032 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov.ru/document/0001202607230005", "checkedAt": "2026-10-21", "contentStoredLocally": false, "status": "BIBLIOGRAPHIC_ENTRY_EXTRACTED", "rightsStatus": "LINK_ONLY; bibliography does not grant permission to redistribute tex
    ```
    ```json
    {"id": "fpu2026-0007", "listRow": 7, "sectionCode": "1.1.1.1.1.3", "listSection": "1.1", "schoolStage": "primary", "grade": 2, "title": "Русский язык: 2-й класс: учебник: в 2 частях; 14-е издание, переработанное", "authors": "Канакина В.П., Горецкий В.Г.", "publisher": "Акционерное общество \"Издательство \"Просвещение\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 286", "approvalOrganization": "Акционерное общество \"Издательство \"Просвещение\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2032 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov.ru/document/0001202607230005", "checkedAt": "2026-10-21", "contentStoredLocally": false, "status": "BIBLIOGRAPHIC_ENTRY_EXTRACTED", "rightsStatus": "LINK_ONLY; bibliography does not grant permission to redi
    ```
    ```json
    {"id": "fpu2026-0163", "listRow": 163, "sectionCode": "1.1.1.4.12.3", "listSection": "1.1", "schoolStage": "primary", "grade": 4, "title": "Ирон литературон каесынад. 4-аем кьлас: ахуыргаенаен чиныг = Литературное чтение на родном (осетинском) языке: 4-й класс: учебник; 1-е издание; язык издания: осетинский", "authors": "Туаева Л. А., Дзтиева Э.З.", "publisher": "Общество с ограниченной ответственностью \"СЕМ\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 286; Приказ № 372", "approvalOrganization": "Общество с ограниченной ответственностью \"СЕМ\"", "approvalOrder": "От 26 июня 2025 г. № 495", "allowedUseUntil": "До 31 августа 2030 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov.ru/document/0001202607230005", "checkedAt": "2026-10-21", "contentStoredLocally": false, "status": "BIBLIOG
    ```
    ```json
    {"id": "fpu2026-0164", "listRow": 164, "sectionCode": "1.1.1.4.13.1", "listSection": "1.1", "schoolStage": "primary", "grade": 1, "title": "Литературное чтение на родном (татарском) языке: Эдэби уку. 1 класс: учебник для общеобразовательных организаций начального общего образования (для обучающихся, слабо владеющих родным (татарским) языком); 2-е издание, переработанное; язык издания: татарский", "authors": "Ханнанов Р.Г., Гареева Л.Р.", "publisher": "Общество с ограниченной ответственностью \"Издательство \"Магариф-Вакыт\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 286; Приказ № 372", "approvalOrganization": "Общество с ограниченной ответственностью \"Издательство \"Магариф-Вакыт\"", "approvalOrder": "От 26 июня 2025 г. № 495", "allowedUseUntil": "До 31 августа 2030 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument"
    ```

## federal-textbooks-2026-secondary-10-11.json (148946 bytes)
top-level: schemaVersion:int, title:str, source:str, officialSource:str, checkedAt:str, gradeBand:str, recordCount:int, notes:list[3], records:list[86]
- `records` record keys: id(86), listRow(86), sectionCode(86), listSection(86), schoolStage(86), grade(86), title(86), authors(86), publisher(86), relatedTeachingMaterials(86), approvalBasis(86), approvalOrganization(86), approvalOrder(86), allowedUseUntil(86), metadataSource(86), officialDocument(86), checkedAt(86), contentStoredLocally(86), status(86), rightsStatus(86)
  - status: BIBLIOGRAPHIC_ENTRY_EXTRACTED=86
  - rightsStatus: LINK_ONLY; bibliography does not grant permission to redistribute textbook files=86
  - records mentioning «до 31 августа 20XX»: 80
  - samples:
    ```json
    {"id": "fpu2026-0625", "listRow": 625, "sectionCode": "1.1.3.3.1.1", "listSection": "1.1", "schoolStage": "secondary", "grade": 10, "title": "Алтайский язык. 10 класс: учебник для общеобразовательных организаций (Алтай тил. 10 класс: текши уредулу тозомолдорго уреду бичик); язык издания: алтайский", "authors": "Тыбыкова А.Т., Сулукова Н.Г., Тыбыкова Л.Н. и другие", "publisher": "Общество с ограниченной ответственностью \"Горно-Алтайская типография\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 413", "approvalOrganization": "БУ ДПО Республики Алтай \"Институт повышения квалификации и профессиональной переподготовки работников образования Республики Алтай\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2027 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pra
    ```
    ```json
    {"id": "fpu2026-0626", "listRow": 626, "sectionCode": "1.1.3.3.1.2", "listSection": "1.1", "schoolStage": "secondary", "grade": 11, "title": "Алтайский язык. 11 класс: учебник для общеобразовательных организаций (Алтай тил. 11 класс: текши уредулу тозомолдорго уреду бичик); язык издания: алтайский", "authors": "Тыбыкова А.Т., Шокшиланова А.С., Сулукова Н.Г.", "publisher": "Общество с ограниченной ответственностью \"Горно-Алтайская типография\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 413", "approvalOrganization": "БУ ДПО Республики Алтай \"Институт повышения квалификации и профессиональной переподготовки работников образования Республики Алтай\"", "approvalOrder": "От 21 сентября 2022 г. № 858", "allowedUseUntil": "До 31 августа 2027 года", "metadataSource": "https://www.garant.ru/products/ipo/prime/doc/414535956/", "officialDocument": "https://publication.pravo.gov
    ```
    ```json
    {"id": "fpu2026-0627", "listRow": 627, "sectionCode": "1.1.3.3.2.1", "listSection": "1.1", "schoolStage": "secondary", "grade": 11, "title": "Балкарский язык: Учебник для 10-11 классов общеобразовательных учреждений; 1-е издание; язык издания: балкарский", "authors": "Аппоев А. К., Газаева А.С., Конакова Л.А.", "publisher": "Государственное казенное учреждение \"КБР-Медиа\". Издательство \"Эльбрус\"", "relatedTeachingMaterials": "Балкарский язык: рабочая тетрадь для 10-11 классов общеобразоват. учреждений: К учебнику Аппоева А.К., Газаевой А.С., Конаковой Л.А. \"Балкарский язык. 10-11 классы\"; Конакова Л.А. 1-е издание; Государственное казенное учреждение \"КБР-Медиа\". Издательство \"Эльбрус\"", "approvalBasis": "Приказ № 413", "approvalOrganization": "Государственное бюджетное учреждение дополнительного профессионального образования \"Центр непрерывного повышения профессионального мас
    ```
    ```json
    {"id": "fpu2026-1112", "listRow": 1112, "sectionCode": "2.1.3.2.1.1", "listSection": "2.1", "schoolStage": "secondary", "grade": 10, "title": "Пос (хакас) литературазы. 10 класс: тирен син: tикci угредiг организацияларына учебник = Родная (хакасская) литература. 10 класс: углублённый уровень: учебник для общеобразовательных организаций; 1-е издание; язык издания: хакасский", "authors": "Майнагашева Н.С., Челтыгмашева Л.В., Боргоякова М.П. и другие", "publisher": "Государственное бюджетное учреждение Республики Хакасия \"Хакасское книжное издательство имени В.М. Торосова\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 413; Приказ № 371", "approvalOrganization": "Государственное бюджетное учреждение Республики Хакасия \"Хакасское книжное издательство имени В.М. Торосова\"", "approvalOrder": "От 26 июня 2025 г. № 495", "allowedUseUntil": "До 31 августа 2030 года", "metadata
    ```
    ```json
    {"id": "fpu2026-1113", "listRow": 1113, "sectionCode": "2.1.3.2.1.2", "listSection": "2.1", "schoolStage": "secondary", "grade": 11, "title": "Пос (хакас) литературазы. 11 класс: тирен син: thкci угредiг организацияларына учебник = Родная (хакасская) литература. 11 класс: углублённый уровень: учебник для общеобразовательных организаций; 1-е издание; язык издания: хакасский", "authors": "Майнагашева Н.С., Челтыгмашева Л.В.. Боргоякова М.П. и другие", "publisher": "Государственное бюджетное учреждение Республики Хакасия \"Хакасское книжное издательство имени В.М. Торосова\"", "relatedTeachingMaterials": null, "approvalBasis": "Приказ № 413; Приказ № 371", "approvalOrganization": "Государственное бюджетное учреждение Республики Хакасия \"Хакасское книжное издательство имени В.М. Торосова\"", "approvalOrder": "От 26 июня 2025 г. № 495", "allowedUseUntil": "До 31 августа 2030 года", "metadata
    ```

## federal-working-programs.json (92374 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, officialCatalog:str, officialRegistry:str, totalRecords:int, directPdfLinks:int, note:str, programs:list[61], releaseSummary:dict[6]
- `programs` record keys: id(61), title(61), subject(61), gradeRange(61), level(61), year(61), documentType(61), sourceId(61), sourceLandingPage(61), url(61), fileFormat(61), pages(61), accessStatus(61), rightsStatus(61), contentStoredLocally(61), checkedAt(61), downloadAttemptAt(55), sourceAttributionUrl(55), fileSizeBytes(55), sha256(55), downloadStatus(55), provenance(55), releaseTag(55), releaseAsset(55), releaseUrl(55), storedInRelease(55), urlStatus(6)
  - rightsStatus: LINK_TO_OFFICIAL_SOURCE; keep active attribution link; do not assume this permits a mirror=61
  - provenance: corpus=55
  - downloadStatus: PDF_SIGNATURE_AND_HASH_VERIFIED=55
  - records mentioning «до 31 августа 20XX»: 0

## fipi-exam-materials-2026-2027.json (5770 bytes)
top-level: schemaVersion:int, title:str, checkedAt:str, status:str, note:str, materials:list[9], policy:dict[3]
- `materials` record keys: id(9), title(9), url(9), grades(9), kind(9), status(9), note(9)
  - status: VERIFIED=9
  - records mentioning «до 31 августа 20XX»: 0

## historical-school-textbooks-library.json (123760 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, source:str, sourceDescription:str, sourceReportedCounts:dict[3], recordsDiscoveredInThisPass:int, coverageNote:str, books:list[128], discoveryNote:str
- `books` record keys: id(128), sourceId(128), title(128), bibliographicDescription(128), url(128), subject(128), gradeRange(128), publicationYear(128), accessStatus(128), rightsStatus(128), contentStoredLocally(128), checkedAt(128), note(128)
  - rightsStatus: NOT_PROVEN_FOR_REPUBLICATION=128
  - records mentioning «до 31 августа 20XX»: 0

## official-extracurricular-programs.json (55595 bytes)
top-level: schemaVersion:int, title:str, source:str, checkedAt:str, count:int, records:list[53]
- `records` record keys: id(53), sourceId(53), title(53), gradeRange(53), subject(53), topic(53), kind(53), url(53), landingPage(53), checkedAt(53), accessStatus(53), rightsStatus(53), contentStoredLocally(53)
  - rightsStatus: LINK_ONLY; redistribution licence not independently confirmed=53
  - records mentioning «до 31 августа 20XX»: 0

## official-russian-school-material-items.json (2258876 bytes)
top-level: schemaVersion:int, catalogName:str, lastVerified:str, note:str, items:list[1738], coverageNote:str, extracurricularPdfCount:int, extracurricularPdfFailureCount:int
- `items` record keys: id(1738), sourceId(1738), title(1738), kind(1738), accessStatus(1738), rightsStatus(1738), contentStoredLocally(1738), checkedAt(1714), subject(1708), gradeRange(1636), url(1585), note(1206), authors(1078), publisher(1078), federalListNumber(1078), grades(1078), subjectLabel(1078), metadataStatus(1078), fullTextAvailable(1078), sectionCode(934), gradeRaw(934), topic(660), metadataCompleteness(584), level(205), license(183), contentRef(153), description(133), subtitleOrCitation(128), publicationYear(128), notes(128), gradeStatus(128), fileSizeBytes(109), sha256(109), releaseTag(109), releaseAsset(109), releaseUrl(109), storedInRelease(109), provenance(108), catalogueSnippet(61), year(61)
  - rightsStatus: NOT_PROVEN_FOR_REPUBLICATION=1206, ORIGINAL_CONTENT_CC_BY_4.0=153, LINK_ONLY_REUSE_TERMS_NOT_CONFIRMED=128, LINK_ONLY; individual textbook files are not contained in this section index=61, OFFICIAL_EDSOO_PDF_WITH_ACTIVE_SOURCE_LINK=55, OFFICIAL_SOURCE; redistribution terms not independently established=53, OPEN_LICENSE_WITH_ATTRIBUTION_SUBJECT_TO_PAGE_EXCLUSIONS=30, LINK_TO_SOURCE; do not mirror files without confirmed terms=15
  - provenance: corpus=108
  - downloadStatus: PDF_SIGNATURE_AND_HASH_VERIFIED=54
  - records mentioning «до 31 августа 20XX»: 0

## official-russian-school-materials.json (27768 bytes)
top-level: schemaVersion:int, catalogName:str, lastVerified:str, purpose:str, gradeRange:list[2], schoolStages:list[3], subjects:list[37], sources:list[26], integrationPolicy:dict[10], fullCoverageNote:str, collections:list[3], workingProgramCount:int, directWorkingProgramPdfCount:int, originalExerciseCount:int, currentCoverageNote:str, lastFederalProgramDownloadAttemptAt:str, verifiedLocalFederalWorkingProgramPdfCount:int, failedFederalWorkingProgramPdfCount:int, extracurricularProgramsSourceUrl:str, extracurricularProgramsLocalSyncStatus:str, federalWorkingProgramReleasePdfCount:int, federalTextbookListReleaseCopy:dict[11], sha:str, extracurricularSyncEvidence:dict[6]
- `schoolStages` record keys: id(3), name(3), grades(3)
  - records mentioning «до 31 августа 20XX»: 0
- `sources` record keys: id(26), name(26), url(26), kind(26), access(26), gradeRange(26), subjects(26), storesFullTextbooksLocally(22), rightsNote(9), storesFullTextLocally(4), license(3), licenseUrl(3), referenceUrl(2), verifiedExample(2), announcementUrl(1), officialPdfLandingPage(1), alternateUrl(1), catalogReportedCounts(1), catalogReportedUpdated(1), indexedPageCount(1), indexCoverageStatus(1), registryUrl(1), recordFiles(1), recordCount(1), notes(1)
  - records mentioning «до 31 августа 20XX»: 0
- `collections` record keys: id(3), file(3), description(3)
  - records mentioning «до 31 августа 20XX»: 0

## original-school-practice-bank.json (78624 bytes)
top-level: schemaVersion:int, title:str, language:str, grades:list[11], license:str, licenseUrl:str, attribution:str, curriculumStatus:str, instructions:str, exercises:list[153], lastExpandedAt:str, exerciseCount:int, coverageNote:str
- `exercises` record keys: grade(153), subject(153), topic(153), prompt(153), answer(153), explanation(153), difficulty(153), id(153), authorship(54), license(54)
  - records mentioning «до 31 августа 20XX»: 0

## regulatory-delta-2026-10-28.json (7199 bytes)
top-level: schemaVersion:int, reviewedAt:str, status:str, purpose:str, act:dict[10], verifiedScopeFromPublishedSummaries:list[4], repositoryReviewTargets:list[6], policy:list[5], metrics:dict[4]
- `verifiedScopeFromPublishedSummaries` record keys: id(4), subjects(4), levels(4), summary(4), reviewStatus(4), evidenceUrls(4), grades(2), doNotAssume(1), effectiveFrom(1)
  - records mentioning «до 31 августа 20XX»: 0
- `repositoryReviewTargets` record keys: path(6), reason(6)
  - records mentioning «до 31 августа 20XX»: 0

## school-curriculum-coverage.json (666871 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, grades:list[11], subjects:list[37], coveragePolicy:str, statusDefinitions:dict[6], rowScopeNote:str, rows:list[407], summary:dict[30]
- `rows` record keys: grade(407), subject(407), subjectLabel(407), indexedResourceCount(407), status(407), completeCoverage(407), curriculumApplicability(407), federalBibliographyRecordCount(407), verifiedOfficialLessonIndexCount(407), officialWorkingProgramCount(407), releaseAvailableWorkingProgramCount(407), officialProgramRelationship(407), officialProgramComponentMappingIds(407), officialExtracurricularProgramCount(407), locallyStoredOriginalTaskCount(407), federalBibliographyFullTextCount(407), openReferenceResourceCount(407), officialExamResourceCount(407), publicLessonPlatformResourceCount(407), additionalOfficialSubjectResourceCount(407), officialPlatformEntryPointCount(407), additionalCatalogResourceCount(407), notes(407)
  - status: LINKS_AVAILABLE=252, NO_EXACT_GRADE_SUBJECT_RECORD=155
  - records mentioning «до 31 августа 20XX»: 0

## subject-component-crosswalk.json (6735 bytes)
top-level: schemaVersion:int, name:str, checkedAt:str, purpose:str, policy:list[5], sources:list[5], mappings:list[3], evidence:dict[4]
- `sources` record keys: id(5), title(5), url(5), gradeRange(5), sourceType(5), checkedAt(5)
  - records mentioning «до 31 августа 20XX»: 0
- `mappings` record keys: id(3), targetSubject(3), sourceProgramSubject(3), gradeRange(3), gradeRelationships(3), sourceIds(3)
  - records mentioning «до 31 августа 20XX»: 0

## Manifests
- federal-extracurricular-programs.json: sourcePage=https://edsoo.ru/rabochie-programmy-vd/, checkedAt=2026-10-28, provenance=corpus, linksFound=53, verified=53, failed=0, duplicatesBySha256=0, staleItemsRemoved=0
- federal-textbook-list-2026.json: registration=Зарегистрирован Минюстом России 22.07.2026 № 87563, officialLandingPage=https://minjust.consultant.ru/documents/60664, officialAnnouncement=https://edu.gov.ru/press/11911/minprosveshcheniya-rossii-obnovilo-federalnyy-perechen-uchebnikov-dlya-vseh-urovney-shkolnogo-obrazovaniya, resolvedPdfUrl=https://minjust.consultant.ru/files/60664, checkedAt=2026-10-28, pages=312
- federal-working-programs.json: generatedAt=2026-10-28T18:09:40.571852+00:00, officialCatalogue=https://edsoo.ru/rabochie-programmy/, provenance=corpus, attempted=55, verified=55, failed=0

## Legacy extracurricular (backup branch)
- PDFs in git: 53; manifest entries: 53
- localPath collisions (several URLs -> one file): 0
- garbled-looking names: 14

## Cross-check with fpu_status.json (pair: number + position code)
| key | code | use_until | source | allowedUseUntil | title |
|---|---|---|---|---|---|
| 18|Литературное чтение | 1.1.1.2.1.1 | 2026-08-31 | — | — | NOT IN EXTRACT |
| 110|Информатика | 1.1.1.7.1.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 111|Информатика | 1.1.1.7.1.2 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 126|Изобразительное искусство | 1.1.1.9.1.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 127|Изобразительное искусство | 1.1.1.9.1.2 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 130|Изобразительное искусство | 1.1.1.9.3.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 131|Изобразительное искусство | 1.1.1.9.3.2 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 204|ОРКСЭ | 1.1.1.8.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Основы религиозных культур и светской этики. Основы православной культ |
| 204|ОРКСЭ | 1.1.1.8.1.1 | 2032-08-31 | ocr | — | Основы религиозных культур и светской стики. Основы православной культ |
| 205|ОРКСЭ | 1.1.1.8.2.1 | 2032-08-31 | garant | До 31 августа 2032 года | Основы религиозных культур и светской этики. Основы исламской культуры |
| 205|ОРКСЭ | 1.1.1.8.2.1 | 2032-08-31 | ocr | — | Основы религиозных культур и светской стики. Основы иламской культуры: |
| 206|ОРКСЭ | 1.1.1.8.3.1 | 2032-08-31 | garant | До 31 августа 2032 года | Основы религиозных культур и светской этики. Основы буддийской культур |
| 206|ОРКСЭ | 1.1.1.8.3.1 | 2032-08-31 | ocr | — | Основы религиозных культур и светской стики. Основы будийской культуры |
| 207|ОРКСЭ | 1.1.1.8.4.1 | 2032-08-31 | garant | До 31 августа 2032 года | Основы религиозных культур и светской этики. Основы иудейской культуры |
| 207|ОРКСЭ | 1.1.1.8.4.1 | 2032-08-31 | ocr | — | Основы религиозных культур и светской стики. Основы иудейской культуры |
| 208|ОРКСЭ | 1.1.1.8.5.1 | 2032-08-31 | garant | До 31 августа 2032 года | Основы религиозных культур и светской этики. Основы религиозных культу |
| 208|ОРКСЭ | 1.1.1.8.5.1 | 2032-08-31 | ocr | — | Основы религиозных культур и светской стики. Основы религиозных культу |
| 209|ОРКСЭ | 1.1.1.8.6.1 | 2032-08-31 | garant | До 31 августа 2032 года | Основы религиозных культур и светской этики. Основы светской этики: 4- |
| 209|ОРКСЭ | 1.1.1.8.6.1 | 2032-08-31 | ocr | — | Основы религиозных культур и светской стики. Основы светской стики; 4- |
| 205|Литература | 1.1.2.2.2.1 | 2026-08-31 | — | — | NOT IN EXTRACT |
| 206|Литература | 1.1.2.2.2.2 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 331|Математика (алгебра и геометрия) | 1.1.2.7.1.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 334|Алгебра | 1.1.2.7.2.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 335|Алгебра | 1.1.2.7.3.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 347|Геометрия | 1.1.2.7.15.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 364|История | 1.1.2.9.1.1 | 2026-08-31 | — | — | NOT IN EXTRACT |
| 374|История | 1.1.2.9.6.1 | 2026-08-31 | — | — | NOT IN EXTRACT |
| 375|История | 1.1.2.9.6.2 | 2026-08-31 | — | — | NOT IN EXTRACT |
| 384|История | 1.1.2.9.11.1 | 2026-08-31 | garant | До 31 августа 2026 года | История. Всеобщая история. История Древнего мира: 5-й класс: учебник;  |
| 389|История | 1.1.2.9.12.1 | 2027-08-31 | garant | До 31 августа 2027 года | История. История России: 6-й класс: учебник: в 2 частях; 3-е издание,  |
| 390|История | 1.1.2.9.12.2 | 2028-08-31 | garant | До 31 августа 2028 года | История. История России: 7-й класс: учебник: в 2 частях; 3-е издание,  |
| 391|История | 1.1.2.9.12.3 | 2029-08-31 | garant | До 31 августа 2029 года | История. История России: 8-й класс: учебник: в 2 частях; 3-е издание,  |
| 392|История | 1.1.2.9.12.4 | 2030-08-31 | garant | До 31 августа 2030 года | История. История России: 9-й класс: учебник: в 2 частях; 3-е издание,  |
| 402|История | 1.1.2.9.15.1 | 2026-08-31 | garant | До 31 августа 2026 года | История. Всеобщая история. История Древнего мира: 5-й класс: учебник;  |
| 403|История | 1.1.2.9.15.2 | 2027-08-31 | garant | До 31 августа 2027 года | История. Всеобщая история. История Средних веков: 6-й класс: учебник;  |
| 404|История | 1.1.2.9.15.3 | 2028-08-31 | garant | До 31 августа 2028 года | История. Всеобщая история. История Нового времени. Конец XV - XVII век |
| 440|Физика | 1.1.2.12.1.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 485|Химия | 1.1.2.14.1.1 | 2027-08-31 | — | — | NOT IN EXTRACT |
| 620|Литература | 1.1.3.2.1.1 | 2030-08-31 | ocr | — | Литература (в 2 часть) |
| 621|Литература | 1.1.3.2.1.2 | 2030-08-31 | ocr | — | Литература (в 2 часть) |
| 695|Математика (алгебра и начала математического анализа) | 1.1.3.7.1.1 | 2030-08-31 | ocr | — | Математика: алгебра и начала математического анализа, геометрия. Алгеб |
| 696|Геометрия | 1.1.3.7.2.1 | 2030-08-31 | ocr | — | Математика: алгебра и начала математического анализа, геометрия. Гсоме |
| 708|Химия | 1.1.3.10.1.1 | 2030-08-31 | ocr | — | Химия |
| 709|Химия | 1.1.3.10.1.2 | 2030-08-31 | ocr | — | Химия |
| 726|География | 1.1.3.14.1.1 | 2030-08-31 | ocr | — | География: базовое и улуубленное обучение |
| 727|География | 1.1.3.14.1.2 | 2030-08-31 | ocr | — | География: базовое и улуубленное обучение |
| 233|Русский язык | 1.1.2.1.1.1 | 2027-08-31 | garant | До 31 августа 2027 года | Русский язык: 5-й класс: учебник: в 2 частях; 5-е издание, переработан |
| 233|Русский язык | 1.1.2.1.1.1 | 2027-08-31 | ocr | — | Русский язык: 5-й класс: учебник; в 2 частях; 5-е издание, переработан |
| 234|Русский язык | 1.1.2.1.1.2 | 2027-08-31 | garant | До 31 августа 2027 года | Русский язык: 6-й класс: учебник: в 2 частях; 5-е издание, переработан |
| 234|Русский язык | 1.1.2.1.1.2 | 2027-08-31 | ocr | — | Русский язык: 6-й класс: учебник; в 2 частах; 5-е издание, переработян |
| 235|Русский язык | 1.1.2.1.1.3 | 2027-08-31 | garant | До 31 августа 2027 года | Русский язык: 7-й класс: учебник: в 2 частях; 5-е издание, переработан |
| 235|Русский язык | 1.1.2.1.1.3 | 2027-08-31 | ocr | — | Русский язык: 7-й класс: учебник; в 2 частах; 5-е издание, переработян |
| 236|Русский язык | 1.1.2.1.1.4 | 2027-08-31 | garant | До 31 августа 2027 года | Русский язык: 8-й класс: учебник; 5-е издание, переработанное |
| 236|Русский язык | 1.1.2.1.1.4 | 2027-08-31 | ocr | — | Русский язык: 8-й класс: учебник; 5-е издание, переработяное |
| 237|Русский язык | 1.1.2.1.1.5 | 2027-08-31 | garant | До 31 августа 2027 года | Русский язык: 9-й класс: учебник; 5-е издание, переработанное |
| 237|Русский язык | 1.1.2.1.1.5 | 2027-08-31 | ocr | — | Русский язык: 9-й класс: учебник; 5-е издание, переработяное |
| 199|Окружающий мир | 1.1.1.7.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Окружающий мир: 1-й класс: учебник: в 2 частях; 16-е издание, перерабо |
| 199|Окружающий мир | 1.1.1.7.1.1 | 2032-08-31 | ocr | — | Окружающий мир: 1-й класс: учебник: в 2 частях; 16-е издание, перерабо |
| 200|Окружающий мир | 1.1.1.7.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Окружающий мир: 2-й класс: учебник: в 2 частях; 15-е издание, перерабо |
| 200|Окружающий мир | 1.1.1.7.1.2 | 2032-08-31 | ocr | — | Окружающий мир: 2-й класс: учебник: в 2 частях; 15-е издание, перерабо |
| 201|Окружающий мир | 1.1.1.7.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | Окружающий мир: 3-й класс: учебник: в 2 частях; 14-е издание, перерабо |
| 201|Окружающий мир | 1.1.1.7.1.3 | 2032-08-31 | ocr | — | Окружающий мир; 3-й класс; учебник: в 2 частях; 14-е издание, перерабо |
| 202|Окружающий мир | 1.1.1.7.1.4 | 2032-08-31 | garant | До 31 августа 2032 года | Окружающий мир: 4-й класс: учебник: в 2 частях; 14-е издание, перерабо |
| 202|Окружающий мир | 1.1.1.7.1.4 | 2032-08-31 | ocr | — | Окружающий мир; 4-й класс; учебник: в 2 частях; 14-е издание, перерабо |
| 594|Музыка | 1.1.2.16.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 5-й класс: учебник; 14-е издание, переработанное |
| 594|Музыка | 1.1.2.16.1.1 | 2032-08-31 | ocr | — | Музыка: 5-й класс: учебник; 14-е издание, переработанное |
| 595|Музыка | 1.1.2.16.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 6-й класс: учебник; 13-е издание, переработанное |
| 595|Музыка | 1.1.2.16.1.2 | 2032-08-31 | ocr | — | Музыка: 6-й класс: учебник; 13-е издание, переработанное |
| 596|Музыка | 1.1.2.16.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 7-й класс: учебник; 13-е издание, переработанное |
| 596|Музыка | 1.1.2.16.1.3 | 2032-08-31 | ocr | — | Музыка: 7-й класс: учебник; 13-е издание, переработанное |
| 597|Музыка | 1.1.2.16.1.4 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 8-й класс: учебник; 5-е издание, переработанное |
| 597|Музыка | 1.1.2.16.1.4 | 2032-08-31 | ocr | — | Музыка: 8-й класс: учебник; 5-е издание, переработанное |
| 583|Биология | 1.1.2.14.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Биология: 5-й класс: базовый уровень: учебник; 1-е издание |
| 583|Биология | 1.1.2.14.1.1 | 2032-08-31 | ocr | — | Биология: 5-й класс: базовый уровень: учебник, 1-е издание |
| 584|Биология | 1.1.2.14.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Биология: 6-й класс: базовый уровень: учебник; 1-е издание |
| 584|Биология | 1.1.2.14.1.2 | 2032-08-31 | ocr | — | Биология: 6-й класс: базовый уровень: учебник; 1-е издание |
| 585|Биология | 1.1.2.14.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | Биология: 7-й класс: базовый уровень: учебник; 1-е издание |
| 585|Биология | 1.1.2.14.1.3 | 2032-08-31 | ocr | — | Биология: 7-й класс: базовый уровень: учебник; 1-е издание |
| 586|Биология | 1.1.2.14.1.4 | 2032-08-31 | garant | До 31 августа 2032 года | Биология: 8-й класс: базовый уровень: учебник; 1-е издание |
| 586|Биология | 1.1.2.14.1.4 | 2032-08-31 | ocr | — | Биология: 8-й класс: базовый уровень: учебник; 1-е издание |
| 587|Биология | 1.1.2.14.1.5 | 2032-08-31 | garant | До 31 августа 2032 года | Биология: 9-й класс: базовый уровень: учебник; 1-е издание |
| 587|Биология | 1.1.2.14.1.5 | 2032-08-31 | ocr | — | Биология: 9-й класс: базовый уровень: учебник; 1-е издание |
| 713|Биология | 1.1.3.11.1.1 | 2030-08-31 | ocr | — | Биология |
| 714|Биология | 1.1.3.11.1.2 | 2030-08-31 | ocr | — | Биология |
| 715|Биология | 1.1.3.11.2.1 | 2030-08-31 | ocr | — | Биология. Биологияческне системы и процессы, улубленное обучение |
| 716|Биология | 1.1.3.11.2.2 | 2030-08-31 | ocr | — | Биология. Биологияческне системы и процессы, улубленное обучение |
| 571|География | 1.1.2.11.1.1 | 2032-08-31 | ocr | — | География: 5-6-е классы: учебник; 12-е издание, переработанное |
| 572|География | 1.1.2.11.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | География: 7-й класс: учебник; 11-е издание, переработанное |
| 572|География | 1.1.2.11.1.2 | 2032-08-31 | ocr | — | География: 7-8 класс: учебник; 11-е издание, переработанное |
| 573|География | 1.1.2.11.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | География: 8-й класс: учебник; 12-е издание, переработанное |
| 573|География | 1.1.2.11.1.3 | 2032-08-31 | ocr | — | География: 8-9 класс: учебник; 12-е издание, переработанное |
| 574|География | 1.1.2.11.1.4 | 2032-08-31 | garant | До 31 августа 2032 года | География: 9-й класс: учебник; 11-е издание, переработанное |
| 574|География | 1.1.2.11.1.4 | 2032-08-31 | ocr | — | География: 9-8 класс: учебник; 11-е издание, переработанное |
| 604|Физическая культура | 1.1.2.18.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Физическая культура: 5-й класс: учебник; 13-е издание, переработанное |
| 604|Физическая культура | 1.1.2.18.1.1 | 2032-08-31 | ocr | — | Физическая культура: 5-й класс: учебник; 13-е издание, переработяное |
| 605|Физическая культура | 1.1.2.18.1.2 | 2032-08-31 | ocr | — | Физическая культура: 6-7-е классы: учебник; 13-е издание, переработяно |
| 606|Физическая культура | 1.1.2.18.1.3 | 2032-08-31 | ocr | — | Физическая культура: 8-9-е классы: учебник; 12-е издание, переработяно |
| 731|Физическая культура | 1.1.3.15.1.1 | 2030-08-31 | ocr | — | Физическая культура; базовый уровень |
| 226|Физическая культура | 1.1.1.12.1.1 | 2032-08-31 | ocr | — | Физическая культура: 1 - 4-е классы: учебник; в 2 частях |
| 227|Физическая культура | 1.1.1.12.2.1 | 2032-08-31 | garant | До 31 августа 2032 года | Физическая культура: 1-й класс: учебник; 14-е издание, переработанное |
| 227|Физическая культура | 1.1.1.12.2.1 | 2032-08-31 | ocr | — | Физическая культура: 1-8 класс: учебник; 14-е издание, переработанное |
| 228|Физическая культура | 1.1.1.12.2.2 | 2032-08-31 | garant | До 31 августа 2032 года | Физическая культура: 2-й класс: учебник; 13-е издание, переработанное |
| 228|Физическая культура | 1.1.1.12.2.2 | 2032-08-31 | ocr | — | Физическая культура: 2-8 класс: учебник; 13-е издание, переработанное |
| 229|Физическая культура | 1.1.1.12.2.3 | 2032-08-31 | garant | До 31 августа 2032 года | Физическая культура: 3-й класс: учебник; 5-е издание, переработанное |
| 229|Физическая культура | 1.1.1.12.2.3 | 2032-08-31 | ocr | — | Физическая культура: 3-8 класс: учебник; 5-е издание, переработанное |
| 230|Физическая культура | 1.1.1.12.2.4 | 2032-08-31 | garant | До 31 августа 2032 года | Физическая культура: 4-й класс: учебник; 5-е издание, переработанное |
| 230|Физическая культура | 1.1.1.12.2.4 | 2032-08-31 | ocr | — | Физическая культура: 4-8 класс: учебник; 5-е издание, переработанное |
| 216|Музыка | 1.1.1.10.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 1-й класс: учебник; 15-е издание, переработанное |
| 216|Музыка | 1.1.1.10.1.1 | 2032-08-31 | ocr | — | Музыка: 1-й класс; учебник; 15-е издание, переработячное |
| 217|Музыка | 1.1.1.10.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 2-й класс: учебник; 15-е издание, переработанное |
| 217|Музыка | 1.1.1.10.1.2 | 2032-08-31 | ocr | — | Музыка: 2-й класс; учебник; 15-е издание, переработячное |
| 218|Музыка | 1.1.1.10.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 3-й класс: учебник; 15-е издание, переработанное |
| 218|Музыка | 1.1.1.10.1.3 | 2032-08-31 | ocr | — | Музыка: 3-8 класс; учебник; 15-е издание, переработячное |
| 219|Музыка | 1.1.1.10.1.4 | 2032-08-31 | garant | До 31 августа 2032 года | Музыка: 4-й класс: учебник; 14-е издание, переработанное |
| 219|Музыка | 1.1.1.10.1.4 | 2032-08-31 | ocr | — | Музыка: 4-й класс; учебник; 14-е издание, переработячное |
| 576|Физика | 1.1.2.12.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Физика: 7-й класс: базовый уровень: учебник; 3-е издание, переработанн |
| 576|Физика | 1.1.2.12.1.1 | 2032-08-31 | ocr | — | Физика: 7-8 класс: базовый уровень, учебник; 3-е издание, переработанн |
| 577|Физика | 1.1.2.12.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Физика: 8-й класс: базовый уровень: учебник; 3-е издание, переработанн |
| 577|Физика | 1.1.2.12.1.2 | 2032-08-31 | ocr | — | Физика: 8-9 класс: базовый уровень, учебник; 3-е издание, переработанн |
| 578|Физика | 1.1.2.12.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | Физика: 9-й класс: базовый уровень: учебник; 3-е издание, переработанн |
| 578|Физика | 1.1.2.12.1.3 | 2032-08-31 | ocr | — | Физика: 9-8 класс: базовый уровень, учебник; 3-е издание, переработанн |
| 580|Химия | 1.1.2.13.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Химия: 8-й класс: базовый уровень: учебник; 5-е издание, переработанно |
| 580|Химия | 1.1.2.13.1.1 | 2032-08-31 | ocr | — | Химия: 8-8 класс: базовый уровень, учебник; 5-е издание, переработанно |
| 581|Химия | 1.1.2.13.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Химия: 9-й класс: базовый уровень: учебник; 5-е издание, переработанно |
| 581|Химия | 1.1.2.13.1.2 | 2032-08-31 | ocr | — | Химия: 9-8 класс: базовый уровень, учебник; |
| 474|Математика | 1.1.2.7.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Математика: 5-й класс: базовый уровень: учебник: в 2 частях; 3-е издан |
| 474|Математика | 1.1.2.7.1.1 | 2032-08-31 | ocr | — | Математика: 5-й класс; базовый уровень: учебник; в 2 частях; 3-е издан |
| 475|Математика | 1.1.2.7.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Математика: 6-й класс: базовый уровень: учебник: в 2 частях; 3-е издан |
| 475|Математика | 1.1.2.7.1.2 | 2032-08-31 | ocr | — | Математика: 6-й класс; базовый уровень: учебник; в 2 частях; 3-е издан |
| 476|Алгебра | 1.1.2.7.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | Математика. Алгебра: 7-й класс: базовый уровень: учебник; 15-е издание |
| 476|Алгебра | 1.1.2.7.1.3 | 2032-08-31 | ocr | — | Математика: Алтебра; 7-й класс; базовый уровень: учебник; 15-е издание |
| 477|Алгебра | 1.1.2.7.1.4 | 2032-08-31 | garant | До 31 августа 2032 года | Математика. Алгебра: 8-й класс: базовый уровень: учебник; 16-е издание |
| 477|Алгебра | 1.1.2.7.1.4 | 2032-08-31 | ocr | — | Математика: Алтебра; 8-й класс; базовый уровень: учебник; 16-е издание |
| 478|Алгебра | 1.1.2.7.1.5 | 2032-08-31 | garant | До 31 августа 2032 года | Математика. Алгебра: 9-й класс: базовый уровень: учебник; 15-е издание |
| 478|Алгебра | 1.1.2.7.1.5 | 2032-08-31 | ocr | — | Математика: Алтебра; 9-й класс; базовый уровень: учебник; 15-е издание |
| 479|Геометрия | 1.1.2.7.2.1 | 2032-08-31 | ocr | — | Математика: 7-9-е классы; Геометрия: 7-9-е классы; базовый уровень: уч |
| 480|Вероятность и статистика | 1.1.2.7.3.1 | 2032-08-31 | ocr | — | Математика: Вероятность и стаститика: 7-9-е классы; базовый уровень: у |
| 482|Информатика | 1.1.2.8.1.1 | 2032-08-31 | garant | До 31 августа 2032 года | Информатика: 7-й класс: базовый уровень: учебник; 5-е издание, перераб |
| 482|Информатика | 1.1.2.8.1.1 | 2032-08-31 | ocr | — | Информатика: 7-9-е классы; базовый уровень: учебник; 5-е издание, пере |
| 483|Информатика | 1.1.2.8.1.2 | 2032-08-31 | garant | До 31 августа 2032 года | Информатика: 8-й класс: базовый уровень: учебник; 5-е издание, перераб |
| 483|Информатика | 1.1.2.8.1.2 | 2032-08-31 | ocr | — | Информатика: 8-9-е классы; базовый уровень: учебник; |
| 484|Информатика | 1.1.2.8.1.3 | 2032-08-31 | garant | До 31 августа 2032 года | Информатика: 9-й класс: базовый уровень: учебник; 5-е издание, перераб |
| 239|Литература | 1.1.2.2.1.1 | 2027-08-31 | garant | До 31 августа 2027 года | Литература: 5-й класс: учебник: в 2 частях; 14-е издание, переработанн |
| 239|Литература | 1.1.2.2.1.1 | 2027-08-31 | ocr | — | Литература: 5-й класс: учебник: в 2 частях; 14-е издание, переработяно |
| 240|Литература | 1.1.2.2.1.2 | 2027-08-31 | garant | До 31 августа 2027 года | Литература: 6-й класс: учебник: в 2 частях; 14-е издание, переработанн |
| 240|Литература | 1.1.2.2.1.2 | 2027-08-31 | ocr | — | Литература: 6-й класс: учебник: в 2 частях; 14-е издание, переработяно |
| 241|Литература | 1.1.2.2.1.3 | 2027-08-31 | garant | До 31 августа 2027 года | Литература: 7-й класс: учебник: в 2 частях; 13-е издание, переработанн |
| 241|Литература | 1.1.2.2.1.3 | 2027-08-31 | ocr | — | Литература: 7-й класс: учебник: в 2 частях; 13-е издание, переработяно |
| 242|Литература | 1.1.2.2.1.4 | 2027-08-31 | garant | До 31 августа 2027 года | Литература: 8-й класс: учебник: в 2 частях; 12-е издание, переработанн |
| 242|Литература | 1.1.2.2.1.4 | 2027-08-31 | ocr | — | Литература: 8-й класс: учебник: в 2 частях; 12-е издание, переработяно |
| 243|Литература | 1.1.2.2.1.5 | 2027-08-31 | garant | До 31 августа 2027 года | Литература: 9-й класс: учебник: в 2 частях; 11-е издание, переработанн |
| 243|Литература | 1.1.2.2.1.5 | 2027-08-31 | ocr | — | Литература: 9-й класс: учебник: в 2 частях; 11-е издание, переработяно |
| 569|Обществознание | 1.1.2.10.1.1 | Бессрочно | garant | Бессрочно | Обществознание: 9-й класс: учебник; 1-е издание |
| 569|Обществознание | 1.1.2.10.1.1 | Бессрочно | ocr | — | Обществознание: 9-8 класс: учебник; 1-е издание |
| 616|Русский язык | 1.1.3.1.1.1 | 2030-08-31 | ocr | — | Русский язык |
| 617|Русский язык | 1.1.3.1.2.1 | 2030-08-31 | ocr | — | Русский язык; утлубленное обучение |
| 618|Русский язык | 1.1.3.1.2.2 | 2030-08-31 | ocr | — | Русский язык; утлубленное обучение |
| 668|Английский язык | 1.1.3.5.1.1 | 2030-08-31 | ocr | — | Английский язык |
| 669|Английский язык | 1.1.3.5.1.2 | 2030-08-31 | ocr | — | Английский язык |
| 670|Английский язык | 1.1.3.5.2.1 | 2030-08-31 | ocr | — | Английский язык; угубленное обучение |
| 671|Английский язык | 1.1.3.5.2.2 | 2030-08-31 | ocr | — | Английский язык; угубленное обучение |
| 718|История | 1.1.3.12.1.1 | Бессрочно | garant | Бессрочно | История. История России. 1914 - 1945 годы: 10 класс: базовый уровень:  |
| 718|История | 1.1.3.12.1.1 | Бессрочно | ocr | — | История, История Россия, 1914 - 1945 годы: 10 класс; базовий уровень:  |
| 719|История | 1.1.3.12.1.2 | Бессрочно | garant | Бессрочно | История. История России. 1945 год - начало XXI века: 11 класс: базовый |
| 719|История | 1.1.3.12.1.2 | Бессрочно | ocr | — | История, История Россия, 1945 год - начало XXI века: 11 класс; базовий |
| 720|История | 1.1.3.12.2.1 | Бессрочно | garant | Бессрочно | История. Всеобщая история. 1914 - 1945 годы: 10 класс: базовый уровень |
| 720|История | 1.1.3.12.2.1 | Бессрочно | ocr | — | История, Весобіцяв история, 1914 - 1945 годы: 10 класс; базовий уровен |
| 721|История | 1.1.3.12.2.2 | Бессрочно | garant | Бессрочно | История. Всеобщая история. 1945 год - начало XXI века: 11 класс: базов |
| 721|История | 1.1.3.12.2.2 | Бессрочно | ocr | — | История, Весобіцяв история, |
| 723|Обществознание | 1.1.3.13.1.1 | Бессрочно | garant | Бессрочно | Обществознание: 10-й класс: базовый уровень: учебник; 1-е издание |
| 723|Обществознание | 1.1.3.13.1.1 | Бессрочно | ocr | — | Обществознаание: 10-й класс: базовый уровень: учебник; 1-е издание |
| 724|Обществознание | 1.1.3.13.1.2 | Бессрочно | ocr | — | Обществознаание: 11-й класс: базовый уровень: 1-е издание |
- agree=68 disagree=0 not_in_garant_extract=45
- position codes used by more than one row in the garant extract: 32
- allowedUseUntil by stage/year: basic-5-9:2026=6, basic-5-9:2027=75, basic-5-9:2028=55, basic-5-9:2029=61, basic-5-9:2030=53, basic-5-9:2032=88, basic-5-9:none=85, primary-1-4:2020=1, primary-1-4:2026=7, primary-1-4:2027=35, primary-1-4:2028=22, primary-1-4:2029=56, primary-1-4:2030=44, primary-1-4:2031=9, primary-1-4:2032=63, secondary-10-11:2027=7, secondary-10-11:2028=21, secondary-10-11:2029=8, secondary-10-11:2030=45, secondary-10-11:none=5
