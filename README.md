# cxrnermusic

## Mini App API proxy

Mini App отправляет анкеты через прокси-роут:

- `POST /miniapp/api/webapp/submit`
- `POST /miniapp/api/webapp/test`

Для работы укажите в Vercel Environment Variables:

- `MINIAPP_PROXY_TARGET=https://<bot-backend-domain>`

Пример проверки после деплоя:

- `https://cxrnermusic.vercel.app/miniapp/api/health`

## Личный кабинет артиста и веб-отправка релизов

Сайт использует ту же базу Supabase, что и Telegram-бот. Никаких новых таблиц не создаётся.

### Основные таблицы

- `cxrner_forms` — анкеты релизов (общая для Telegram и сайта)
- `cxrner_cabinet_users` — профили пользователей кабинета

### Переменные окружения для Supabase/Auth

В Vercel Environment Variables (и локально) должны быть заданы:

- `NEXT_PUBLIC_SUPABASE_URL=https://...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_URL=...` (уже используется для витрины релизов)
- `SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

Для связи с Telegram-ботом:

- `BOT_BACKEND_URL=https://<bot-backend-domain>` — backend бота, где реализован endpoint `/api/new-release`
- `NEXT_PUBLIC_SITE_URL=https://cxrnermusic.vercel.app` — базовый URL сайта, используется при вызове внутренних API

### Поток регистрации и кабинета

1. Пользователь регистрируется через `/auth/register` (Supabase Auth, email+password).
2. После регистрации создаётся/обновляется профиль в `cxrner_cabinet_users` с `user_id` и JSON-полем `profile`.
3. Авторизованный пользователь попадает в `/dashboard`, где видит:
   - свой профиль (имя артиста из `cxrner_cabinet_users` или email)
   - таблицу релизов из `cxrner_forms`, отфильтрованную по `user_id`
   - кнопку «Отправить релиз», ведущую на `/submit-release`.

### Отправка релиза через сайт

- Страница `/submit-release` содержит форму:
  - `artist_name`
  - `track_name`
  - `genre`
  - `release_type`
  - `release_date`
  - `cover_link`
  - `audio_link`
  - `links` (многострочное поле)
  - `promo_text`
- Форма отправляется на `POST /api/forms/submit`.
- Обработчик создаёт запись в `cxrner_forms`:
  - `user_id = current_user.id`
  - `artist_name`, `track_name`, `genre`, `release_type`
  - `status = "pending"`
  - `source = "web"`
  - `form_payload` — JSON со всеми полями формы.

### Интеграция с Telegram-ботом

После успешной вставки в `cxrner_forms`:

1. Сервер вызывает внутренний endpoint `POST /api/new-release`.
2. Он проксирует запрос на `${BOT_BACKEND_URL}/api/new-release` с payload:
   - `form_id`
   - `artist_name`
   - `track_name`
   - `genre`
   - `release_type`
3. Backend Telegram-бота:
   - достаёт полную анкету из `cxrner_forms`
   - формирует сообщение в группу модерации
   - показывает источник:
     - `Источник: 🌐 САЙТ`, если `source = "web"`
     - `Источник: 🤖 TELEGRAM` по умолчанию для анкет из бота
   - добавляет кнопки модерации и сохраняет `moderation_message_id` в `cxrner_forms`.

### Realtime-обновления статусов

Сайт использует Supabase Realtime для автообновления:

- В `/dashboard` компонент `DashboardReleasesTable` подписывается на `postgres_changes` по таблице `cxrner_forms` с фильтром по `user_id`.
- В `/dashboard/release/[id]` компонент `ReleaseRealtimeSection` подписывается на обновления конкретной записи по `id`.

Когда модерация в Telegram меняет `status`, `reject_reason` или `upc` в `cxrner_forms`, эти изменения автоматически прилетают на сайт без перезагрузки страницы.

### Основные маршруты

- `/auth/register` — регистрация артиста (Supabase Auth + запись в `cxrner_cabinet_users`).
- `/auth/login` — вход в личный кабинет.
- `/dashboard` — личный кабинет, список релизов и карточки статистики.
- `/dashboard/release/[id]` — детальная карточка релиза, статус модерации, UPC и поля из `form_payload`.
- `/submit-release` — отправка релиза через сайт.

Доступ к `/dashboard` и `/submit-release` защищён через middleware: неавторизованные пользователи перенаправляются на `/auth/login`.

