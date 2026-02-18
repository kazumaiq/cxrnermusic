# cxrnermusic

## Mini App API proxy

Mini App отправляет анкеты через прокси-роут:

- `POST /miniapp/api/webapp/submit`
- `POST /miniapp/api/webapp/test`

Для работы укажите в Vercel Environment Variables:

- `MINIAPP_PROXY_TARGET=https://<bot-backend-domain>`

Пример проверки после деплоя:

- `https://cxrnermusic.vercel.app/miniapp/api/health`
