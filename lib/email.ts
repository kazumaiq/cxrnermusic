export interface SendEmailResult {
  sent: boolean;
  reason?: string;
  id?: string;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "RESEND_NOT_CONFIGURED" };
  }

  const from =
    process.env.EMAIL_FROM?.trim() || "CXRNER MUSIC <onboarding@resend.dev>";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        sent: false,
        reason: data?.message || `HTTP_${res.status}`,
      };
    }

    return { sent: true, id: data?.id };
  } catch (err: any) {
    return {
      sent: false,
      reason: err?.message || "NETWORK_ERROR",
    };
  }
}

function wrapEmailShell(params: {
  eyebrow: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote: string;
}): string {
  const safeUrl = params.ctaUrl || "";
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#050407;color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#0c0a12;border:1px solid rgba(168,85,247,0.35);border-radius:20px;overflow:hidden;">
    <tr>
      <td style="padding:28px 28px 18px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c084fc;font-weight:700;margin-bottom:8px;">
          ${params.eyebrow}
        </div>
        <h1 style="margin:0;font-size:22px;line-height:1.25;color:#ffffff;font-weight:800;">
          ${params.title}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#d4d4d8;">
        ${params.bodyHtml}
        ${
          params.ctaLabel && safeUrl
            ? `<div style="margin:26px 0 18px;text-align:center;">
                 <a href="${safeUrl}" style="display:inline-block;padding:13px 26px;border-radius:12px;background:linear-gradient(90deg,#7c3aed,#4f46e5);color:#ffffff;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;">
                   ${params.ctaLabel}
                 </a>
               </div>
               <div style="margin-top:12px;font-size:11px;color:#9ca3af;word-break:break-all;">
                 Если кнопка не открывается, скопируйте ссылку:<br/>
                 <a href="${safeUrl}" style="color:#c084fc;">${safeUrl}</a>
               </div>`
            : ""
        }
      </td>
    </tr>
    <tr>
      <td style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#71717a;">
        ${params.footerNote}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildWelcomeEmail(params: {
  artistName: string;
  dashboardUrl: string;
}) {
  const rawName = (params.artistName || "Артист").trim() || "Артист";
  const safeName = escapeHtml(rawName);
  return {
    subject: "Добро пожаловать в CXRNER MUSIC — ваш кабинет готов",
    html: wrapEmailShell({
      eyebrow: "CXRNER MUSIC ECOSYSTEM",
      title: `Добро пожаловать, ${safeName}!`,
      bodyHtml:
        "<p style='margin:0 0 12px;'>Ваш аккаунт артиста успешно создан и активирован.</p><p style='margin:0;'>Теперь вы можете отправлять релизы на 150+ площадок, отслеживать статус модерации и создавать смарт-ссылки CXRNER LINK.</p>",
      ctaLabel: "Открыть кабинет артиста",
      ctaUrl: params.dashboardUrl,
      footerNote: "Если вы не регистрировались на CXRNER MUSIC, просто проигнорируйте это письмо.",
    }),
    text: `Добро пожаловать в CXRNER MUSIC, ${rawName}!\n\nВаш аккаунт создан и активирован.\nОткрыть кабинет: ${params.dashboardUrl}`,
  };
}

export function buildConfirmEmail(params: {
  confirmUrl: string;
}) {
  return {
    subject: "Подтвердите Email для входа в CXRNER MUSIC",
    html: wrapEmailShell({
      eyebrow: "CXRNER MUSIC AUTH",
      title: "Подтвердите ваш Email",
      bodyHtml:
        "<p style='margin:0 0 12px;'>Нажмите на кнопку ниже, чтобы подтвердить почту и войти в личный кабинет артиста CXRNER MUSIC.</p>",
      ctaLabel: "Подтвердить Email",
      ctaUrl: params.confirmUrl,
      footerNote: "Ссылка действительна ограниченное время. Если вы не запрашивали это письмо, проигнорируйте его.",
    }),
    text: `Подтвердите ваш Email для CXRNER MUSIC:\n\n${params.confirmUrl}`,
  };
}

export function buildRecoveryEmail(params: {
  recoveryUrl: string;
}) {
  return {
    subject: "Сброс пароля — CXRNER MUSIC",
    html: wrapEmailShell({
      eyebrow: "CXRNER MUSIC SECURITY",
      title: "Восстановление доступа",
      bodyHtml:
        "<p style='margin:0 0 12px;'>Мы получили запрос на смену пароля для вашего кабинета CXRNER MUSIC.</p><p style='margin:0;'>Нажмите кнопку ниже, чтобы задать новый пароль.</p>",
      ctaLabel: "Задать новый пароль",
      ctaUrl: params.recoveryUrl,
      footerNote: "Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо — пароль останется прежним.",
    }),
    text: `Сброс пароля в CXRNER MUSIC:\n\nПерейдите по ссылке, чтобы задать новый пароль: ${params.recoveryUrl}`,
  };
}
