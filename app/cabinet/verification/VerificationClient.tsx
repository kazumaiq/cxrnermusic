"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Key,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Send,
  HelpCircle,
} from "lucide-react";
import type { CxrnerProfile, CxrnerArtistProfile, CxrnerArtistVerification } from "@/lib/ecosystemTypes";

interface VerificationClientProps {
  profile: CxrnerProfile | null;
  artistProfile: CxrnerArtistProfile | null;
  initialVerification: CxrnerArtistVerification | null;
}

export default function VerificationClient({
  profile,
  artistProfile,
  initialVerification,
}: VerificationClientProps) {
  const [verification, setVerification] = useState<CxrnerArtistVerification | null>(initialVerification);
  const [method, setMethod] = useState<"oauth" | "code" | "manual">("code");
  const [stageName, setStageName] = useState(artistProfile?.stage_name || profile?.display_name || "");
  const [dspUrl1, setDspUrl1] = useState(artistProfile?.spotify_url || "");
  const [dspUrl2, setDspUrl2] = useState(artistProfile?.yandex_music_url || "");
  const [socialUrl, setSocialUrl] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [verificationCode, setVerificationCode] = useState(
    initialVerification?.verification_code || "CXRNER-7492"
  );
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const status = verification?.status || (profile?.is_artist_verified ? "verified" : "not_verified");

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch("/api/cabinet/verification?action=generate_code");
      const data = await res.json();
      if (data.ok && data.code) {
        setVerificationCode(data.code);
      }
    } catch {
      // ignore
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    const evidenceLinks = [
      dspUrl1 ? { title: "Основная карточка артиста", url: dspUrl1 } : null,
      dspUrl2 ? { title: "Вторая площадка", url: dspUrl2 } : null,
      socialUrl ? { title: "Официальная соцсеть", url: socialUrl } : null,
    ].filter(Boolean);

    try {
      const res = await fetch("/api/cabinet/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageName,
          method,
          verificationCode: method === "code" ? verificationCode : null,
          evidenceLinks,
          evidenceNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotice({ type: "error", text: data.error || "Ошибка отправки заявки" });
        return;
      }

      setVerification(data.application);
      setNotice({
        type: "success",
        text: "Заявка на верификацию успешно отправлена на проверку модераторам CXRNER!",
      });
    } catch {
      setNotice({ type: "error", text: "Ошибка сети при отправке" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#B46BFF] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
            <span>ARTIST NETWORK // ВЕРИФИКАЦИЯ</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
            Верификация Артиста
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D9E2]/60 mt-0.5">
            Подтвердите владение артистическими площадками для получения официального статуса CXRNER VERIFIED.
          </p>
        </div>

        {status === "verified" ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CXRNER VERIFIED ARTIST</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 text-[#D9D9E2]/70 font-mono text-xs">
            <Clock className="w-4 h-4 text-[#B46BFF]" />
            <span>Статус: {status.toUpperCase()}</span>
          </div>
        )}
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 font-sans text-xs sm:text-sm ${
            notice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Benefits Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#160B28] via-[#090611] to-[#12081C] border border-[#B46BFF]/30 shadow-xl space-y-4">
        <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00F0FF]" />
          <span>Что даёт подтверждение артистического профиля:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[#00F0FF] font-bold mb-1">CXRNER VERIFIED</div>
            <div className="text-[#D9D9E2]/70 text-[11px] font-sans">
              Официальный бейдж верификации в вашем личном профиле и каталоге артистов.
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[#B46BFF] font-bold mb-1">+100 CXP & ДОСТИЖЕНИЕ</div>
            <div className="text-[#D9D9E2]/70 text-[11px] font-sans">
              Награда 100 CXP и разблокировка редкого достижения «VERIFIED ARTIST».
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-emerald-400 font-bold mb-1">ПРИОРИТЕТ МОДЕРАЦИИ</div>
            <div className="text-[#D9D9E2]/70 text-[11px] font-sans">
              Ускоренная отгрузка ваших будущих релизов на стриминги и в смарт-ссылки.
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status Banner if pending / rejected / needs info */}
      {verification && (
        <div
          className={`p-6 rounded-3xl border space-y-2 ${
            verification.status === "verified"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : verification.status === "pending"
              ? "bg-blue-500/10 border-blue-500/30"
              : verification.status === "needs_info"
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold">
              {verification.status === "verified" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {verification.status === "pending" && <Clock className="w-4 h-4 text-blue-400 animate-spin" />}
              {verification.status === "needs_info" && <HelpCircle className="w-4 h-4 text-amber-400" />}
              {verification.status === "rejected" && <XCircle className="w-4 h-4 text-red-400" />}
              <span>Статус заявки: {verification.status.toUpperCase()}</span>
            </div>
            <span className="font-mono text-[11px] text-[#D9D9E2]/50">
              {new Date(verification.created_at).toLocaleDateString()}
            </span>
          </div>

          {verification.status === "needs_info" && (
            <p className="text-xs text-amber-200 font-sans">
              Запрос модератора: {verification.reviewer_notes || "Уточните ссылки на профили."}
            </p>
          )}

          {verification.status === "rejected" && (
            <p className="text-xs text-red-200 font-sans">
              Причина отклонения: {verification.reject_reason || "Недостаточно подтверждающих материалов."}
            </p>
          )}
        </div>
      )}

      {/* Verification Submission Form */}
      {status !== "verified" && (
        <form onSubmit={handleSubmit} className="p-7 rounded-3xl bg-[#090611] border border-white/10 space-y-6">
          <h3 className="font-display font-bold text-lg text-white">
            Подача заявки на верификацию
          </h3>

          {/* Stage name */}
          <div>
            <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1.5">
              Сценическое имя артиста *
            </label>
            <input
              type="text"
              required
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="Например: KAZUMA"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#B46BFF] text-white text-sm outline-none transition"
            />
          </div>

          {/* Choose Verification Method */}
          <div>
            <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-2">
              Выберите способ подтверждения
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMethod("code")}
                className={`p-4 rounded-2xl text-left border transition ${
                  method === "code"
                    ? "bg-[#8737FF]/20 border-[#8737FF] shadow-[0_0_16px_rgba(135,55,255,0.3)]"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="font-mono text-xs font-bold text-[#00F0FF] mb-1">
                  METHOD B: Временный код
                </div>
                <div className="text-[11px] text-[#D9D9E2]/70 font-sans">
                  Размещение сгенерированного кода в описании профиля или карточки артиста.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("manual")}
                className={`p-4 rounded-2xl text-left border transition ${
                  method === "manual"
                    ? "bg-[#8737FF]/20 border-[#8737FF] shadow-[0_0_16px_rgba(135,55,255,0.3)]"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="font-mono text-xs font-bold text-[#B46BFF] mb-1">
                  METHOD C: Ручная проверка
                </div>
                <div className="text-[11px] text-[#D9D9E2]/70 font-sans">
                  Предоставление ссылок на карточки стримингов и официальные соцсети.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("oauth")}
                className={`p-4 rounded-2xl text-left border transition ${
                  method === "oauth"
                    ? "bg-[#8737FF]/20 border-[#8737FF] shadow-[0_0_16px_rgba(135,55,255,0.3)]"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="font-mono text-xs font-bold text-white/90 mb-1">
                  METHOD A: Platform OAuth
                </div>
                <div className="text-[11px] text-[#D9D9E2]/70 font-sans">
                  Прямое подтверждение владения через сторонние OAuth-провайдеры площадок.
                </div>
              </button>
            </div>
          </div>

          {/* Method B: Code Generator Box */}
          {method === "code" && (
            <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#00F0FF] uppercase font-bold">
                  Ваш уникальный проверочный код:
                </span>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="flex items-center gap-1 font-mono text-[11px] text-[#D9D9E2]/60 hover:text-white"
                >
                  <RefreshCw className={`w-3 h-3 ${generatingCode ? "animate-spin" : ""}`} />
                  <span>Обновить</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 font-mono text-lg font-black text-white tracking-widest shadow-inner">
                  {verificationCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-medium text-white transition active:scale-95"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? "Скопировано!" : "Скопировать"}</span>
                </button>
              </div>

              <p className="text-xs text-[#D9D9E2]/70 font-sans leading-relaxed">
                Разместите этот код в биографии/описании вашей карточки на Яндекс Музыке, Spotify, в шапке паблика VK или в статусе Telegram артиста. После проверки модератор подтвердит заявку.
              </p>
            </div>
          )}

          {/* Evidence URLs */}
          <div className="space-y-4">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Ссылки для проверки владения
            </h4>

            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1">
                Основная карточка артиста (Spotify / Яндекс Музыка / Apple Music) *
              </label>
              <input
                type="url"
                required
                value={dspUrl1}
                onChange={(e) => setDspUrl1(e.target.value)}
                placeholder="https://music.yandex.ru/artist/..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1">
                Вторая музыкальная площадка (по желанию)
              </label>
              <input
                type="url"
                value={dspUrl2}
                onChange={(e) => setDspUrl2(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1">
                Официальная соцсеть артиста (VK, Instagram, Telegram)
              </label>
              <input
                type="url"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                placeholder="https://vk.com/... или https://t.me/..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#D9D9E2]/70 uppercase tracking-wider mb-1">
                Комментарий для модератора (по желанию)
              </label>
              <textarea
                rows={2}
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Укажите, где размещён проверочный код или другие детали..."
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-energy inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Отправка..." : "Отправить заявку"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
