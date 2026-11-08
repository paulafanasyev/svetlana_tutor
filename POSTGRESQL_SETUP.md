# Установка PostgreSQL для API тестов

## Вариант 1: Автоматическая установка (рекомендуется)

### Windows (PowerShell от администратора):
```powershell
winget install PostgreSQL.PostgreSQL.16 --accept-package-agreements --accept-source-agreements
```

### Или скачать установщик:
https://www.postgresql.org/download/windows/

## Вариант 2: Portable версия

### Скачать:
```bash
cd D:\mt5\tools
curl -L -o postgresql-16.zip "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64-binaries.zip"
```

### Распаковать:
```powershell
Expand-Archive -Path postgresql-16.zip -DestinationPath . -Force
```

### Инициализировать базу данных:
```bash
cd D:\mt5\tools\pgsql
bin\initdb -D data
bin\pg_ctl -D data -l logfile start
bin\createdb ai_english_teacher
bin\createuser app_user -P
# Ввести пароль: CHANGE_ME
```

## Настройка подключения

### Создать .env файл:
```bash
cd D:\mt5\tutor\apps\api
copy .env.example .env
```

### Отредактировать .env:
```env
DATABASE_URL="postgresql://app_user:CHANGE_ME@localhost:5432/ai_english_teacher?schema=public"
JWT_SECRET="your-random-secret-key-here"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

## Применение миграций

```bash
cd D:\mt5\tutor\apps\api
npx prisma migrate deploy
```

## Запуск тестов

```bash
npm test
```

Ожидаемый результат: **46/46 тестов проходят (100%)**

---

## Альтернатива: Docker

Если установлен Docker:

```bash
docker run --name tutor-postgres \
  -e POSTGRES_USER=app_user \
  -e POSTGRES_PASSWORD=CHANGE_ME \
  -e POSTGRES_DB=ai_english_teacher \
  -p 5432:5432 -d postgres:16
```

Затем продолжить с настройки .env.

---

## Текущий статус без PostgreSQL

✅ **Веб-тесты:** 217/217 (100%) — работают без базы данных  
✅ **API тесты (без чата):** 29/29 (100%) — используют mock  
⚠️ **API тесты (чат):** 0/17 — требуют PostgreSQL  

**Общая готовность:** 93.5% (246/263 тестов)
