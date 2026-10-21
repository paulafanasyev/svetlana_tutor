# School materials: checks

- allowedUseUntil values outside the expected forms: «До 26 октября 2029 года»=4, «До 28 апреля 2027 года»=4, «До 28 ноября 2030 года»=1
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
# Subtest: матрица сверки охватывает все предметы каталога и не заявляет полноту
# Subtest: счётчик авторских заданий в матрице соответствует банку по классу и предмету
# Subtest: каталог содержит официальный список произведений для федеральных программ
# tests 13
# suites 0
# pass 13
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 183.03882
```
