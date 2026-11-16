export function isValidEmail(email: string): boolean {
  const clean = email.trim();
  if (!clean || clean.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean);
}

export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  const value = String(raw || "").trim();
  if (!value) return fallback;
  // Disallow protocol-relative or external URLs
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Avoid auth loop redirects
  if (
    value === "/auth/login" ||
    value.startsWith("/auth/login?") ||
    value === "/auth/register" ||
    value.startsWith("/auth/register?") ||
    value.startsWith("/auth/callback") ||
    value.startsWith("/auth/logout")
  ) {
    return fallback;
  }
  return value;
}

export function buildCanonicalOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv =
    process.env.NODE_ENV === "development" ||
    requestUrl.hostname === "localhost" ||
    requestUrl.hostname === "127.0.0.1";

  if (isLocalEnv) {
    return requestUrl.origin;
  }
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return requestUrl.origin;
}

export function localizeAuthError(err: unknown, fallback = "Произошла ошибка авторизации"): string {
  if (!err) return fallback;
  const anyErr = err as { message?: string; code?: string; status?: number };
  const rawMsg = String(anyErr?.message || (typeof err === "string" ? err : "")).trim();
  const code = String(anyErr?.code || "").toLowerCase();
  const lower = rawMsg.toLowerCase();

  if (!rawMsg) return fallback;

  if (
    code === "invalid_credentials" ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Неверный email или пароль. Проверьте данные, нажмите «Забыли пароль?» или зарегистрируйтесь.";
  }

  if (code === "email_not_confirmed" || lower.includes("email not confirmed")) {
    return "Ваш Email ещё не подтверждён. Проверьте «Входящие» и «Спам» или отправьте письмо повторно ниже.";
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    lower.includes("already exists")
  ) {
    return "Аккаунт с этим Email уже зарегистрирован. Перейдите ко входу или восстановите пароль.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("for security purposes, you can only request this after")
  ) {
    const secMatch = rawMsg.match(/after\s+(\d+)\s+second/i);
    if (secMatch) {
      return `Слишком частые запросы. Подождите ${secMatch[1]} сек. и попробуйте снова.`;
    }
    return "Превышен лимит отправки писем. Подождите 1–2 минуты перед повторной попыткой.";
  }

  if (
    code === "weak_password" ||
    lower.includes("password should be at least") ||
    lower.includes("signup requires a valid password")
  ) {
    return "Пароль должен содержать минимум 6 символов.";
  }

  if (lower.includes("same password") || lower.includes("different from the old password")) {
    return "Новый пароль должен отличаться от старого.";
  }

  if (
    code === "validation_failed" ||
    lower.includes("unable to validate email") ||
    lower.includes("invalid email") ||
    lower.includes("email address") && lower.includes("invalid")
  ) {
    return "Укажите корректный Email-адрес (например, artist@gmail.com).";
  }

  if (
    code === "otp_expired" ||
    lower.includes("expired") ||
    lower.includes("invalid") && lower.includes("token") ||
    lower.includes("email link is invalid")
  ) {
    return "Ссылка подтверждения или восстановления устарела или уже использована. Запросите новое письмо.";
  }

  if (lower.includes("signups not allowed")) {
    return "Регистрация по Email временно ограничена на стороне сервера.";
  }

  if (lower.includes("provider is not enabled")) {
    return "Вход через Google временно отключён. Используйте вход по Email и паролю.";
  }

  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("fetch failed")) {
    return "Ошибка сети при подключении к серверу авторизации. Проверьте интернет и попробуйте снова.";
  }

  if (lower.includes("api key")) {
    return "Сервер авторизации временно недоступен (ошибка ключа API).";
  }

  return rawMsg;
}
