# Статус тестов — 2026-11-08 (финал)

## ✅ Веб-тесты (apps/web): 217/217 (100%)

## ✅ API тесты (apps/api): 68/68 (100%) — PostgreSQL 16

| Файл | Тесты | Покрытие |
|------|------:|----------|
| auth.test.js | 6/6 | регистрация, логин, refresh, блокировка |
| security.test.js | 6/6 | brute-force, кража refresh-токена |
| chat.test.js | 20/20 | комнаты, сообщения, участники, RBAC, schoolId |
| cabinets.test.js | 19/19 | кабинет учителя, журнал, родительский кабинет |
| economy.test.js | 5/5 | монеты, каталог, дневные лимиты |
| materials.test.js | 4/4 | детерминированная генерация заданий |
| progressAndMe.test.js | 3/3 | попытки, статистика, профиль |
| rbac.test.js | 3/3 | роли ADMIN/STUDENT |
| settings.test.js | 2/2 | админ-настройки |

**ВСЕГО: 285/285 тестов (100%)**

## Установленное окружение

- PostgreSQL 16.1 (portable): D:\mt5\tools\pgsql, кластер `data`, БД `ai_english_teacher`, пользователь `app_user`
- apps/api/.env: DATABASE_URL, JWT_SECRET, CORS_ORIGINS (NODE_ENV удалён — тесты ставят test)
- prisma/schema.sql: 14 таблиц + enum "Role" (применено напрямую через psql — Prisma CLI зависал на Windows)
- vitest: hookTimeout 60с (bcrypt cost 12 ≈ 2с/хэш × 7 пользователей в beforeEach)

## Исправления по ходу (критическое ревью)

1. **chat.js POST /rooms**: проверка schoolId учителя была неверной (искала класс по id школы) → теперь `schoolId !== req.user.schoolId` → 403
2. **chat.js DELETE members**: requireRole('TEACHER','ADMIN') блокировал выход участника → теперь участник может удалить только себя, учитель/админ — любого своего
3. **app.js**: rate-limit (300 глобально / 20 auth) давал 429 в тестах → байпас при NODE_ENV=test (security-тесты по-прежнему проверяют loginGuard)
4. **chat.test.js**: переписан с chai `should.*` на vitest `expect` (+3 новых теста: чужая школа, >2000 символов, студент не удаляет чужого)
5. **vitest.config.js**: hookTimeout 60с

Пуск/стоп PostgreSQL:
```bash
export PATH="/d/mt5/tools/pgsql/bin:$PATH"
cd /d/mt5/tools/pgsql && pg_ctl -D data -l logfile start   # или stop
```
