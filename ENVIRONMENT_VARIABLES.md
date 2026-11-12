# СПРАВОЧНИК ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
**CXRNER LINK · Environment Variables Reference**

---

## 1. Сводная таблица параметров

| Переменная | Обязательна | Где используется | Описание / Пример |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Да** | Клиент / Сервер | Канонический URL сайта (`https://cxrnermusic.com`) |
| `NEXT_PUBLIC_LINK_DOMAIN` | **Да** | Клиент / Сервер | Домен коротких смарт-ссылок (`https://link.cxrnermusic.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | **Да** | Клиент / Сервер | Адрес проекта Supabase (`https://xyzcompany.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Да** | Клиент / Сервер | Публичный анонимный ключ Supabase для браузера |
| `SUPABASE_SERVICE_ROLE_KEY` | **Да** | Сервер (API) | Секретный мастер-ключ Supabase для обхода RLS в админке и кронах |
| `ADMIN_EMAILS` | Рекомендуется | Сервер | Список email администраторов через запятую |
| `ADMIN_MASTER_KEY` | Рекомендуется | Сервер | Мастер-пароль быстрого входа в панель `/admin` |
| `CRON_SECRET` | Рекомендуется | Сервер | Секретный токен авторизации крона Vercel (`Bearer <token>`) |
| `SPOTIFY_CLIENT_ID` | Опционально | Сервер | Client ID из Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Опционально | Сервер | Client Secret из Spotify Developer Dashboard |
| `TELEGRAM_BOT_TOKEN` | Опционально | Сервер | Токен бота [@BotFather](https://t.me/BotFather) для Pre-save рассылки |
| `RESEND_API_KEY` | Опционально | Сервер | Ключ сервиса Resend.com для email-уведомлений |
| `EMAIL_FROM` | Опционально | Сервер | Адрес отправителя (`CXRNER MUSIC <releases@cxrnermusic.com>`) |

---

## 2. Инструкция по установке в Vercel

1. Откройте ваш проект в [Vercel Dashboard](https://vercel.com).
2. Перейдите во вкладку **Settings** -> **Environment Variables**.
3. Добавьте каждую переменную для окружений:
   - `Production`
   - `Preview`
   - `Development`
4. После сохранения переменных перезапустите деплой (**Redeploy**), чтобы новые значения вступили в силу.

---

## 3. Локальная разработка (`.env.local`)

Для локальной работы скопируйте `.env.example` в `.env.local` и укажите ваши тестовые ключи:
```bash
cp .env.example .env.local
```
Файл `.env.local` добавлен в `.gitignore` и никогда не попадает в публичный репозиторий.
