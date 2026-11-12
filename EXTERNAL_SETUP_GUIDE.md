# CXRNER LINK — ПОЛНОЕ РУКОВОДСТВО ПО НАСТРОЙКЕ И ЗАПУСКУ
**CXRNER MUSIC · Proprietary Smart Links & Pre-save Platform**

---

## 1. Введение и Архитектура

**CXRNER LINK** — это высоконагруженная платформа музыкальных смарт-ссылок и Pre-save кампаний, полностью встроенная в экосистему лейбла **CXRNER MUSIC**. Сервис позволяет артистам за секунды создавать кинематографичные страницы релизов по UPC-коду, собирать переходы на стриминги, запускать сбор Pre-save уведомлений и отслеживать конверсии.

### Ключевые возможности:
- **Два доменных адреса**: `https://link.cxrnermusic.com/[slug]` (основной) и `https://cxrnermusic.com/link/[slug]` (зеркальный).
- **Мгновенный автопоиск по UPC**: Modulo-10 валидация, одновременный запрос к Apple Music / iTunes API и Deezer API с отказоустойчивым поиском через MusicBrainz.
- **Интерактивный Page Builder**: Предпросмотр в реальном времени (Desktop / Mobile), 4 дизайнерских шаблона (`CYBER`, `CINEMATIC`, `MINIMAL`, `BRUTAL`), настройка размытия фона, стилей кнопок и шрифтов.
- **Pre-save & Auto Out Now**: Сбор подписчиков через Email и Telegram; автоматический переход релиза в статус «Out Now» по таймеру и крону без участия человека.
- **Детальная аналитика**: Защита от ботов, гео-распределение, устройства, переходы по стримингам, динамика CTR.
- **Админ-модерация**: Панель верификации артистов, блокировка ссылок, аудит логов.

---

## 2. Пошаговый чек-лист развёртывания

| Шаг | Сервис | Действие | Документация |
|---|---|---|---|
| **1** | **Supabase** | Применить SQL-миграцию `003_cxrner_link_platform.sql` | [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) |
| **2** | **Supabase Storage** | Создать публичный бакет `smart-links` | [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) |
| **3** | **DNS / Vercel** | Добавить домен `link.cxrnermusic.com` в Vercel Project | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| **4** | **API Ключи** | Настроить Spotify API, Deezer, Telegram Bot, Resend | [API_INTEGRATIONS.md](./API_INTEGRATIONS.md) |
| **5** | **Переменные среды** | Прописать переменные в Vercel Dashboard и `.env.local` | [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) |
| **6** | **Cron Job** | Настроить запуск `/api/link/cron-out-now` каждые 10 минут | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |

---

## 3. Быстрый старт локально

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/kazumaiq/cxrnermusic.git
   cd cxrnermusic
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Создайте `.env.local` на основе `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
4. Запустите сервер разработки:
   ```bash
   npm run dev
   ```
5. Откройте:
   - Личный кабинет: `http://localhost:3000/dashboard/links`
   - Конструктор: `http://localhost:3000/dashboard/links/new`
   - Админ-панель: `http://localhost:3000/admin/links`

---

## 4. Ссылки на специализированные инструкции

- **База данных и безопасность**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Музыкальные API и интеграции**: [API_INTEGRATIONS.md](./API_INTEGRATIONS.md)
- **Деплой и настройка DNS поддомена**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Справочник переменных окружения**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- **Устранение неполадок (FAQ)**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
