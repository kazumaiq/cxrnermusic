# Подключение сайта к Telegram-модерации

Репозиторий `kazumaiq/cxner-music-bot` менять не нужно: в текущей версии уже есть endpoint `POST /api/new-release` и обработчики кнопок модерации.

## Что должно быть настроено на сервере бота

В окружении, где запущен бот, нужны:

```env
BOT_TOKEN=токен_бота
MODERATION_CHAT_ID=-100xxxxxxxxxx
ADMIN_IDS=123456789,987654321

SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_или_secret_key
SUPABASE_FORMS_TABLE=cxrner_forms
SUPABASE_CABINET_TABLE=cxrner_cabinet_users

ENABLE_WEB_SERVER=true
PUBLIC_BASE_URL=https://адрес-бота.example.com
PORT=8080
```

`MODERATION_CHAT_ID` — ID группы модерации. Бот должен быть добавлен в группу администратором с правами отправки, редактирования и закрепления сообщений.

`ADMIN_IDS` — Telegram ID модераторов, которым разрешены действия через inline-кнопки.

`PUBLIC_BASE_URL` должен вести на публичный адрес сервера бота. Сайт обращается к:

```text
POST https://адрес-бота.example.com/api/new-release
```

## Что добавить в Vercel сайта

```env
BOT_BACKEND_URL=https://адрес-бота.example.com
```

После добавления переменной нужен Redeploy сайта.

## Как работает отправка

1. Авторизованный пользователь заполняет форму на `/submit-release`.
2. Сайт сохраняет полную анкету в Supabase в `cxrner_forms`.
3. Сайт отправляет `form_id` на `/api/new-release` бота.
4. Бот читает полную анкету из Supabase.
5. Бот публикует её в группе с пометкой `Источник: 🌐 САЙТ`.
6. К сообщению прикрепляются существующие кнопки модерации.
7. Бот обновляет статус в Supabase после действия модератора.

## Проверка

Проверяйте логи бота. При успешной отправке должна появиться строка:

```text
[WEBAPP] release accepted to moderation
```

Если сайт показывает `BOT_BACKEND_URL не настроен`, добавьте переменную в Vercel и выполните Redeploy.
