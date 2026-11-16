"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Container from "../../../components/Container";
import { getSupabaseBrowserClient } from "../../../lib/supabaseClient";
import { isValidEmail, localizeAuthError, sanitizeRedirectPath } from "../../../lib/authUtils";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ArrowRight,
  LogOut,
} from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [successRedirecting, setSuccessRedirecting] = useState<string | null>(null);

  const [needsConfirmationEmail, setNeedsConfirmationEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);

  const [activeSessionEmail, setActiveSessionEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const redirectTarget = sanitizeRedirectPath(searchParams.get("redirect"), "/dashboard");

  useEffect(() => {
    const initialEmail = searchParams.get("email")?.trim();
    if (initialEmail) setEmail(initialEmail);

    if (searchParams.get("mode") === "forgot") {
      setMode("forgot");
    }

    const errorParam = searchParams.get("error");
    const descParam = searchParams.get("description");
    const registeredParam = searchParams.get("registered");
    const resetParam = searchParams.get("reset");

    if (registeredParam) {
      setNotice("Аккаунт успешно создан! Войдите, используя свой email и пароль.");
    } else if (resetParam === "1") {
      setNotice("Пароль успешно обновлён! Войдите с новым паролем.");
    }

    if (errorParam) {
      if (errorParam === "access_denied") {
        setError("Авторизация через Google была отменена.");
      } else if (errorParam === "code_exchange_failed" || errorParam === "otp_verification_failed") {
        setError(localizeAuthError(descParam || errorParam, "Не удалось подтвердить ссылку входа. Попробуйте снова."));
      } else if (errorParam === "oauth_failed") {
        setError("Не удалось войти через Google. Используйте вход по Email и паролю.");
      } else if (errorParam === "missing_code") {
        setError("Ссылка авторизации неполная или устарела. Войдите по Email и паролю.");
      } else {
        setError(localizeAuthError(descParam || errorParam, "Ошибка авторизации"));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        if (data?.user?.email && searchParams.get("switch") !== "1") {
          setActiveSessionEmail(data.user.email);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/check-google", { cache: "no-store" })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (active && data && typeof data.enabled === "boolean") {
          setGoogleEnabled(data.enabled);
        }
      })
      .catch(() => {
        if (active) setGoogleEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if ((error || notice) && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error, notice]);

  function navigateToTarget(target: string) {
    setTimeout(() => {
      window.location.assign(target);
    }, 220);
  }

  async function handleSignOutCurrent() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setActiveSessionEmail(null);
  }

  async function handleGoogleSignIn() {
    if (googleEnabled === false) {
      setError("Вход через Google временно отключён. Войдите по Email и паролю ниже.");
      return;
    }

    setGoogleLoading(true);
    setError(null);
    setNotice(null);

    try {
      const checkRes = await fetch("/api/auth/check-google", { cache: "no-store" }).catch(() => null);
      const checkData = checkRes ? await checkRes.json().catch(() => null) : null;

      if (checkData && checkData.enabled === false) {
        setGoogleEnabled(false);
        setError("Вход через Google временно отключён. Используйте вход по Email и паролю.");
        setGoogleLoading(false);
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`;
      const supabaseClient = getSupabaseBrowserClient();
      const { data, error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (oauthError) throw oauthError;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(localizeAuthError(err, "Ошибка авторизации через Google"));
      setGoogleLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!needsConfirmationEmail || resendCooldown > 0) return;
    setResendingEmail(true);
    setError(null);

    try {
      const apiRes = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: needsConfirmationEmail, next: redirectTarget }),
      }).catch(() => null);
      const apiData = apiRes ? await apiRes.json().catch(() => null) : null;

      if (apiRes && apiRes.ok && apiData?.ok) {
        setResendCooldown(60);
        setNotice(
          `Письмо подтверждения повторно отправлено на ${needsConfirmationEmail}. Проверьте «Входящие» и «Спам».`
        );
        return;
      }

      const supabaseClient = getSupabaseBrowserClient();
      const { error: resendErr } = await supabaseClient.auth.resend({
        type: "signup",
        email: needsConfirmationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
        },
      });
      if (resendErr) throw resendErr;
      setResendCooldown(60);
      setNotice(
        `Письмо подтверждения повторно отправлено на ${needsConfirmationEmail}. Проверьте «Входящие» и «Спам».`
      );
    } catch (err: any) {
      setError(localizeAuthError(err, "Не удалось отправить письмо повторно. Попробуйте чуть позже."));
    } finally {
      setResendingEmail(false);
    }
  }

  async function sendResetEmailRequest() {
    setError(null);
    setNotice(null);

    const cleanEmail = (resetSentEmail || email).trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError("Укажите корректный Email-адрес, на который зарегистрирован аккаунт.");
      return;
    }

    setLoading(true);
    try {
      const serverRes = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      }).catch(() => null);
      const serverData = serverRes ? await serverRes.json().catch(() => null) : null;

      if (serverRes && serverRes.ok && serverData?.ok) {
        setResetSentEmail(cleanEmail);
        setResendCooldown(60);
        return;
      }

      if (serverData && !serverData.useClientReset && serverData.error) {
        throw new Error(serverData.error);
      }

      const supabaseClient = getSupabaseBrowserClient();
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
      });
      if (resetError) throw resetError;

      setResetSentEmail(cleanEmail);
      setResendCooldown(60);
    } catch (err: any) {
      setError(localizeAuthError(err, "Не удалось отправить письмо для сброса пароля"));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendResetEmailRequest();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setNeedsConfirmationEmail(null);

    const cleanEmail = email.trim().toLowerCase();
    const rawPassword = password;
    const trimmedPassword = password.trim();

    if (!isValidEmail(cleanEmail)) {
      setError("Укажите корректный Email-адрес.");
      return;
    }
    if (!rawPassword) {
      setError("Введите пароль.");
      return;
    }

    setLoading(true);

    try {
      const supabaseClient = getSupabaseBrowserClient();

      // 1. Standard Supabase sign in (try exact password first, then trimmed if different)
      let signInRes = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: rawPassword,
      });

      if (signInRes.error && trimmedPassword && trimmedPassword !== rawPassword) {
        const retryRes = await supabaseClient.auth.signInWithPassword({
          email: cleanEmail,
          password: trimmedPassword,
        });
        if (!retryRes.error) {
          signInRes = retryRes;
        }
      }

      const { data, error: signInError } = signInRes;

      if (!signInError && data?.session) {
        try {
          const urlRef = searchParams.get("ref")?.trim();
          const storedRef = localStorage.getItem("cxrner_ref_code")?.trim();
          const cookieMatch = document.cookie.match(/(?:^|; )cxrner_ref_code=([^;]+)/);
          const pendingRef = urlRef || storedRef || (cookieMatch ? decodeURIComponent(cookieMatch[1]) : "");
          if (pendingRef) {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), 1200);
            const trackRes = await fetch("/api/referral/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referralCode: pendingRef }),
              signal: controller.signal,
            })
              .catch(() => null)
              .finally(() => clearTimeout(t));
            if (trackRes?.ok) {
              localStorage.removeItem("cxrner_ref_code");
            }
          }
        } catch {
          // ignore
        }

        setSuccessRedirecting(redirectTarget);
        navigateToTarget(redirectTarget);
        return;
      }

      // 2. Check Admin Master Key fast-path without duplicating Supabase login call
      const adminAuthRes = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: trimmedPassword,
          skipSupabase: true,
        }),
      }).catch(() => null);

      if (adminAuthRes && adminAuthRes.ok) {
        const adminData = await adminAuthRes.json().catch(() => null);
        if (adminData?.ok) {
          setSuccessRedirecting("/admin/distribution");
          navigateToTarget("/admin/distribution");
          return;
        }
      }

      // 3. Localized error feedback
      if (signInError) {
        const msg = signInError.message || "";
        const code = String((signInError as any).code || "").toLowerCase();
        if (msg.toLowerCase().includes("email not confirmed") || code === "email_not_confirmed") {
          setNeedsConfirmationEmail(cleanEmail);
        }
        throw new Error(localizeAuthError(signInError));
      }

      setSuccessRedirecting(redirectTarget);
      navigateToTarget(redirectTarget);
    } catch (err: any) {
      setError(localizeAuthError(err, "Ошибка входа"));
    } finally {
      setLoading(false);
    }
  }

  const registerHref = `/auth/register?redirect=${encodeURIComponent(redirectTarget)}${
    email.trim() ? `&email=${encodeURIComponent(email.trim().toLowerCase())}` : ""
  }`;

  return (
    <div className="section-padding pt-28 sm:pt-36 flex min-h-[82vh] items-center justify-center">
      <Container className="max-w-md w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            На главную
          </Link>
        </div>

        <div className="rounded-3xl p-7 sm:p-9 border border-purple-500/25 shadow-2xl space-y-6 bg-[#0a0a0e]/95 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 relative flex items-center justify-center p-2 rounded-2xl bg-black/60 border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
              <Image
                src="/logo.png"
                alt="CXRNER MUSIC"
                width={52}
                height={52}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest text-purple-300 border border-purple-500/30 bg-purple-500/10">
                <Sparkles className="w-3 h-3 text-purple-400" />
                {mode === "forgot" ? "ВОССТАНОВЛЕНИЕ ДОСТУПА" : "КАБИНЕТ АРТИСТА"}
              </span>
            </div>
            <h1 className="font-gothic text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {mode === "forgot" ? "Сброс пароля" : "Вход в аккаунт"}
            </h1>
            <p className="font-sans text-xs text-neutral-400">
              {mode === "forgot"
                ? "Укажите Email — отправим ссылку для задания нового пароля."
                : "Отслеживайте модерацию релизов, UPC/ISRC и роялти 70/30."}
            </p>
          </div>

          {successRedirecting ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-gothic text-lg font-bold text-white uppercase">
                  Вход выполнен!
                </h2>
                <p className="font-mono text-xs text-emerald-200">
                  Загружаем ваш кабинет...
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign(successRedirecting)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Открыть сейчас</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : mode === "forgot" ? (
            resetSentEmail ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-mono text-xs font-bold uppercase text-emerald-200">
                        Письмо отправлено
                      </div>
                      <p className="font-sans text-xs text-neutral-200 leading-relaxed">
                        Ссылка для сброса пароля отправлена на{" "}
                        <strong className="text-white break-all">{resetSentEmail}</strong>. Проверьте «Входящие» и «Спам».
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 font-mono text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={() => sendResetEmailRequest()}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>
                    {loading
                      ? "Отправляем..."
                      : resendCooldown > 0
                      ? `Повторить через ${resendCooldown} сек.`
                      : "Отправить повторно"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setResetSentEmail(null);
                    setError(null);
                  }}
                  className="w-full py-2.5 font-mono text-xs text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Вернуться ко входу
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Email аккаунта
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="artist@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 text-red-200 font-mono text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-[0.98] transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? "Отправляем..." : "Отправить ссылку сброса"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="w-full py-2 font-mono text-xs text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Назад ко входу по паролю
                </button>
              </form>
            )
          ) : !checkingSession && activeSessionEmail ? (
            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-400/35 space-y-4 text-center">
              <div className="space-y-1">
                <div className="font-mono text-[11px] uppercase tracking-wider text-purple-300">
                  Вы уже в системе
                </div>
                <p className="font-sans text-xs text-neutral-200">
                  Аккаунт: <strong className="text-white">{activeSessionEmail}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign(redirectTarget)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Открыть кабинет</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSignOutCurrent}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-mono text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Войти в другой аккаунт</span>
              </button>
            </div>
          ) : (
            <>
              {googleEnabled === true ? (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs sm:text-sm transition duration-200 shadow-md active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {googleLoading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>{googleLoading ? "Подключение к Google..." : "Войти через Google"}</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative px-3 bg-[#0a0a0e] font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                      или по почте
                    </span>
                  </div>
                </>
              ) : null}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="artist@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                      Пароль
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                        setNotice(null);
                      }}
                      className="font-mono text-[11px] text-purple-400 hover:text-purple-300 transition cursor-pointer"
                    >
                      Забыли пароль?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div ref={feedbackRef} className="space-y-3">
                  {notice && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{notice}</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 text-red-200 font-mono text-xs space-y-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span>{error}</span>
                      </div>
                      {needsConfirmationEmail && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resendingEmail || resendCooldown > 0}
                          className="w-full py-2 px-3 rounded-lg bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/40 text-white font-bold uppercase tracking-wider text-[10px] transition cursor-pointer disabled:opacity-50"
                        >
                          {resendingEmail
                            ? "Отправляем..."
                            : resendCooldown > 0
                            ? `Повторить через ${resendCooldown} сек.`
                            : "Отправить письмо подтверждения повторно"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-[0.98] transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{loading ? "Выполняем вход..." : "Войти в кабинет"}</span>
                </button>
              </form>

              <div className="pt-4 border-t border-white/10 text-center font-mono text-xs text-neutral-400">
                Нет аккаунта?{" "}
                <Link href={registerHref} className="text-purple-400 hover:text-purple-300 transition font-bold underline">
                  Зарегистрироваться
                </Link>
              </div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050407]" />}>
      <LoginForm />
    </Suspense>
  );
}
