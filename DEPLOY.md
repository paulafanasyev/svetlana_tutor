# 🚀 Развёртывание «Светлана Репетитор» на своём сервере (VPS + домен + HTTPS)

Репозиторий: `paulafanasyev/svetlana_tutor` (раньше `ai-english-teacher`). Обновлено 21.10.2026 после аудита безопасности (`docs/SECURITY_HARDENING_2026-10.md`).

Два варианта работы:

| | Демо (сейчас на Vercel) | Серверная версия (эта инструкция) |
|---|---|---|
| Где данные | в браузере ученика | PostgreSQL на вашем сервере |
| Класс на нескольких устройствах | нет | да |
| Защита от подмены данных | нет (всё локально) | да (JWT, роли, серверные проверки) |
| Демо-входы | ученик, учитель, родитель (админа нет) | скрыты |

Серверная схема: **nginx** (статика + HTTPS) → **API** (Node.js/Express в Docker) → **PostgreSQL** (Docker). Время: ~30–40 минут.

> ⚠️ **Дети из России = сервер в России.** По 152-ФЗ (ст. 18 ч. 5) персональные данные граждан РФ записываются и хранятся в базах на территории РФ: берите VPS в российском дата-центре (Timeweb, Selectel, Yandex Cloud, REG.RU и т. п.). До запуска с настоящими учениками нужны: утверждённая политика обработки ПД, согласие родителей (до 14 лет), уведомление Роскомнадзора об обработке ПД. Это не технические шаги, их делает оператор (АНО или школа).

**Что понадобится**
- VPS с Ubuntu 22.04/24.04, от 1 ГБ RAM (2 ГБ комфортнее), в РФ (см. выше)
- Домен (далее в примерах — `app.example.com`)
- Доступ к репозиторию GitHub (или архив исходников)

> Все команды выполняются на сервере от пользователя с sudo, если не указано иное. Значения `app.example.com`, пароли и секреты замените на свои.

---

## Шаг 1. DNS

У регистратора домена создайте A-запись:

| Тип | Имя | Значение |
|---|---|---|
| A | `app` (или `@` для корня) | IP вашего VPS |

Проверка (с любой машины): `ping app.example.com` → должен отвечать IP сервера. DNS может обновляться до часа.

## Шаг 2. Подготовка сервера

```bash
ssh root@ВАШ_IP

# обновления + базовые пакеты
apt update && apt -y upgrade
apt -y install ufw unzip curl git fail2ban

# отдельный пользователь для деплоя
adduser deploy && usermod -aG sudo deploy

# файрвол: только SSH и веб
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# автоматические обновления безопасности
apt -y install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

Совет: вход по SSH только по ключу (`PasswordAuthentication no` в `/etc/ssh/sshd_config`), затем `systemctl reload ssh`.

Дальше работайте под `deploy`: `su - deploy`.

## Шаг 3. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker          # применить группу без перелогина
docker --version && docker compose version
```

## Шаг 4. Код на сервер

```bash
sudo mkdir -p /opt && sudo chown $USER:$USER /opt
cd /opt
git clone https://github.com/paulafanasyev/svetlana_tutor.git
cd svetlana_tutor
```

Репозиторий приватный? Создайте deploy key (только чтение) в GitHub → Settings → Deploy keys и клонируйте по SSH. Без git: `scp svetlana_tutor-src.zip deploy@app.example.com:~` и `unzip` в `/opt`.

## Шаг 5. Секреты (.env)

Docker Compose читает `.env` из корня проекта:

```bash
cat > .env <<'EOF'
# --- PostgreSQL ---
POSTGRES_USER=app_user
POSTGRES_PASSWORD=ЗАМЕНИТЕ_НА_ДЛИННЫЙ_ПАРОЛЬ
# имя базы оставлено прежним, чтобы не ломать уже развёрнутые серверы
POSTGRES_DB=ai_english_teacher

# --- API ---
PORT=4000
JWT_SECRET=ЗАМЕНИТЕ_НА_СЕКРЕТ
CORS_ORIGINS=https://app.example.com

# --- Первый администратор (создаётся сидом) ---
SEED_ADMIN_EMAIL=admin@app.example.com
SEED_ADMIN_PASSWORD=ЗАМЕНИТЕ_НА_ПАРОЛЬ_АДМИНА
EOF

# сгенерировать секреты:
sed -i "s|ЗАМЕНИТЕ_НА_ДЛИННЫЙ_ПАРОЛЬ|$(openssl rand -hex 24)|" .env
sed -i "s|ЗАМЕНИТЕ_НА_СЕКРЕТ|$(openssl rand -hex 64)|" .env
nano .env   # задайте SEED_ADMIN_PASSWORD вручную и проверьте домен в CORS_ORIGINS
chmod 600 .env
```

⚠️ `SEED_ADMIN_PASSWORD`: длинный (12+ символов) и уникальный, смены пароля в UI пока нет. Адрес админа не публикуйте.

## Шаг 6. Запуск БД и API

```bash
docker compose up -d --build        # postgres + api; миграции применяются автоматически
docker compose logs -f api          # ждём "listening" (Ctrl+C для выхода)

# однократно: сид (админ + 12 демо-учеников с историей для аналитики)
docker compose run --rm api npm run seed

# smoke-тест: 401 = API жив и защищён
curl -i http://127.0.0.1:4000/api/me
```

Порты `4000` (API) и `5432` (Postgres) привязаны к `127.0.0.1` — из интернета их не видно, наружу смотрит только nginx.

Важно: API доверяет **одному** прокси перед собой (nginx) и берёт IP ученика из `X-Forwarded-For`. По IP работают лимиты и блокировка подбора пароля, поэтому не открывайте порт 4000 наружу и не ставьте второй прокси (Cloudflare и т. п.) без правки `trust proxy` в `apps/api/src/app.js`.

## Шаг 7. Сборка фронтенда

Нужен Node 20+:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs

cd /opt/svetlana_tutor/apps/web
npm install
npm test                                                # тесты детского фильтра, чата, магазина и др.
VITE_API_URL=https://app.example.com npm run build      # → dist/
```

При сборке плагин ФОП берёт текст программ с consultant.ru. Некоммерческая версия Консультанта отдаёт документы по расписанию (будни 20–24 МСК, выходные весь день); вне расписания сборка не падает, а берёт кэш `node_modules/.cache/noo-content` или корпус. Для полного содержания собирайте в окно или сохраняйте кэш.

Переменные сборки:

| Переменная | Зачем |
|---|---|
| `VITE_API_URL` | origin сайта **без** завершающего слэша. С ней фронтенд работает через JWT-API, демо-входы скрыты. |
| `VITE_DEMO_ADMIN=1` | только для демо-сборки без сервера: включает демо-админа (admin@demo). В боевой сборке не ставить. |

Публикация статики:

```bash
sudo mkdir -p /var/www/aet
sudo cp -r /opt/svetlana_tutor/apps/web/dist/* /var/www/aet/
```

## Шаг 8. Nginx

```bash
sudo apt -y install nginx
sudo tee /etc/nginx/sites-available/aet <<'EOF'
server {
    listen 80;
    server_name app.example.com;
    server_tokens off;

    root /var/www/aet;
    index index.html;

    # те же заголовки безопасности, что и на Vercel (vercel.json); CSP копируйте оттуда же
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Permissions-Policy "camera=(self \"https://meet.jit.si\"), microphone=(self \"https://meet.jit.si\"), geolocation=(), payment=(), usb=(), bluetooth=()" always;

    # статика SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API → docker-контейнер
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # перезаписываем, а не дописываем: иначе клиент подставит чужой IP и обойдёт лимиты
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 12m;   # загрузка PDF/DOCX до 10 МБ
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
EOF
sudo ln -s /etc/nginx/sites-available/aet /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Проверка: `http://app.example.com` уже должен открывать приложение.

## Шаг 9. HTTPS (Let's Encrypt)

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com --redirect -m admin@app.example.com --agree-tos -n
sudo systemctl status certbot.timer     # автопродление уже включено
```

После выпуска сертификата добавьте в блок `server { listen 443 ... }` HSTS:
`add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;` и `sudo systemctl reload nginx`.

Готово: `https://app.example.com` 🎉 (HTTPS обязателен для микрофона).

## Шаг 10. Первый вход

- **Админ:** email/пароль из `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` → вкладка «Админ».
- **Ученики:** регистрируются сами (тумблер «Открытая регистрация»). Для школы лучше закрыть открытую регистрацию и заводить учеников с согласия родителей.

Защита входа, которая работает сразу:
- 5 неверных паролей с одного IP закрывают вход в этот аккаунт с этого IP на 15 минут; 50 со всех IP закрывают аккаунт. Владелец с другой сети входит.
- Украденный токен входа при повторном использовании отзывает все сессии пользователя.
- Цены магазина назначает сервер (`apps/api/src/lib/catalog.js`, держите в синхроне с `apps/web/src/data/shopCatalog.js`).

Эти счётчики живут в памяти одного процесса API: запускайте **одну** реплику. Для нескольких нужен Redis.

## Шаг 11. Бэкапы

```bash
cd /opt/svetlana_tutor
chmod +x scripts/backup.sh scripts/restore.sh
./scripts/backup.sh                      # тест: появится backups/*.sql.gz

# ежедневно в 03:00, хранится 14 копий (ротация встроена)
(crontab -l 2>/dev/null; echo "0 3 * * * cd /opt/svetlana_tutor && ./scripts/backup.sh >> backups/backup.log 2>&1") | crontab -
```

Восстановление: `./scripts/restore.sh backups/ФАЙЛ.sql.gz`. Раз в неделю копируйте `backups/` за пределы сервера. Бэкапы содержат данные детей: храните их тоже в РФ и в зашифрованном виде (например, `gpg -c`).

## Шаг 12. Обновления

```bash
cd /opt/svetlana_tutor
git pull
docker compose build api && docker compose up -d      # миграции применятся сами
cd apps/web && npm install && npm test && VITE_API_URL=https://app.example.com npm run build
sudo cp -r dist/* /var/www/aet/
```

## Чек-лист безопасности

- [x] `JWT_SECRET` — 64+ случайных байта; `.env` с правами `600`, не попадает в git
- [x] Postgres и API слушают только `127.0.0.1`; наружу — только nginx c HTTPS
- [x] UFW: открыты лишь 22/80/443; автообновления безопасности; fail2ban
- [ ] SSH только по ключу
- [ ] Заголовки nginx (Шаг 8) + HSTS (Шаг 9) + CSP из `vercel.json`
- [ ] `X-Forwarded-For $remote_addr` в nginx, порт 4000 закрыт
- [ ] Одна реплика API (или Redis для счётчиков)
- [ ] `VITE_DEMO_ADMIN` не задан в боевой сборке
- [ ] Adminer только при необходимости: `docker compose --profile tools up -d adminer` + SSH-туннель (`ssh -L 8080:127.0.0.1:8080 …`), после работы — `docker compose stop adminer`
- [ ] Сервер и бэкапы в РФ; политика ПД, согласие родителей, уведомление РКН
- [ ] Периодически: `cd apps/api && npm audit`, `cd apps/web && npm audit`
- [ ] Прочитайте `SECURITY_AUDIT.md` и `docs/SECURITY_HARDENING_2026-10.md`

## Диагностика

| Симптом | Причина / решение |
|---|---|
| `JWT_SECRET must be set` при старте | Нет `.env` в корне или пропущена переменная |
| 502 на `/api/...` | API не поднялся: `docker compose logs api` |
| `P1001: Can't reach database` | Postgres ещё стартует — подождите healthcheck, `docker compose ps` |
| CORS-ошибки в консоли | `CORS_ORIGINS` должен точно совпадать с origin сайта (https, без слэша) |
| 429 «Too many failed attempts» | Блокировка подбора на 15 минут; если блокируются все сразу — nginx не передаёт IP (см. Шаг 8) |
| Микрофон не работает | Только HTTPS + Chrome; проверьте разрешение и Permissions-Policy |
| Демо-режим вместо сервера | Фронт собран без `VITE_API_URL` — пересоберите (Шаг 7) |
| В программах ФОП старый текст | Сборка была вне окна Консультанта и без кэша — пересоберите в окно (Шаг 7) |

**Логи:** `docker compose logs -f api` · `sudo tail -f /var/log/nginx/access.log`
