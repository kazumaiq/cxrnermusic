"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Key, Mail } from "lucide-react";
import Link from "next/link";

export default function AdminLoginForm({
  defaultEmail = "cxrner.label@gmail.com",
  redirectUrl = "/admin/distribution",
}: {
  defaultEmail?: string;
  redirectUrl?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Неверный логин или пароль");
      }

      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050407] text-white flex flex-col items-center justify-center p-4 selection:bg-[#8737FF] selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-[radial-gradient(circle,rgba(135,55,255,0.18),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#090611]/90 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-[0_0_60px_rgba(135,55,255,0.2)]">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#8737FF]/20 border border-[#8737FF]/40 flex items-center justify-center text-[#B46BFF] mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="font-heavy text-2xl uppercase tracking-tight text-white">
            CXRNER CMS // ACCESS
          </h1>
          <p className="font-mono text-xs text-[#D9D9E2]/60">
            Закрытая панель модерации и дистрибуции CXRNER MUSIC.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/35 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-white/50 block mb-1.5">
              Email администратора:
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white font-mono placeholder:text-white/30 focus:border-[#8737FF] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-white/50 block mb-1.5">
              Пароль или ключ доступа:
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white font-mono placeholder:text-white/30 focus:border-[#8737FF] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#8737FF] hover:bg-[#7025e0] text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-[0_0_25px_rgba(135,55,255,0.4)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Проверка доступа...</span>
            ) : (
              <>
                <span>Войти в систему</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
