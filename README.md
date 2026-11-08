# 🎓 Светлана Репетитор

![Pavel Afanasev logo](pavel-afanasev-logo.svg)

**Светлана Репетитор** — бесплатный помощник школьника и учителя: английский с озвученными учителями, математика 5–9 класса в режиме «Подумай сам» и полноценная «Цифровая школа» для школ России, local-first, прямо в браузере. Возрастная маркировка **6+**.

Создан на базе проекта **«Светлана» АНО ЦПС «Мир Самозанятых»**. Разработчик: **Афанасьев Павел**.

🌐 **Прод:** https://ai-english-teacher-one.vercel.app/app/ — фронтенд и API на Vercel (автодеплой из `main`), база данных — Neon Postgres. GitHub Pages отключён.

## Что внутри

- голосовая практика с анимированными учителями (lip-sync по виземам, моргание, эмоции);
- озвучка на EN/RU через браузерный или нативный TTS, с понятными ошибками и fallback;
- уроки A1–B2, XP, серии занятий и мини-игры;
- математика 5–9 класс в режиме «Подумай сам»: подсказки по шагам, решение только после попыток, точная проверка ответов без ИИ (`apps/web/src/features/math`);
- четыре учебных трека: **base** (обычная школа), **cadet** (кадетские классы), **lyceum** (лицеи/гимназии), **care** (СУВУ и группы риска, работа офлайн без интернета);
- «Цифровая школа»: электронный журнал и дневник, домашние задания, чаты (школа/персонал/классы/личные, RBAC и школьный скоупинг на сервере), кабинеты сотрудников с AI-ассистентами по профессиям, магазин электронных книг, маркетплейс школьных товаров, буфет/столовая;
- серверный модуль: Express + Prisma API (аутентификация JWT с refresh-токенами, журнал, прогресс, экономика, чаты, родительский кабинет) с rate-limit и проверкой прав;
- фотореалистичный кадет-аватар с липсинком по аудио-огибающей и приветственным видео;
- детская безопасность: детерминированный фильтр перед ИИ и чатом (`apps/web/src/ai/childSafety.js`), телефоны помощи при кризисе;
- согласие родителя при регистрации, статистика только по согласию, `privacy.html` (включая раскрытие сторонних сервисов: распознавание речи Chrome и Google Fonts);
- тренировка IELTS / TOEFL: reading, listening, writing (с оценкой от локального ИИ), speaking;
- офлайн-PWA-сборка для учреждений без интернета (`scripts/build-offline.js`, 23 пакета встроены);
- интерфейс на русском и английском;
- local-first режим: без сервера прогресс хранится в `localStorage`;
- встроенный in-browser LLM (WebLLM, Qwen2.5 0.5B по умолчанию) включается в Настройках и работает на устройстве через WebGPU. Его «должностная инструкция» — реестр задач в `apps/web/src/ai/tasks.js`; у каждой задачи есть валидация и rule-based fallback, поэтому приложение работает и без модели.

**Два режима работы.** Если `VITE_API_URL` не задан (локальный запуск), приложение работает в демо-режиме: все данные остаются в браузере, на экране появляется пометка о демо-режиме. В продакшене задан `VITE_API_URL` — фронтенд ходит к своему же API на том же домене (`/api/*`), данные пользователей хранятся в Neon Postgres.

## Быстрый старт

Фронтенд (демо-режим, сервер не нужен):

```bash
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

Тесты и сборка: `npm test`, `npm run build && npm run preview` (в web-тестах 223 проверки).

API (нужен PostgreSQL, схема применяется из `apps/api/prisma/schema.sql`):

```bash
cd apps/api
npm install --legacy-peer-deps
npx prisma generate
# в apps/api/.env укажите DATABASE_URL и JWT_SECRET (32+ случайных символов)
psql "$DATABASE_URL_NON_POOLING" -f prisma/schema.sql
node prisma/seed.js        # NODE_ENV=production требует сильный SEED_ADMIN_PASSWORD
npm test                   # 73 проверки в vitest
node src/server.js
```

Голосовой ввод зависит от разрешений браузера/ОС. Для локальной AI-модели нужен современный Chrome или Edge с WebGPU; первый запуск скачивает модель (~300–1100 МБ), дальше она берётся из кэша браузера. Без WebGPU всё работает в базовом режиме.

## Деплой

Прод собирается на Vercel по `vercel.json` при каждом push в `main` (`web-ci.yml` дополнительно проверяет web-сборку на PR).

Схема: `apps/web` собирается в `/app/`, `api/index.mjs` — точка входа serverless-функции, которой через rewrite `/api/:path*` достаются все запросы к API; Prisma-движки собираются под Vercel (`binaryTargets` в `schema.prisma`).

Переменные окружения проекта Vercel (production):

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | строка подключения Neon (pooled) + `&pgbouncer=true&connect_timeout=10` |
| `JWT_SECRET` | 64 случайных байта в hex (`openssl rand -hex 64`) |
| `CORS_ORIGINS` | адрес прода (для same-origin запросов CORS не задействован) |
| `VITE_API_URL` | адрес прода — включает серверный режим фронтенда |

База: применить `apps/api/prisma/schema.sql` (создаёт 14 таблиц + enum `Role`), затем сеять админа (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, в production пароль по умолчанию запрещён, демо-аккаунты не создаются).

Секреты (`apps/api/.env`, `.env.local`, `.vercel/`) в репозиторий не попадают — они в `.gitignore`.

## Мобильная версия

Capacitor-конфигурация и Android/iOS workflow остаются в репозитории. APK, когда опубликован, доступен на https://github.com/paulafanasyev/ai-english-teacher/releases/latest

## Структура

```text
apps/web        — React 18 + Vite SPA, HashRouter, PWA, local-first или серверный режим
apps/web/src/ai — WebLLM-движок, каталог моделей, реестр задач ИИ, детский фильтр
apps/web/src/avatar — учителя и кадет-аватар с липсинком
apps/web/src/features/math — математика «Подумай сам» с точной проверкой
apps/web/src/features/school — темы ФОП, план уроков, классы и чат
apps/api        — Express + Prisma API (auth, журнал, чаты, RBAC), схемы и seed
api/index.mjs   — точка входа serverless-функции Vercel для apps/api
site/           — статический маркетинговый сайт (RU/EN) + privacy policy
scripts/        — офлайн-PWA-сборка и утилиты данных
.github/workflows — web CI (Pages-деплой отключён)
```

## English (short)

**Svetlana Tutor** is a free helper for students and teachers (age rating 6+), based on the “Svetlana” project of the non-profit “Mir Samozanyatykh” (АНО ЦПС «Мир Самозанятых»), developed by Pavel Afanasyev. A local-first React/Vite SPA in Russian and English: four learner tracks (regular, cadet, lyceum, care/offline), a full digital-school suite (journal, homework, moderated chats, staff cabinets, e-book and goods marketplaces, canteen), English with voice-enabled teachers, a grade 5–9 math tutor with exact answer checking, and an optional in-browser LLM with rule-based fallbacks and a deterministic child-safety filter. The Express + Prisma API runs as a Vercel serverless function backed by Neon Postgres; without `VITE_API_URL` the app runs fully client-side in demo mode. Production is deployed on Vercel from `main`; GitHub Pages is disabled. Run `cd apps/web && npm install --legacy-peer-deps && npm run dev`.

## Разработка / Developers

**Афанасьев Павел (Pavel Afanasev)**, разработчик и руководитель проекта. На базе проекта «Светлана» АНО ЦПС «Мир Самозанятых».

## Правообладатель и связь

**Правообладатель:** Pavel Afanasev

- Email: [Pavel.afanasyev@inbox.ru](mailto:Pavel.afanasyev@inbox.ru)
- WhatsApp: [+79148289964](https://wa.me/79148289964)
- Telegram: [@PaulPavel_it_dev](https://t.me/PaulPavel_it_dev)

Коммерческие лицензии, разрешения на распространение и другие вопросы об использовании материалов: свяжитесь с правообладателем письменно.

## Лицензия / License

Материалы, принадлежащие правообладателю, распространяются на условиях проприетарной лицензии [LICENSE](LICENSE). Коммерческое использование, перепродажа и распространение копий без предварительного письменного разрешения запрещены. Сторонние компоненты регулируются собственными лицензиями. См. [реестр сторонних компонентов и контрольный список релиза](THIRD_PARTY_NOTICES.md).
