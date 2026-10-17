"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Container from "../../../components/Container";
import { getSupabaseBrowserClient } from "../../../lib/supabaseClient";
import { Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [artistName, setArtistName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = getSupabaseBrowserClient();
      const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message ?? "Ошибка авторизации через Google");
      setLoading(false);
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
          "Supabase не настроен на сайте. Укажите NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в Vercel или .env.local.",
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
          { onConflict: "user_id" },
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
                РЕГИСТРАЦИЯ АРТИСТА
              </span>
            </div>
            <h1 className="font-gothic text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Создать профиль
            </h1>
            <p className="font-sans text-xs text-neutral-400">
              Понятная платформа для дистрибуции, загрузки треков и официальных выплат.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 font-mono text-xs">
              {error}
            </div>
          )}

          {/* Quick Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-xs sm:text-sm transition duration-200 shadow-md active:scale-98"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Регистрация через Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0a0a0e] font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
              или заполните анкету
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                Псевдоним артиста
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Ваш никнейм"
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
                  placeholder="Минимум 6 символов"
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
              Войти
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
