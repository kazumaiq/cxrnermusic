import Container from "../../components/Container";
import GlowButton from "../../components/GlowButton";
import DashboardReleasesTable from "../../components/DashboardReleasesTable";
import { getSupabaseServerClient } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";

type CabinetProfileRow = {
  user_id: string;
  profile: {
    artist_name?: string;
  } | null;
};

type FormRow = {
  id: string;
  artist_name: string | null;
  track_name: string | null;
  genre: string | null;
  status: string | null;
  upc: string | null;
  created_at: string;
  source: string | null;
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔥 ВОТ ЭТО ГЛАВНЫЙ ФИКС
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profileRow } = await supabase
    .from("cxrner_cabinet_users")
    .select("user_id, profile")
    .eq("user_id", user.id)
    .maybeSingle<CabinetProfileRow>();

  const { data: forms } = await supabase
    .from("cxrner_forms")
    .select("id, artist_name, track_name, genre, status, upc, created_at, source")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<FormRow[]>();

  const artistName =
    profileRow?.profile?.artist_name ||
    user.email ||
    (user.user_metadata && (user.user_metadata.name as string)) ||
    "";

  return (
    <div className="section-padding">
      <Container>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">Личный кабинет</p>
            <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl font-display">
              {artistName || "Артист"} — ваши релизы
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Отправляйте релизы через сайт и следите за статусом модерации и UPC в реальном времени.
            </p>
          </div>
          <GlowButton href="/submit-release" variant="primary" aria-label="Отправить релиз через сайт">
            Отправить релиз
          </GlowButton>
        </div>

        {forms && (
          <DashboardReleasesTable
            initialForms={forms}
            profileArtistName={profileRow?.profile?.artist_name ?? null}
            userId={user.id}
          />
        )}
      </Container>
    </div>
  );
}
