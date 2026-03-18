import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Container from "../../../../components/Container";
import GlowButton from "../../../../components/GlowButton";
import ReleaseRealtimeSection from "../../../../components/ReleaseRealtimeSection";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";

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

const statusLabels: Record<string, string> = {
  pending: "На модерации",
  moderation: "Модерация",
  approved: "Принято",
  rejected: "Отклонено",
  uploaded: "Отгружено",
  released: "В релизе",
  fix_required: "На исправление",
  deleted: "Удалено",
};

function getStatusBadge(status: string | null) {
  if (!status) {
    return <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/60">Неизвестно</span>;
  }

  const label = statusLabels[status] ?? status;

  let colorClasses = "bg-white/5 text-white/80 border-white/10";
  if (status === "pending" || status === "moderation") {
    colorClasses = "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
  } else if (status === "approved" || status === "uploaded" || status === "released") {
    colorClasses = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  } else if (status === "rejected") {
    colorClasses = "bg-red-500/10 text-red-300 border-red-500/30";
  } else if (status === "fix_required") {
    colorClasses = "bg-orange-500/10 text-orange-300 border-orange-500/30";
  } else if (status === "deleted") {
    colorClasses = "bg-white/5 text-white/50 border-white/10";
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${colorClasses}`}>
      {label}
    </span>
  );
}

type PageProps = {
  params: { id: string };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("cxrner_forms")
    .select("track_name, artist_name")
    .eq("id", params.id)
    .maybeSingle<{ track_name: string | null; artist_name: string | null }>();

  const titleParts = [];
  if (data?.track_name) titleParts.push(data.track_name);
  if (data?.artist_name) titleParts.push(data.artist_name);

  return {
    title: titleParts.length ? `${titleParts.join(" — ")} (релиз)` : "Релиз",
  };
}

export default async function ReleaseDetailsPage({ params }: PageProps) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // RLS может скрывать запись для anon-key клиента на сервере.
  // Чтобы UX не ломался, читаем запись через service-role и потом проверяем владельца.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return (
      <div className="section-padding">
        <Container>
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-lg font-semibold text-white">Ошибка сервиса</p>
            <p className="mt-2 text-sm text-white/60">Не настроены Supabase переменные для чтения.</p>
            <div className="mt-6 flex justify-center">
              <GlowButton href="/dashboard" variant="ghost">
                Вернуться в кабинет
              </GlowButton>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: form, error } = await serviceSupabase
    .from("cxrner_forms")
    .select(
      "id, artist_name, track_name, genre, release_type, status, upc, reject_reason, created_at, form_payload, telegram_id",
    )
    .eq("id", params.id)
    .maybeSingle<FormDetailsRow & { telegram_id: string | number }>();

  const telegramId = form?.telegram_id;
  const isOwner = telegramId != null && String(telegramId) === String(user.id);

  if (error || !form || !isOwner) {
    return (
      <div className="section-padding">
        <Container>
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-lg font-semibold text-white">Релиз не найден</p>
            <p className="mt-2 text-sm text-white/60">Возможно, он был удалён или вы не имеете к нему доступа.</p>
            <div className="mt-6 flex justify-center">
              <GlowButton href="/dashboard" variant="ghost">
                Вернуться в кабинет
              </GlowButton>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const payload = form.form_payload ?? {};

  const releaseDate: string | undefined = payload.release_date;
  const coverLink: string | undefined = payload.cover_link;
  const audioLink: string | undefined = payload.audio_link;
  const links: string | string[] | undefined = payload.links;
  const promoText: string | undefined = payload.promo_text;

  const linksArray: string[] =
    typeof links === "string"
      ? links
          .split(/\n|,/)
          .map((x) => x.trim())
          .filter(Boolean)
      : Array.isArray(links)
      ? links
      : [];

  return (
    <div className="section-padding">
      <Container>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Релиз</p>
            <h1 className="mt-3 text-2xl font-semibold text-white md:text-3xl font-display">
              {form.track_name || "Без названия"}
            </h1>
            <p className="mt-1 text-sm text-white/60">{form.artist_name}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(form.status)}
            <GlowButton href="/dashboard" variant="ghost">
              В кабинет
            </GlowButton>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr,1.5fr]">
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Основная информация</p>
              <div className="mt-4 grid gap-3 text-sm text-white/80">
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">Артист</span>
                  <span>{form.artist_name || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">Трек</span>
                  <span>{form.track_name || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">Жанр</span>
                  <span>{form.genre || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">Тип релиза</span>
                  <span>{form.release_type || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/50">Дата создания</span>
                  <span>
                    {new Date(form.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {releaseDate && (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/50">Желаемая дата релиза</span>
                    <span>{releaseDate}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Дополнительные ссылки</p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                {coverLink && (
                  <div>
                    <p className="text-white/60">Обложка</p>
                    <Link
                      href={coverLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-aqua-200 underline-offset-4 hover:underline"
                    >
                      {coverLink}
                    </Link>
                  </div>
                )}
                {audioLink && (
                  <div>
                    <p className="text-white/60">Аудио</p>
                    <Link
                      href={audioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-aqua-200 underline-offset-4 hover:underline"
                    >
                      {audioLink}
                    </Link>
                  </div>
                )}
                {linksArray.length > 0 && (
                  <div>
                    <p className="text-white/60">Ссылки</p>
                    <ul className="mt-1 space-y-1">
                      {linksArray.map((href) => (
                        <li key={href}>
                          <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-aqua-200 underline-offset-4 hover:underline"
                          >
                            {href}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!coverLink && !audioLink && linksArray.length === 0 && (
                  <p className="text-white/50">Дополнительные ссылки не указаны.</p>
                )}
              </div>
            </div>

            {promoText && (
              <div className="glass rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">Промо-текст</p>
                <p className="mt-3 whitespace-pre-line text-sm text-white/80">{promoText}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ReleaseRealtimeSection
              formId={form.id}
              initialStatus={form.status}
              initialRejectReason={form.reject_reason}
              initialUpc={form.upc}
            />

            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Через кого отправлен</p>
              <p className="mt-3 text-sm text-white/80">
                {form.status === "pending" || form.status === "moderation"
                  ? "Релиз находится в очереди на модерацию. Вы получите обновление статуса после решения команды."
                  : "Статус релиза обновляется автоматически после действий модерации в Telegram."}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

