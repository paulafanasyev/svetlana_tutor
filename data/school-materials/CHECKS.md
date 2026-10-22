# School materials: checks

- allowedUseUntil values outside the expected forms: none
- official-russian-school-material-items.json: localPath occurrences = 0
- federal-working-programs.json: localPath occurrences = 0

## node --test exit=0
```
# Subtest: все JSON читаются, id в общем каталоге уникальны
# Subtest: в индексах нет локальных путей к PDF (localPath)
# Subtest: каждый файл из релиза описан в манифесте: sha256, размер, уникальное имя
# Subtest: имена PDF внеурочки строятся из id, без битой кириллицы
# Subtest: ФРП с ЕДСОО помечены как корпус, не как сверенные с ФОП
# Subtest: OCR-выгрузка ФПУ честно помечена черновиком
# Subtest: сроки в выгрузке ФПУ: «До Д месяца ГГГГ» или «Бессрочно»
# Subtest: выгрузка ФПУ не противоречит сверенным вручную срокам (fpu_status.json)
# Subtest: банк заданий покрывает 1–11 классы, у каждого есть ответ и объяснение
# Subtest: матрица покрытия не заявляет полноту без доказательства
# tests 10
# suites 0
# pass 10
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 202.174366
```
