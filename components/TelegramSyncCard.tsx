"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Unlink,
  Smartphone,
  AlertCircle,
} from "lucide-react";

interface TelegramSyncCardProps {
  initialLinked: boolean;
  initialTelegramId?: string | null;
  initialTelegramUsername?: string | null;
}

export default function TelegramSyncCard({
  initialLinked,
  initialTelegramId,
  initialTelegramUsername,
}: TelegramSyncCardProps) {
  const router = useRouter();
  const [isLinked, setIsLinked] = useState(initialLinked);
  const [telegramId, setTelegramId] = useState(initialTelegramId);
  const [telegramUsername, setTelegramUsername] = useState(initialTelegramUsername);

  const [loading, setLoading] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>("moder_cxrner_bot");
  const [botDeepLink, setBotDeepLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkSyncStatus = useCallback(async (manual = false) => {
    if (manual) setCheckingNow(true);
    try {
      const res = await fetch("/api/cabinet/sync", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (data?.ok && data.isLinked) {
        setIsLinked(true);
        setTelegramId(data.telegramId);
        setTelegramUsername(data.telegramUsername);
        setCode(null);
        setBotDeepLink(null);
        setErrorMsg(null);
        setNotice("✓ Аккаунт успешно синхронизирован с Telegram! Обновляем список релизов...");
        router.refresh();
        return true;
      } else if (manual) {
        setNotice("Привязка ещё не завершена. Отправьте код боту в Telegram или нажмите кнопку ниже.");
      }
    } catch {
      if (manual) {
        setErrorMsg("Не удалось проверить статус синхронизации. Попробуйте ещё раз.");
      }
    } finally {
      if (manual) setCheckingNow(false);
    }
    return false;
  }, [router]);

  // Poll for status while waiting for link
  useEffect(() => {
    if (isLinked || !code) return;

    const interval = setInterval(() => {
      void checkSyncStatus(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLinked, code, checkSyncStatus]);

  async function handleGenerateCode() {
    setLoading(true);
    setNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/cabinet/sync", {
        method: "POST",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Не удалось сгенерировать код");
      }
      setCode(data.code);
      if (data.botUsername) setBotUsername(data.botUsername);
      setBotDeepLink(data.botDeepLink);
    } catch (err: any) {
      setErrorMsg(err?.message || "Ошибка генерации кода привязки");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    if (!confirm("Вы уверены, что хотите отвязать Telegram от кабинета?")) return;
    setLoading(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const res = await fetch("/api/cabinet/unlink", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Ошибка отвязки");
      setIsLinked(false);
      setTelegramId(null);
      setTelegramUsername(null);
      setCode(null);
      setBotDeepLink(null);
      setNotice("Telegram успешно отвязан от кабинета.");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || "Не удалось отвязать аккаунт");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyCommand() {
    if (!code) return;
    navigator.clipboard.writeText(`/link ${code}`);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  }

  return (
    <div className="rounded-3xl p-6 sm:p-8 border border-purple-500/25 bg-[#0b0b14]/80 backdrop-blur-xl relative overflow-hidden shadow-[0_0_35px_rgba(168,85,247,0.12)]">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-purple-300 font-semibold">
              Единый кабинет · Telegram & Mini App
            </span>
          </div>

          <h3 className="font-gothic text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
            {isLinked ? "Telegram аккаунт синхронизирован" : "Синхронизация с Telegram"}
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
            {isLinked
              ? "Ваш кабинет на сайте и бот объединены. Все релизы, отправленные через сайт, Telegram или Mini App, синхронизированы в единый список."
              : "Привяжите ваш Telegram, чтобы автоматически подтянуть все треки, отправленные через бота или Mini App, и управлять релизами из одного места."}
          </p>

          {isLinked && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{telegramUsername ? `@${telegramUsername}` : `ID: ${telegramId}`}</span>
              </div>

              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-mono text-xs transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>Открыть бота в Telegram ↗</span>
              </a>

              <button
                type="button"
                onClick={handleUnlink}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-neutral-400 hover:text-red-400 font-mono text-xs transition cursor-pointer"
              >
                <Unlink className="w-3 h-3" />
                <span>Отвязать</span>
              </button>
            </div>
          )}

          {notice && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 font-mono text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Action Column */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
          {!isLinked && !code && (
            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] active:scale-95 transition cursor-pointer disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Подготовка..." : "Привязать Telegram"}</span>
            </button>
          )}

          {!isLinked && code && (
            <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/40 space-y-3 max-w-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  Ваш код привязки:
                </span>
                <span className="font-mono text-[10px] text-purple-400 animate-pulse">
                  ожидает подтверждения...
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-mono text-lg font-black tracking-widest text-white">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
                  title="Скопировать код"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {botDeepLink && (
                <a
                  href={botDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs uppercase tracking-wider font-bold shadow-md transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Привязать через @{botUsername} ↗</span>
                </a>
              )}

              <div className="text-[11px] text-neutral-400 leading-relaxed space-y-1.5">
                <p>
                  Нажмите кнопку выше (и затем <b>Start</b> в Telegram) либо отправьте боту код{" "}
                  <code className="text-purple-300">{code}</code> или команду:
                </p>
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">
                  <code className="font-mono text-[11px] text-purple-300 select-all">
                    /link {code}
                  </code>
                  <button
                    type="button"
                    onClick={copyCommand}
                    className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                    title="Скопировать команду"
                  >
                    {copiedCmd ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => checkSyncStatus(true)}
                  disabled={checkingNow}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-[10px] uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingNow ? "animate-spin" : ""}`} />
                  <span>{checkingNow ? "Проверка..." : "Проверить статус"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-mono text-[10px] uppercase tracking-wider transition cursor-pointer"
                >
                  Новый код
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
