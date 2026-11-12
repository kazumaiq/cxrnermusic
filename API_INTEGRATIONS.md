# ИНТЕГРАЦИИ С МУЗЫКАЛЬНЫМИ И ВНЕШНИМИ API
**CXRNER LINK · Инструкция по подключению сервисов**

---

## 1. Поиск метаданных по UPC / EAN

Система автопоиска CXRNER LINK (`lib/linkLookup.ts`) объединяет несколько источников данных с автоматической валидацией контрольной суммы Modulo-10.

```
       [ Запрос артиста: UPC / EAN ]
                   │
         [ Modulo-10 Checksum ]
          ├── Неверно ──> Ошибка валидации
          └── Верно
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
 [Apple iTunes API]  [Deezer API]
       └─────────┬─────────┘
                 │
   [ Объединение метаданных: обложка, ]
   [ треки, ISRC, Apple & Deezer URL  ]
                 │
   (Если не найдено: Fallback MusicBrainz)
```

### Источники без обязательной авторизации (работают сразу из коробки):
1. **Apple Music / iTunes Search API**:
   - URL: `https://itunes.apple.com/lookup?upc={upc}&entity=album`
   - Возвращает: Название альбома/сингла, имя артиста, обложку высокого разрешения (до 1400x1400px), ссылку на Apple Music, жанр, дату релиза.
2. **Deezer API**:
   - URL: `https://api.deezer.com/album/upc:{upc}`
   - Возвращает: Метаданные, прямую ссылку на Deezer, обложку 1000x1000px, треклист.
3. **MusicBrainz**:
   - URL: `https://musicbrainz.org/ws/2/release/?query=barcode:{upc}`
   - Отказоустойчивый резервный каталог международной базы релизов.

---

## 2. Spotify API (Регистрация приложения)

Для получения прямых ссылок на Spotify и треки:
1. Перейдите в [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Авторизуйтесь под вашим аккаунтом Spotify.
3. Нажмите **Create App**:
   - **App Name**: `CXRNER LINK`
   - **App Description**: `Music Smart Links Platform for CXRNER MUSIC`
   - **Redirect URI**: `https://link.cxrnermusic.com/api/auth/spotify/callback` (и `http://localhost:3000/api/auth/spotify/callback` для локальной разработки).
   - **API / SDKs**: выберите `Web API`.
4. В настройках созданного приложения скопируйте:
   - `Client ID`
   - `Client Secret`
5. Добавьте в переменные окружения:
   ```env
   SPOTIFY_CLIENT_ID="ваш_client_id"
   SPOTIFY_CLIENT_SECRET="ваш_client_secret"
   ```

---

## 3. Telegram Бот для Pre-save уведомлений

Сервис отправляет персональное уведомление фанату в Telegram в момент, когда релиз выходит в статус «Out Now»:
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте `/newbot` и создайте бота, например `@cxrner_link_bot` (или используйте существующего `@cxrner_bot`).
3. Скопируйте полученный HTTP API Token:
   ```env
   TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
   ```
4. Для связи аккаунта артиста с админкой используется существующий канал или бот `@moder_cxrner_bot`.

---

## 4. Email-рассылка (Resend / SMTP)

Для отправки Pre-save уведомлений на Email фанатов:
1. Зарегистрируйтесь на [Resend.com](https://resend.com).
2. Добавьте и верифицируйте DNS-записи для домена `cxrnermusic.com` (DKIM, SPF).
3. Создайте API Key в разделе **API Keys**.
4. Добавьте в `.env.local` / Vercel:
   ```env
   RESEND_API_KEY="re_123456789..."
   EMAIL_FROM="CXRNER MUSIC <releases@cxrnermusic.com>"
   ```
