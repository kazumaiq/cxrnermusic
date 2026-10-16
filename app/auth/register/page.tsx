"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "../../../components/Container";
import { getSupabaseBrowserClient } from "../../../lib/supabaseClient";
import { Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowLeft, Send } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [artistName, setArtistName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        <div className="dark-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl space-y-6 bg-[#0a0a0a]">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded tech-badge font-mono text-[10px] uppercase tracking-widest text-neutral-300 border border-white/15">
              <Sparkles className="w-3 h-3 text-neutral-400" />
              [CXR::REGISTER]
            </span>
            <h1 className="font-gothic text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Регистрация артиста
            </h1>
            <p className="font-sans text-xs text-neutral-400">
              Создайте профиль для отправки треков и отслеживания роялти 70/30.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 font-mono text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                Псевдоним артиста
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="KAZUMAI"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                Пароль (минимум 6 символов) *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Придумайте пароль"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-white text-xs sm:text-sm focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition"
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
              className="btn-void-primary w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-98 transition duration-200 disabled:opacity-50"
            >
              {loading ? "Создание профиля..." : "Зарегистрироваться"}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex flex-col items-center gap-3 font-mono text-xs text-neutral-400">
            <Link href="/auth/login" className="hover:text-white transition">
              Уже есть аккаунт? <strong className="text-white underline">Войти</strong>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
