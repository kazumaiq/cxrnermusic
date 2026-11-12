# НАСТРОЙКА SUPABASE ДЛЯ CXRNER LINK
**База данных, Хранилище обложек, RLS Политики и Триггеры**

---

## 1. Выполнение SQL-миграций

Все таблицы, индексы, RLS-политики и триггеры платформы CXRNER LINK собраны в файле миграции:
`supabase/migrations/003_cxrner_link_platform.sql`

### Инструкция по установке:
1. Откройте панель управления [Supabase Dashboard](https://supabase.com/dashboard).
2. Выберите проект лейбла **CXRNER MUSIC**.
3. В левом боковом меню перейдите в **SQL Editor**.
4. Нажмите **New query**.
5. Скопируйте полное содержимое файла `supabase/migrations/003_cxrner_link_platform.sql` и вставьте в редактор.
6. Нажмите кнопку **Run** (зелёная стрелка или `Ctrl + Enter`).
7. Убедитесь в сообщении `Success. No rows returned`.

---

## 2. Структура созданных таблиц

### 1. `smart_links`
Основная таблица музыкальных смарт-страниц:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key на `auth.users`)
- `title`, `artist`, `cover_url`, `slug` (Unique)
- `upc`, `isrc`, `release_date`, `release_type`, `genre`, `label_name`, `description`
- `status`: `'draft' | 'published' | 'archived'`
- `is_out_now`: BOOLEAN (Флаг выхода релиза)
- `auto_out_now`: BOOLEAN (Автоматическое переключение в Out Now при наступлении даты)
- `template`: `'CYBER' | 'CINEMATIC' | 'MINIMAL' | 'BRUTAL'`
- `design_config`: JSONB (Настройки фонового размытия, стилей кнопок, кастомных цветов)
- `social_links`: JSONB (Ссылки на соцсети артиста: Instagram, VK, Telegram, YouTube и др.)
- `views_count`, `clicks_count`, `presaves_count`: целые числа для быстрой статистики
- `is_verified_artist`: BOOLEAN (Знак подлинности артиста от лейбла)
- `deleted_at`: TIMESTAMPTZ (Мягкое удаление)

### 2. `smart_link_platforms`
Площадки и стриминги внутри страницы:
- `id` (UUID)
- `smart_link_id` (UUID, FK `smart_links(id) ON DELETE CASCADE`)
- `platform_key` (`spotify`, `apple`, `yandex`, `vk`, `youtube_music`, `deezer`, `soundcloud`, `custom`)
- `platform_name`, `url`, `button_text`, `display_order`, `is_enabled`

### 3. `slug_history`
Журнал переименования URL для автоматических постоянных 301-редиректов:
- `id` (UUID)
- `smart_link_id` (UUID, FK `smart_links(id) ON DELETE CASCADE`)
- `old_slug` (TEXT, Индексирован)
- `created_at` (TIMESTAMPTZ)

### 4. `smart_link_analytics`
События посещений и кликов с фильтрацией ботов:
- `id` (UUID)
- `smart_link_id` (UUID, FK `smart_links(id) ON DELETE CASCADE`)
- `event_type`: `'view' | 'click' | 'presave'`
- `platform_key` (TEXT, nullable)
- `visitor_hash` (TEXT, анонимный хэш IP + User-Agent для подсчёта уникальных визитов)
- `country` (TEXT, определение по заголовку `cf-ipcountry` / `x-vercel-ip-country`)
- `device`: `'mobile' | 'desktop' | 'tablet'`
- `referrer` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 5. `presave_subscribers`
База контактов фанатов для уведомлений о выходе трека:
- `id` (UUID)
- `smart_link_id` (UUID)
- `email`, `telegram_chat_id`, `preferred_platform`
- `is_notified`: BOOLEAN
- `notified_at`: TIMESTAMPTZ

### 6. `system_logs`
Аудит системных событий, модерации и сбоев.

---

## 3. Настройка Supabase Storage (Бакет обложек)

Миграция автоматически создаёт бакет `smart-links`. Если вы настраиваете его вручную:
1. Перейдите в **Storage** -> **New Bucket**.
2. Имя бакета: `smart-links`.
3. Установите флаг **Public Bucket: ON** (чтобы обложки открывались в браузерах без подписи токеном).
4. File size limit: `10MB`.
5. Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`.
6. Сохраните.

### Политики доступа к Storage (создаются миграцией):
- **Select (Чтение)**: Разрешено всем (`anon`, `authenticated`).
- **Insert (Загрузка)**: Разрешено авторизованным пользователям (`authenticated`) в папку своего `user_id`.
- **Update/Delete**: Разрешено автору файла.

---

## 4. Проверка Row-Level Security (RLS)

Таблицы защищены политиками RLS:
1. Публичные пользователи (`anon`):
   - Могут читать только опубликованные ссылки (`status = 'published' AND deleted_at IS NULL`).
   - Могут отправлять события аналитики (`event_type = 'view' | 'click'`).
   - Могут сохранять заявки на Pre-save.
2. Авторизованные артисты (`authenticated`):
   - Могут просматривать, создавать, редактировать и мягко удалять **только свои** ссылки (`user_id = auth.uid()`).
3. Администраторы (email из переменной `ADMIN_EMAILS` или ключ `x-admin-key`):
   - Полный доступ через серверный Service Role Key.

---

## 5. Автоматизация переключения Pre-save в Out Now

В SQL создана функция:
```sql
SELECT process_auto_out_now();
```
Она находит все ссылки с `auto_out_now = true`, `is_out_now = false` и наступившей датой релиза `release_date <= NOW()`, и обновляет их в `is_out_now = true`.

Эту функцию вызывает серверный cron-эндпоинт `/api/link/cron-out-now` по расписанию Vercel Cron.
