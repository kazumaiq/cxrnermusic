"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Container from "../../../components/Container";
import { getSupabaseBrowserClient } from "../../../lib/supabaseClient";
import { Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowLeft, AlertCircle, Settings, ExternalLink, X } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [artistName, setArtistName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleHelpModal, setShowGoogleHelpModal] = useState(false);
  const [googleConfigStatus, setGoogleConfigStatus] = useState<any>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const descParam = searchParams.get("description");

    if (errorParam) {
      if (errorParam === "access_denied") {
        setError("Регистрация через Google была отменена пользователем.");
      } else {
        setError(`Ошибка регистрации через Google: ${descParam || errorParam}`);
      }
    }
  }, [searchParams]);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);

    try {
      // 1. Proactively probe Google Provider status to avoid raw 400 Bad Request page
      const checkRes = await fetch("/api/auth/check-google").catch(() => null);
      const checkData = checkRes ? await checkRes.json().catch(() => null) : null;

      if (checkData && checkData.enabled === false) {
        setGoogleConfigStatus(checkData);
        setShowGoogleHelpModal(true);
        setGoogleLoading(false);
        return;
      }

      // 2. Direct Supabase OAuth redirect
      const supabaseClient = getSupabaseBrowserClient();
      const redirectUri = `${window.location.origin}/auth/callback`;

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

      if (oauthError) {
        throw oauthError;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("[Google SignUp] Error:", err);
      setError(err.message ?? "Ошибка авторизации через Google");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let supabaseClient;
      try {
        supabaseClient = getSupabaseBrowserClient();
      } catch {
        throw new Error(
          "Supabase не настроен на сайте. Укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в Vercel или .env.local."
        );
      }

      const profile = {
        artist_name: artistName.trim() || undefined,
      };

      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
        options: { data: profile },
      });

      if (signUpError) throw signUpError;
      const user = data.user;
      if (!user) throw new Error("Не удалось создать пользователя.");

      if (data.session) {
        await supabaseClient.from("cxrner_cabinet_users").upsert(
          { user_id: user.id, profile, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        router.push("/dashboard");
      } else {
        router.push("/auth/login?registered=1");
      }
    } catch (err: any) {
      setError(err.message ?? "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="section-padding pt-28 sm:pt-36 flex min-h-[80vh] items-center justify-center">
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

          <div className="rounded-3xl p-8 sm:p-10 border border-purple-500/20 shadow-2xl space-y-6 bg-[#0a0a0e]/95 backdrop-blur-xl relative overflow-hidden">
            {/* Ambient Purple Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 relative flex items-center justify-center p-2 rounded-2xl bg-black/60 border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
                <Image
                  src="/logo.png"
                  alt="CXRNER MUSIC"
                  width={56}
                  height={56}
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
                Создайте профиль артиста для доступа к дистрибуции и смарт-ссылкам.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 font-mono text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs sm:text-sm transition duration-200 shadow-md active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{googleLoading ? "Подключение..." : "Регистрация через Google"}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 bg-[#0a0a0e] font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                или по email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                  Псевдоним / Имя артиста
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (минимум 6 символов)"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-98 transition disabled:opacity-50"
              >
                {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
              </button>
            </form>

            <div className="pt-4 border-t border-white/10 text-center font-mono text-xs text-neutral-400">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 transition font-bold underline">
                Войти в кабинет
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Google Setup Guide Modal (shown if provider not enabled in Supabase) */}
      {showGoogleHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0e0a16] border border-purple-500/40 p-6 sm:p-7 shadow-[0_0_50px_rgba(135,55,255,0.25)] space-y-5">
            <button
              onClick={() => setShowGoogleHelpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Settings className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-gothic text-lg font-bold text-white uppercase">
                  Настройка входа через Google
                </h3>
                <p className="font-mono text-[11px] text-neutral-400">
                  Инструкция по активации провайдера в Supabase
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
              Вход через Google ожидает сохранения ключей в панели Supabase. Вы можете зарегистрироваться по Email и паролю за 10 секунд.
            </div>

            <div className="space-y-3 font-mono text-xs text-neutral-300">
              <p className="font-semibold text-white uppercase text-[11px] tracking-wider">
                Чтобы включить вход Google:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-neutral-300">
                <li className="leading-relaxed">
                  Откройте{" "}
                  <a
                    href="https://supabase.com/dashboard/project/wjhqtrfsuudiogpwwzgx/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline inline-flex items-center gap-1 hover:text-purple-300"
                  >
                    Supabase Providers <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  и выберите <b>Google</b>.
                </li>
                <li className="leading-relaxed">
                  Переведите переключатель в положение <b>ON</b>.
                </li>
                <li className="leading-relaxed">
                  Вставьте <b>Client ID</b> и <b>Client Secret</b> из Google Cloud Console.
                </li>
                <li className="leading-relaxed">
                  В Google Cloud в Authorized redirect URI укажите:
                  <code className="block mt-1 p-2 rounded bg-black/60 border border-white/10 text-[10px] text-purple-300 select-all break-all">
                    {googleConfigStatus?.callbackUrl || "https://wjhqtrfsuudiogpwwzgx.supabase.co/auth/v1/callback"}
                  </code>
                </li>
              </ol>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowGoogleHelpModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-xs uppercase font-bold tracking-wider hover:opacity-95 transition"
              >
                Понятно, зарегистрируюсь по Email
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050407]" />}>
      <RegisterForm />
    </Suspense>
  );
}
