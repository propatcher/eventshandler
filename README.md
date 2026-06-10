# Eventlys — веб-платформа управления мероприятиями

Исходный код проекта, разработанного в рамках дипломной работы (ВКР).
Полнофункциональное веб-приложение с клиент-серверной архитектурой: REST API на FastAPI и одностраничный интерфейс на React.

## Возможности

* Регистрация по email, **вход по email или @username** (JWT, пароли — PBKDF2, защита от перебора: лимит попыток входа)
* **Мероприятия**: название, дата, время, **длительность**, место, описание, статусы; по окончании события автоматически попадают в «Прошедшие»
* **Приглашения** участников по @username/email с принятием/отклонением
* **Чат мероприятия** для участников (кнопка «Чат» на карточке)
* **Уведомления**: приветствие, приглашения, ответы, рассылки; бейдж непрочитанных
* **Админка**: список пользователей и массовая рассылка уведомлений
* ИИ-ассистент поддержки (DeepSeek), отвечает только по платформе
* **Палитра команд** Ctrl+K: разделы и быстрые действия
* Чёрно-белый минималистичный интерфейс без скруглений, адаптивный (на телефоне меню снизу), анимации Framer Motion

> Первый зарегистрированный пользователь автоматически становится **администратором** (или любой email из переменной `ADMIN_EMAILS`).

## Стек технологий

### Серверная часть (backend)
* **Фреймворк:** FastAPI (Python 3.13), GZip + security-заголовки, `/healthz`
* **База данных:** PostgreSQL + SQLAlchemy (асинхронный движок, asyncpg)
* **Миграции:** Alembic (накатываются автоматически при старте контейнера)
* **Кэширование:** Redis (кэш списка мероприятий с инвалидацией; в dev необязателен)
* **Авторизация:** JWT (PyJWT) + хэширование паролей PBKDF2
* **ИИ-поддержка:** DeepSeek (OpenAI-совместимый API)

### Клиентская часть (frontend)
* **Библиотека:** React 19 + Vite
* **Стилизация:** Tailwind CSS v4
* **Раздача в проде:** Caddy — статика, прокси `/api` на бэкенд и **автоматический HTTPS (Let's Encrypt)**

### Инфраструктура
* Docker & Docker Compose; данные Postgres — в томе `pgdata`, сертификаты Caddy — в томе `caddy_data`

## Структура проекта

* `backend/` — асинхронное REST API
  * `app/api/v1/` — роутеры (auth, users, events, notifications, admin, chat)
  * `app/models/` — ORM-модели (User, Event, участники, сообщения, уведомления)
  * `app/schemas/` — схемы валидации (Pydantic)
  * `app/core/` — конфиг, БД, безопасность, кэш
  * `migrations/` — миграции Alembic
* `frontend/` — SPA (React), `Caddyfile` — конфиг веб-сервера
* `docker-compose.yml` — оркестрация всех сервисов

## Запуск через Docker (полный цикл)

Поднимает разом **PostgreSQL + Redis + Backend + Frontend** одной командой.

1. (необязательно) для работы ИИ-ассистента создайте `backend/.env`:
   ```env
   DEEPSEEK_API_KEY=sk-...
   ```
2. Из каталога `eventshandler/`:
   ```bash
   docker compose up --build -d
   ```
3. Откройте приложение: **http://localhost**

| Сервис   | Адрес                           | Назначение           |
|----------|---------------------------------|----------------------|
| Frontend | http://localhost (порты 80/443) | SPA (Caddy)          |
| Backend  | http://127.0.0.1:8002/docs      | REST API + Swagger   |
| Postgres | 127.0.0.1:5432 (events/events)  | База данных          |
| Redis    | внутренняя сеть (redis:6379)    | Кэш                  |

> Миграции Alembic применяются автоматически перед стартом бэкенда. Данные Postgres хранятся в томе `pgdata` и переживают перезапуск.

Полезные команды:
```bash
docker compose logs -f backend   # логи бэкенда
docker compose ps                # статус контейнеров
docker compose down              # остановить
docker compose down -v           # остановить и стереть данные БД
```

## Деплой на сервер (с HTTPS из коробки)

1. Установите Docker и Docker Compose, откройте порты **80 и 443**.
2. Направьте DNS: A-записи домена (`eventlys.ru`, `www`) → IP сервера. Если используете Cloudflare — режим «DNS only» (серое облако).
3. Склонируйте репозиторий, перейдите в `eventshandler/` и создайте секреты:
   ```bash
   cp .env.example .env                 # SECRET_KEY, пароль БД, CORS
   cp backend/.env.example backend/.env # ключ DeepSeek
   ```
   В `.env` обязательно задайте надёжный `SECRET_KEY` (`openssl rand -hex 32`), `POSTGRES_PASSWORD` и домен в `CORS_ORIGINS`.
4. Запустите:
   ```bash
   docker compose up -d --build
   ```
   Caddy сам получит сертификат Let's Encrypt и будет продлевать его автоматически (хранится в томе `caddy_data`). Все сервисы имеют `restart: unless-stopped`.
5. Откройте `https://<домен>` — первый зарегистрированный пользователь станет администратором.

Замечания по безопасности: Postgres и бэкенд слушают только `127.0.0.1` — наружу доступен лишь Caddy (80/443); пароли хешируются PBKDF2; вход защищён от перебора лимитом попыток.

## Локальный запуск для разработки

**Бэкенд:**
```bash
docker compose up -d db      # PostgreSQL на 127.0.0.1:5432
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
По умолчанию подключается к `postgresql+asyncpg://events:events@localhost:5432/events`; переопределяется переменной `DATABASE_URL` (поддерживается и SQLite: `sqlite+aiosqlite:///./events.db`). Redis необязателен: без `REDIS_URL` кэш отключается.

**Фронтенд:**
```bash
cd frontend
npm install
npm run dev
```
Dev-сервер — http://localhost:5173, API ожидается на http://localhost:8000.
