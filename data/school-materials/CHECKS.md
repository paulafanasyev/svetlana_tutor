# School materials: checks

- allowedUseUntil values outside the expected forms: «До 26 октября 2029 года»=4, «До 28 апреля 2027 года»=4, «До 28 ноября 2030 года»=1
- official-russian-school-material-items.json: localPath occurrences = 0
- federal-working-programs.json: localPath occurrences = 0

## node --test exit=1
```
  ...
# Subtest: сроки в выгрузке ФПУ: «До 31 августа ГГГГ» или «Бессрочно»
not ok 7 - сроки в выгрузке ФПУ: «До 31 августа ГГГГ» или «Бессрочно»
  ---
  duration_ms: 2.17269
  type: 'test'
  location: '/home/runner/work/svetlana_tutor/svetlana_tutor/apps/web/src/data/schoolMaterials.test.js:78:1'
  failureType: 'testCodeFailure'
  error: 'fpu2026-1024'
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected:
  actual: 'До 26 октября 2029 года'
  operator: 'match'
  stack: |-
    TestContext.<anonymous> (file:///home/runner/work/svetlana_tutor/svetlana_tutor/apps/web/src/data/schoolMaterials.test.js:81:12)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.processPendingSubtests (node:internal/test_runner/test:744:18)
    Test.postRun (node:internal/test_runner/test:1173:19)
    Test.run (node:internal/test_runner/test:1101:12)
    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  ...
# Subtest: выгрузка ФПУ не противоречит сверенным вручную срокам (fpu_status.json)
ok 8 - выгрузка ФПУ не противоречит сверенным вручную срокам (fpu_status.json)
  ---
  duration_ms: 7.031388
  type: 'test'
  ...
# Subtest: банк заданий покрывает 1–11 классы, у каждого есть ответ и объяснение
ok 9 - банк заданий покрывает 1–11 классы, у каждого есть ответ и объяснение
  ---
  duration_ms: 3.207804
  type: 'test'
  ...
# Subtest: все JSON читаются, id в общем каталоге уникальны
# Subtest: в индексах нет локальных путей к PDF (localPath)
# Subtest: каждый файл из релиза описан в манифесте: sha256, размер, уникальное имя
# Subtest: имена PDF внеурочки строятся из id, без битой кириллицы
# Subtest: ФРП с ЕДСОО помечены как корпус, не как сверенные с ФОП
# Subtest: OCR-выгрузка ФПУ честно помечена черновиком
# Subtest: сроки в выгрузке ФПУ: «До 31 августа ГГГГ» или «Бессрочно»
# Subtest: выгрузка ФПУ не противоречит сверенным вручную срокам (fpu_status.json)
# Subtest: банк заданий покрывает 1–11 классы, у каждого есть ответ и объяснение
# Subtest: матрица покрытия не заявляет полноту без доказательства
# tests 10
# suites 0
# pass 9
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 214.434938
```
