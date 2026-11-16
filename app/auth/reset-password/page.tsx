"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "../../../components/Container";
import { getSupabaseBrowserClient } from "../../../lib/supabaseClient";
import { localizeAuthError } from "../../../lib/authUtils";
import {
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function initRecovery() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code).catch(() => {});
        }
        const { data } = await supabase.auth.getUser();
        if (active) setHasSession(Boolean(data?.user));
      } catch {
        // ignore
      } finally {
        if (active) setChecking(false);
      }
    }

    initRecovery();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setHasSession(true);
        setChecking(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Новый пароль должен содержать минимум 6 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      setDone(true);
      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 350);
    } catch (err: any) {
      setError(localizeAuthError(err, "Не удалось обновить пароль"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-padding pt-28 sm:pt-36 flex min-h-[82vh] items-center justify-center">
      <Container className="max-w-md w-full">
        <div className="mb-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ко входу
          </Link>
        </div>

        <div className="rounded-3xl p-7 sm:p-9 border border-purple-500/25 shadow-2xl space-y-6 bg-[#0a0a0e]/95 backdrop-blur-xl relative overflow-hidden">
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
                БЕЗОПАСНОСТЬ
              </span>
            </div>
            <h1 className="font-gothic text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Новый пароль
            </h1>
            <p className="font-sans text-xs text-neutral-400">
              Задайте новый пароль для входа в ваш кабинет артиста.
            </p>
          </div>

          {done ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-gothic text-lg font-bold text-white uppercase">
                  Пароль обновлён!
                </h2>
                <p className="font-mono text-xs text-emerald-200">
                  Переходим в кабинет артиста...
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign("/dashboard")}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Открыть кабинет</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : checking ? (
            <div className="py-8 text-center font-mono text-xs text-neutral-400">
              Проверяем сессию восстановления...
            </div>
          ) : !hasSession ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 font-mono text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>
                  Ссылка для сброса пароля устарела или уже использована. Запросите новую ссылку.
                </span>
              </div>
              <Link
                href="/auth/login?mode=forgot"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-xs uppercase tracking-widest font-bold transition flex items-center justify-center"
              >
                Запросить новую ссылку
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                  Новый пароль
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                  Повторите пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Повторите новый пароль"
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
                <span>{loading ? "Сохраняем..." : "Сохранить новый пароль"}</span>
              </button>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050407]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
