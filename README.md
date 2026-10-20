# 🎓 Светлана Репетитор

![Pavel Afanasev logo](pavel-afanasev-logo.svg)

**Светлана Репетитор** — бесплатный помощник школьника и учителя: английский с озвученными учителями и математика 5–9 класса в режиме «Подумай сам», local-first, прямо в браузере. Возрастная маркировка **6+**.

Создан на базе проекта **«Светлана» АНО ЦПС «Мир Самозанятых»**. Разработчик: **Афанасьев Павел**.

🌐 **Прод:** Vercel, автодеплой из `main` (см. `vercel.json`). GitHub Pages отключён.

## Что внутри

- голосовая практика с анимированными учителями (lip-sync по виземам, моргание, эмоции);
- озвучка на EN/RU через браузерный или нативный TTS, с понятными ошибками и fallback;
- уроки A1–B2, XP, серии занятий и мини-игры;
- математика 5–9 класс в режиме «Подумай сам»: подсказки по шагам, решение только после попыток, точная проверка ответов без ИИ (`apps/web/src/features/math`, тесты: `npm test`);
- демо-кабинет учителя и родителя: слабые темы, домашка по математике, журнал (в публичной сборке данные в одном браузере);
- школьный модуль (демо): темы ФОП, автоплан уроков с экспортом в CSV, классы и чат с модерацией (фильтр, жалобы, скрытие учителем), дистанционный урок через Jitsi, режим доступности;
- детская безопасность: детерминированный фильтр перед ИИ и чатом (`apps/web/src/ai/childSafety.js`), телефоны помощи при кризисе;
- согласие родителя при регистрации, статистика только по согласию, `privacy.html`;
- тренировка IELTS / TOEFL: reading, listening, writing (с оценкой от локального ИИ), speaking;
- интерфейс на русском и английском;
- local-first режим: прогресс хранится в `localStorage`, отдельный API не нужен;
- встроенный in-browser LLM (WebLLM, Qwen2.5 0.5B по умолчанию) включается в Настройках и работает на устройстве через WebGPU. Его «должностная инструкция» — реестр задач в `apps/web/src/ai/tasks.js` (tutor_reply, correct_sentence, explain_grammar, grade_writing, speaking_feedback, translate_hint, generate_exercise, placement_estimate, safety_filter); у каждой задачи есть валидация и rule-based fallback, поэтому приложение работает и без модели.

Публичная сборка по умолчанию **не подключается к Express API**. Серверный режим включается только через `VITE_API_URL`. Локальные демо-данные предназначены для обучения и прототипирования, это не серверная авторизация.

## Быстрый старт

```bash
cd apps/web
npm install
npm run dev
```

Для production-сборки: `npm run build && npm run preview`. Тесты (математика, детская безопасность, версии): `npm test`.

Разовая чистка старых вьетнамских полей в сгенерированных данных (из корня репозитория): `node scripts/strip-vi.mjs`.

Голосовой ввод зависит от разрешений браузера/ОС. Для локальной AI-модели нужен современный Chrome или Edge с WebGPU; первый запуск скачивает модель (~300–1100 МБ), дальше она берётся из кэша браузера. Без WebGPU всё работает в базовом режиме.

## Деплой

Прод собирается на Vercel по `vercel.json` при каждом push в `main`. `web-ci.yml` проверяет web-сборку на каждом push и PR. Workflow `pages.yml` оставлен в репозитории, но отключён: GitHub Pages не используется.

## Мобильная версия

Capacitor-конфигурация и Android/iOS workflow остаются в репозитории. APK, когда опубликован, доступен на https://github.com/paulafanasyev/ai-english-teacher/releases/latest

## Структура

```text
apps/web        — React 18 + Vite SPA, HashRouter, PWA, local-first API
apps/web/src/ai — WebLLM-движок, каталог моделей, реестр задач ИИ, детский фильтр
apps/web/src/avatar — учителя с lip-sync
apps/web/src/features/math — математика «Подумай сам» с точной проверкой
apps/web/src/features/school — темы ФОП, план уроков, классы и чат (демо)
apps/api        — необязательный Express API
site/           — статический маркетинговый сайт (RU/EN) + privacy policy
.github/workflows — web CI (Pages-деплой отключён)
```

## English (short)

**Svetlana Tutor** is a free helper for students and teachers (age rating 6+), based on the “Svetlana” project of the non-profit “Mir Samozanyatykh” (АНО ЦПС «Мир Самозанятых»), developed by Pavel Afanasyev. Local-first React/Vite SPA in Russian and English: progress lives in browser `localStorage`; an optional in-browser LLM (WebLLM over WebGPU) powers tutoring, corrections and writing feedback, with rule-based fallbacks everywhere and a deterministic child-safety filter in front of it. Includes English with voice-enabled teachers, a grade 5–9 math tutor with step-by-step hints and exact answer checking, demo teacher/parent dashboards and a demo school module with a moderated class chat. Production is deployed on Vercel from `main`; GitHub Pages is disabled. Run `cd apps/web && npm install && npm run dev`.

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
