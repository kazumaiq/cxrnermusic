# Настройка Supabase для CXRNER MUSIC

## 1. Переменные Vercel

Добавьте в Vercel → Project → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=covers
NEXT_PUBLIC_SITE_URL=https://cxrnermusic.vercel.app
ADMIN_EMAILS=your-email@example.com
BOT_BACKEND_URL=https://YOUR_BOT_BACKEND
```

`SUPABASE_SERVICE_ROLE_KEY` и `ADMIN_EMAILS` должны быть только серверными переменными. Не добавляйте им префикс `NEXT_PUBLIC_`.

`BOT_BACKEND_URL` нужен только для отправки релизов из `/submit-release` в Telegram-бота.

## 2. База данных

Откройте Supabase → SQL Editor и выполните файл `supabase/migrations/001_cxrner_content.sql`.

После выполнения появятся таблицы для новинки, релизов, артистов, пользователей кабинета и анкет релизов. Bucket `covers` тоже создаётся этим скриптом.

## 3. Администратор

1. Зарегистрируйте свой аккаунт на `/auth/register`.
2. В Supabase → Authentication → Users скопируйте email или UUID пользователя.
3. Добавьте email в Vercel-переменную `ADMIN_EMAILS`, например:

```env
ADMIN_EMAILS=your-email@example.com
```

Для нескольких администраторов используйте запятую:

```env
ADMIN_EMAILS=first@example.com,second@example.com
```

4. Выполните Redeploy в Vercel.
5. Откройте `/admin`.

## 4. Работа с панелью

- `Новинка` — обложка, название и артист главного hero-блока.
- `Релизы` — карточки, ссылки на DSP и обложки.
- `Артисты` — фото, slug, слушатели, биография, жанры и ссылки.

После сохранения данные пишутся в Supabase и используются сайтом при следующем запросе без ручного изменения кода.

## 5. Если изображения не загружаются

Проверьте:

- существует ли Storage bucket `covers`;
- установлен ли `SUPABASE_SERVICE_ROLE_KEY` в Vercel;
- установлен ли `SUPABASE_STORAGE_BUCKET=covers`;
- выполнен ли Redeploy после добавления переменных.
