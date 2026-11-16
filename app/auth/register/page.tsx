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
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  LogOut,
} from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [artistName, setArtistName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [alreadyRegisteredEmail, setAlreadyRegisteredEmail] = useState<string | null>(null);
  const [successRedirecting, setSuccessRedirecting] = useState<string | null>(null);

  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const [activeSessionEmail, setActiveSessionEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const redirectTarget = sanitizeRedirectPath(searchParams.get("redirect"), "/dashboard");

  useEffect(() => {
    const initialEmail = searchParams.get("email")?.trim();
    if (initialEmail) setEmail(initialEmail);

    const urlRef = searchParams.get("ref")?.trim();
    if (urlRef) {
      setRefCode(urlRef);
      try {
        localStorage.setItem("cxrner_ref_code", urlRef);
        document.cookie = `cxrner_ref_code=${encodeURIComponent(urlRef)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {
        // ignore
      }
    } else {
      try {
        const stored = localStorage.getItem("cxrner_ref_code");
        const cookieMatch = document.cookie.match(/(?:^|; )cxrner_ref_code=([^;]+)/);
        const resolved = stored || (cookieMatch ? decodeURIComponent(cookieMatch[1]) : "");
        if (resolved) setRefCode(resolved);
      } catch {
        // ignore
      }
    }

    const errorParam = searchParams.get("error");
    const descParam = searchParams.get("description");
    if (errorParam) {
      if (errorParam === "access_denied") {
        setError("Регистрация через Google была отменена.");
      } else {
        setError(localizeAuthError(descParam || errorParam, "Ошибка регистрации через Google"));
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
    if (error && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  function navigateToTarget(target: string) {
    setTimeout(() => {
      window.location.assign(target);
    }, 250);
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
      setError("Вход через Google временно отключён. Зарегистрируйтесь по Email и паролю ниже.");
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      const activeRef = refCode.trim() || localStorage.getItem("cxrner_ref_code") || "";
      if (activeRef) {
        document.cookie = `cxrner_ref_code=${encodeURIComponent(activeRef)}; path=/; max-age=2592000; SameSite=Lax`;
      }

      const checkRes = await fetch("/api/auth/check-google", { cache: "no-store" }).catch(() => null);
      const checkData = checkRes ? await checkRes.json().catch(() => null) : null;
      if (checkData && checkData.enabled === false) {
        setGoogleEnabled(false);
        setError("Вход через Google временно отключён. Зарегистрируйтесь по Email и паролю за 15 секунд.");
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

  async function handleResendEmail() {
    if (!pendingConfirmEmail || resendCooldown > 0) return;
    setResendingEmail(true);
    setError(null);
    setResendNotice(null);

    try {
      const apiRes = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingConfirmEmail, next: redirectTarget }),
      }).catch(() => null);
      const apiData = apiRes ? await apiRes.json().catch(() => null) : null;

      if (apiRes && apiRes.ok && apiData?.ok) {
        setResendCooldown(60);
        setResendNotice(
          `Письмо отправлено повторно на ${pendingConfirmEmail}. Проверьте «Входящие» и «Спам».`
        );
        return;
      }

      const supabaseClient = getSupabaseBrowserClient();
      const { error: resendErr } = await supabaseClient.auth.resend({
        type: "signup",
        email: pendingConfirmEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
        },
      });
      if (resendErr) throw resendErr;
      setResendCooldown(60);
      setResendNotice(
        `Письмо отправлено повторно на ${pendingConfirmEmail}. Проверьте «Входящие» и «Спам».`
      );
    } catch (err: any) {
      setError(localizeAuthError(err, "Не удалось отправить письмо повторно"));
    } finally {
      setResendingEmail(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAlreadyRegisteredEmail(null);
    setResendNotice(null);

    const cleanArtist = artistName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanArtist.length < 2) {
      setError("Укажите сценический ник / имя артиста (минимум 2 символа).");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError("Укажите корректный Email-адрес (например, artist@gmail.com).");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }

    setLoading(true);

    try {
      const supabaseClient = getSupabaseBrowserClient();
      const activeRefCode =
        refCode.trim() ||
        (typeof window !== "undefined" ? localStorage.getItem("cxrner_ref_code") || "" : "").trim();

      // Step 1: Server-side instant registration when SUPABASE_SERVICE_ROLE_KEY is configured
      const serverRegRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          artistName: cleanArtist,
          refCode: activeRefCode,
        }),
      }).catch(() => null);

      const serverRegData = serverRegRes ? await serverRegRes.json().catch(() => null) : null;

      if (serverRegRes && serverRegRes.ok && serverRegData?.ok) {
        const { data: loginData, error: loginErr } = await supabaseClient.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!loginErr && loginData?.session) {
          if (activeRefCode) {
            try {
              localStorage.removeItem("cxrner_ref_code");
            } catch {
              // ignore
            }
          }
          setSuccessRedirecting(redirectTarget);
          navigateToTarget(redirectTarget);
          return;
        }

        // User already created & confirmed, avoid falling back to client signUp()
        setSuccessRedirecting(
          `/auth/login?registered=1&email=${encodeURIComponent(cleanEmail)}&redirect=${encodeURIComponent(redirectTarget)}`
        );
        navigateToTarget(
          `/auth/login?registered=1&email=${encodeURIComponent(cleanEmail)}&redirect=${encodeURIComponent(redirectTarget)}`
        );
        return;
      }

      if (serverRegData && !serverRegData.useClientSignUp && serverRegData.error) {
        if (serverRegData.alreadyExists) {
          setAlreadyRegisteredEmail(cleanEmail);
        }
        throw new Error(serverRegData.error);
      }

      // Step 2: Client signUp fallback (when server admin route reports ADMIN_UNAVAILABLE)
      const profile = {
        artist_name: cleanArtist,
        ...(activeRefCode ? { referred_by_code: activeRefCode } : {}),
      };

      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: profile,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
        },
      });

      if (signUpError) throw signUpError;

      const user = data.user;
      if (!user) {
        throw new Error("Не удалось создать аккаунт. Попробуйте ещё раз.");
      }

      // Detect Supabase anti-enumeration empty identities when email already exists
      if (Array.isArray(user.identities) && user.identities.length === 0) {
        setAlreadyRegisteredEmail(cleanEmail);
        throw new Error(
          `Аккаунт с почтой ${cleanEmail} уже зарегистрирован. Перейдите ко входу или восстановите пароль.`
        );
      }

      if (data.session) {
        try {
          const { data: existingRow } = await supabaseClient
            .from("cxrner_cabinet_users")
            .select("profile")
            .eq("user_id", user.id)
            .maybeSingle();

          await supabaseClient.from("cxrner_cabinet_users").upsert(
            {
              user_id: user.id,
              profile: { ...((existingRow?.profile as Record<string, any>) || {}), ...profile, email: cleanEmail },
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch {
          // non-fatal
        }

        if (activeRefCode) {
          const trackRes = await fetch("/api/referral/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode: activeRefCode }),
          }).catch(() => null);
          if (trackRes?.ok) {
            try {
              localStorage.removeItem("cxrner_ref_code");
            } catch {
              // ignore
            }
          }
        }

        setSuccessRedirecting(redirectTarget);
        navigateToTarget(redirectTarget);
        return;
      }

      // Confirmation email required: replace form with dedicated confirmation screen
      setPendingConfirmEmail(cleanEmail);
      setResendCooldown(60);
    } catch (err: any) {
      setError(localizeAuthError(err, "Ошибка регистрации"));
    } finally {
      setLoading(false);
    }
  }

  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectTarget)}${
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
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

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
                НОВЫЙ АРТИСТ
              </span>
            </div>
            <h1 className="font-gothic text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Регистрация
            </h1>
            <p className="font-sans text-xs text-neutral-400">
              Создайте кабинет артиста для дистрибуции и смарт-ссылок.
            </p>
          </div>

          {successRedirecting ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-gothic text-lg font-bold text-white uppercase">
                  Аккаунт успешно создан!
                </h2>
                <p className="font-mono text-xs text-emerald-200">
                  Выполняем вход и открываем кабинет артиста...
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign(successRedirecting)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Открыть кабинет сейчас</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : pendingConfirmEmail ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="font-mono text-xs uppercase tracking-wider font-bold text-emerald-200">
                      Аккаунт создан • подтвердите Email
                    </h2>
                    <p className="font-sans text-xs text-neutral-200 leading-relaxed">
                      Мы отправили письмо со ссылкой подтверждения на{" "}
                      <strong className="text-white break-all">{pendingConfirmEmail}</strong>.
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 pl-8 font-mono text-[11px] text-neutral-300 list-disc">
                  <li>Откройте письмо и перейдите по кнопке подтверждения.</li>
                  <li>Обязательно проверьте папки «Спам» и «Промоакции».</li>
                </ul>
              </div>

              {resendNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resendNotice}</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 font-mono text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendingEmail || resendCooldown > 0}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendingEmail ? "animate-spin" : ""}`} />
                  <span>
                    {resendingEmail
                      ? "Отправляем письмо..."
                      : resendCooldown > 0
                      ? `Повторить через ${resendCooldown} сек.`
                      : "Отправить письмо повторно"}
                  </span>
                </button>

                <Link
                  href={`/auth/login?email=${encodeURIComponent(pendingConfirmEmail)}&redirect=${encodeURIComponent(redirectTarget)}`}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2"
                >
                  <span>Я подтвердил почту — Войти</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setPendingConfirmEmail(null);
                    setError(null);
                    setResendNotice(null);
                  }}
                  className="w-full py-2 font-mono text-[11px] text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Указать другой Email
                </button>
              </div>
            </div>
          ) : !checkingSession && activeSessionEmail ? (
            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-400/35 space-y-4 text-center">
              <div className="space-y-1">
                <div className="font-mono text-[11px] uppercase tracking-wider text-purple-300">
                  Активная сессия найдена
                </div>
                <p className="font-sans text-xs text-neutral-200">
                  Вы уже вошли как <strong className="text-white">{activeSessionEmail}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign(redirectTarget)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Перейти в кабинет</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSignOutCurrent}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 font-mono text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти и создать другой аккаунт</span>
              </button>
            </div>
          ) : (
            <>
              {refCode && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 font-mono text-xs flex items-center justify-between gap-2">
                  <span>Реферальный код активирован:</span>
                  <strong className="text-white tracking-wider">{refCode}</strong>
                </div>
              )}

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
                    <span>{googleLoading ? "Подключение к Google..." : "Регистрация через Google"}</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative px-3 bg-[#0a0a0e] font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                      или по email
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center font-mono text-[11px] text-neutral-400">
                  Регистрация по Email и паролю (занимает 15 секунд)
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Псевдоним / Имя артиста
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      autoComplete="nickname"
                      value={artistName}
                      onChange={(e) => {
                        setArtistName(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Ваш сценический ник"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
                    />
                  </div>
                </div>

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
                        if (alreadyRegisteredEmail) setAlreadyRegisteredEmail(null);
                      }}
                      placeholder="artist@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Минимум 6 символов"
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

                <div ref={feedbackRef}>
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 text-red-200 font-mono text-xs space-y-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span>{error}</span>
                      </div>
                      {alreadyRegisteredEmail && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <Link
                            href={`/auth/login?email=${encodeURIComponent(alreadyRegisteredEmail)}&redirect=${encodeURIComponent(redirectTarget)}`}
                            className="flex-1 py-2 px-3 rounded-lg bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/40 text-white text-center font-bold uppercase text-[10px] tracking-wider transition"
                          >
                            Войти с этим Email
                          </Link>
                          <Link
                            href={`/auth/login?mode=forgot&email=${encodeURIComponent(alreadyRegisteredEmail)}&redirect=${encodeURIComponent(redirectTarget)}`}
                            className="flex-1 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 text-center font-bold uppercase text-[10px] tracking-wider transition"
                          >
                            Сбросить пароль
                          </Link>
                        </div>
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
                  <span>{loading ? "Создаём аккаунт..." : "Зарегистрироваться"}</span>
                </button>
              </form>

              <div className="pt-4 border-t border-white/10 text-center font-mono text-xs text-neutral-400">
                Уже есть аккаунт?{" "}
                <Link href={loginHref} className="text-purple-400 hover:text-purple-300 transition font-bold underline">
                  Войти в кабинет
                </Link>
              </div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050407]" />}>
      <RegisterForm />
    </Suspense>
  );
}
