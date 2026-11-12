# РУКОВОДСТВО ПО РАЗВЁРТЫВАНИЮ И НАСТРОЙКЕ ДОМЕНОВ
**CXRNER LINK · Vercel Multi-Domain & DNS Configuration**

---

## 1. Архитектура доменов и маршрутизация

Платформа CXRNER LINK поддерживает бесшовную работу на двух адресах одновременно:

| Назначение | Домен / Маршрут | Поведение |
|---|---|---|
| **Основной адрес смарт-ссылок** | `https://link.cxrnermusic.com/[slug]` | Проксируется через `proxy.ts` напрямую в `/link/[slug]` без смены URL в адресной строке |
| **Зеркальный адрес лейбла** | `https://cxrnermusic.com/link/[slug]` | Нативный маршрут App Router Next.js |
| **Личный кабинет артиста** | `https://cxrnermusic.com/dashboard/links` | Доступен после авторизации |
| **Админ-модерация** | `https://cxrnermusic.com/admin/links` | Доступ для администраторов |

---

## 2. Настройка DNS для поддомена `link.cxrnermusic.com`

У вашего DNS-провайдера (Cloudflare, Reg.ru, Namecheap и др.):
1. Откройте панель управления DNS для домена `cxrnermusic.com`.
2. Добавьте новую запись:
   - **Type**: `CNAME`
   - **Name / Host**: `link` (или `link.cxrnermusic.com`)
   - **Target / Value**: `cname.vercel-dns.com`
   - **TTL**: Auto или `300` (5 минут)
   - *Примечание для Cloudflare*: Рекомендуется установить статус проксирования **DNS Only (серое облако)** на время первой валидации SSL-сертификата в Vercel.

---

## 3. Добавление поддомена в Vercel

1. Откройте ваш проект в [Vercel Dashboard](https://vercel.com).
2. Перейдите в **Settings** -> **Domains**.
3. Нажмите **Add** и введите:
   ```
   link.cxrnermusic.com
   ```
4. Выберите ветку `main` для Production.
5. Vercel автоматически проверит CNAME-запись и выпустит бесплатный Let's Encrypt SSL-сертификат.
6. Статус должен стать зелёным: **Valid Configuration**.

---

## 4. Как работает Middleware (`proxy.ts`)

В файле `proxy.ts` реализован прозрачный перехватчик:
```typescript
const hostname = request.headers.get("host") || "";
const isLinkSubdomain =
  hostname.startsWith("link.") ||
  hostname.startsWith("link-staging.") ||
  hostname.startsWith("smartlink.");

if (isLinkSubdomain) {
  // Исключаем системные и служебные пути
  if (
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/auth")
  ) {
    const slug = pathname === "/" ? "" : pathname.replace(/^\//, "");
    return NextResponse.rewrite(
      new URL(slug ? `/link/${slug}` : "/link", request.url)
    );
  }
}
```
Благодаря этому:
- Пользователь, открывающий `https://link.cxrnermusic.com/silicium-echoes`, видит страницу релиза, а URL в браузере остаётся коротким и чистым.
- Запросы к `/api`, `/dashboard` и `/admin` не ломаются и корректно передаются в соответствующие обработчики.

---

## 5. Настройка автоматического Cron в `vercel.json`

Для автоматического перехода релизов из статуса Pre-save в Out Now файл `vercel.json` содержит конфигурацию:

```json
{
  "crons": [
    {
      "path": "/api/link/cron-out-now",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
Расписание `*/10 * * * *` запускает обработчик каждые 10 минут, сканирует базу на наличие релизов с наступившей датой, активирует их и рассылает Pre-save уведомления.

---

## 6. Процесс деплоя в Production

1. Отправьте изменения в GitHub:
   ```bash
   git add -A
   git commit -m "feat: launch CXRNER LINK platform"
   git push origin main
   ```
2. Vercel автоматически выполнит сборку `npm run build` и опубликует релиз.
3. Проверьте:
   - `https://cxrnermusic.com/link`
   - `https://link.cxrnermusic.com`
