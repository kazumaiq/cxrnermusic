import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Container from "../../../../components/Container";
import ReleaseRealtimeSection from "../../../../components/ReleaseRealtimeSection";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";
import {
  ArrowLeft,
  Disc,
  FileAudio,
  Send,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Tag,
  User,
  Music,
} from "lucide-react";

type FormDetailsRow = {
  id: string;
  artist_name: string | null;
  track_name: string | null;
  genre: string | null;
  release_type: string | null;
  status: string | null;
  upc: string | null;
  reject_reason: string | null;
  created_at: string;
  form_payload: any | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from("cxrner_forms")
      .select("track_name, artist_name")
      .eq("id", id)
      .maybeSingle<{ track_name: string | null; artist_name: string | null }>();

    const titleParts = [];
    if (data?.track_name) titleParts.push(data.track_name);
    if (data?.artist_name) titleParts.push(data.artist_name);

    return {
      title: titleParts.length ? `${titleParts.join(" — ")} (Релиз)` : "Детали релиза",
    };
  } catch {
    return { title: "Детали релиза" };
  }
}

export default async function ReleaseDetailsPage({ params }: PageProps) {
  const { id } = await params;

  let user: any = null;
  let form: FormDetailsRow | null = null;
  let errorMsg: string | null = null;

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user = authUser;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const { data } = await adminClient
        .from("cxrner_forms")
        .select("*")
        .eq("id", id)
        .maybeSingle<FormDetailsRow>();

      form = data;
    } else {
      const { data } = await supabase
        .from("cxrner_forms")
        .select("*")
        .eq("id", id)
        .maybeSingle<FormDetailsRow>();

      form = data;
    }
  } catch (err: any) {
    errorMsg = err.message;
  }

  if (!form) {
    return (
      <div className="section-padding pt-32">
        <Container className="max-w-2xl text-center">
          <div className="glass-panel rounded-3xl p-10 border border-white/10 space-y-4">
            <Disc className="w-12 h-12 text-white/30 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Релиз не найден</h1>
            <p className="text-sm text-white/60">
              {errorMsg || "Заявка с указанным идентификатором не найдена или у вас нет прав на её просмотр."}
            </p>
            <div className="pt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neon text-night font-bold text-xs uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                Вернуться в личный кабинет
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const payload = form.form_payload || {};

  return (
    <div className="section-padding pt-28 sm:pt-36">
      <Container className="max-w-4xl">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Назад к списку релизов
          </Link>
        </div>

        {/* Title Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-neon mb-1.5">
              <Disc className="w-3.5 h-3.5" />
              <span className="font-bold uppercase tracking-widest">
                {form.release_type === "album" ? "Альбом / EP" : "Сингл"}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              {form.track_name || "Без названия"}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Исполнитель: <strong className="text-white">{form.artist_name || "Не указан"}</strong>
            </p>
          </div>

          <a
            href="https://t.me/moder_cxrner_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-badge border border-white/15 text-xs font-semibold text-white/80 hover:text-white hover:border-aqua transition self-start md:self-auto"
          >
            <Send className="w-3.5 h-3.5 text-aqua" />
            Поддержка модерации
          </a>
        </div>

        {/* Realtime Status Stepper */}
        <div className="mb-8">
          <ReleaseRealtimeSection
            formId={form.id}
            initialStatus={form.status}
            initialRejectReason={form.reject_reason}
            initialUpc={form.upc}
          />
        </div>

        {/* Metadata Details Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audio & Files Info */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-aqua flex items-center gap-2">
              <FileAudio className="w-4 h-4" />
              Файлы и материалы
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-white/40 block mb-0.5">Ссылка на аудио (WAV/FLAC) & DAW:</span>
                {payload.files_link || payload.audio_link ? (
                  <a
                    href={payload.files_link || payload.audio_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neonSoft hover:underline inline-flex items-center gap-1 font-mono break-all"
                  >
                    {payload.files_link || payload.audio_link}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-white/30 italic">Не указано</span>
                )}
              </div>

              {payload.cover_link && (
                <div>
                  <span className="text-white/40 block mb-0.5">Ссылка на обложку:</span>
                  <a
                    href={payload.cover_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aqua hover:underline inline-flex items-center gap-1 font-mono break-all"
                  >
                    {payload.cover_link}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {payload.yandex_card_link && (
                <div>
                  <span className="text-white/40 block mb-0.5">Карточка Яндекс Музыки:</span>
                  <a
                    href={payload.yandex_card_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:underline inline-flex items-center gap-1 font-mono break-all"
                  >
                    {payload.yandex_card_link}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Release Specifications */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Спецификация трека
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/40 block">Жанр:</span>
                <span className="text-white font-semibold">{form.genre || "—"}</span>
              </div>
              <div>
                <span className="text-white/40 block">Версия:</span>
                <span className="text-white font-semibold">{payload.version || "Оригинал"}</span>
              </div>
              <div>
                <span className="text-white/40 block">Вокал / Текст:</span>
                <span className="text-white font-semibold">
                  {payload.has_lyrics || (payload.has_words === false ? "Инструментал" : "Есть вокал")}
                </span>
              </div>
              <div>
                <span className="text-white/40 block">Explicit 18+:</span>
                <span className="text-white font-semibold">{payload.mat || (payload.has_explicit ? "Да" : "Нет")}</span>
              </div>
              <div>
                <span className="text-white/40 block">Дата релиза:</span>
                <span className="text-white font-semibold">{payload.date || payload.release_date || "Как можно скорее"}</span>
              </div>
              <div>
                <span className="text-white/40 block">Telegram артиста:</span>
                <span className="text-aqua font-semibold">{payload.tg || payload.contact_telegram || "—"}</span>
              </div>
            </div>
          </div>

          {/* Promo Text (Full width if present) */}
          {(payload.promo || payload.promo_text) && payload.promo !== "." && (
            <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-white/10 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-magenta">
                Промо-текст для редакторов плейлистов
              </h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-line">
                {payload.promo || payload.promo_text}
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
