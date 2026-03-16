"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "../../providers";
import Container from "../../../components/Container";
import GlowButton from "../../../components/GlowButton";

type ProfilePayload = {
  artist_name?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { supabaseClient } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseClient) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      const user = data.user;
      if (!user) throw new Error("Не удалось создать пользователя");

      const profile: ProfilePayload = {};
      if (artistName.trim()) {
        profile.artist_name = artistName.trim();
      }

      const { error: profileError } = await supabaseClient.from("cxrner_cabinet_users").upsert(
        {
          user_id: user.id,
          profile,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (profileError) throw profileError;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="section-padding flex min-h-[70vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-2xl font-semibold text-white font-display">Регистрация артиста</h1>
        <p className="mt-2 text-sm text-white/70">
          Создайте аккаунт, чтобы отправлять релизы и отслеживать статусы в кабинете.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Пароль
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Имя артиста (опционально)
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-white/40 focus:border-neon"
              placeholder="HELLBORN"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex flex-col gap-3">
            <GlowButton as="button" type="submit" disabled={loading}>
              {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
            </GlowButton>
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
}

