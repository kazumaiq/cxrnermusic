import Container from "../../components/Container";
import GlowButton from "../../components/GlowButton";
import DashboardReleasesTable from "../../components/DashboardReleasesTable";
import { getSupabaseServerClient } from "../../lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Disc,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Send,
} from "lucide-react";

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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let user: any = null;
  let profileRow: CabinetProfileRow | null = null;
  let forms: FormRow[] = [];
  let errorNotice: string | null = null;

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect("/auth/login");
    }
    user = authUser;

    const { data: pRow } = await supabase
      .from("cxrner_cabinet_users")
      .select("user_id, profile")
      .eq("user_id", user.id)
      .maybeSingle<CabinetProfileRow>();
    profileRow = pRow;

    const { data: fRows } = await supabase
      .from("cxrner_forms")
      .select("id, artist_name, track_name, genre, status, upc, created_at, source")
      .eq("telegram_id", user.id)
      .order("created_at", { ascending: false })
      .returns<FormRow[]>();

    forms = fRows ?? [];
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    errorNotice =
      err?.message ||
      "Не удалось подключиться к базе данных. Проверьте настройки NEXT_PUBLIC_SUPABASE_URL.";
  }

  const artistName =
    profileRow?.profile?.artist_name ||
    user?.email?.split("@")[0] ||
    "Артист";

  // Calculate stats
  const totalReleases = forms.length;
  const inModeration = forms.filter((f) => f.status === "pending" || f.status === "moderation").length;
  const liveReleases = forms.filter((f) => f.status === "approved" || f.status === "uploaded" || f.status === "released").length;
  const fixRequired = forms.filter((f) => f.status === "fix_required").length;

  return (
    <div className="section-padding pt-28 sm:pt-36">
      <Container>
        {/* Welcome Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon">
                Личный кабинет артиста
              </p>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
              {artistName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/60">
              Управление вашими музыкальными релизами, статусы модерации и UPC в реальном времени.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/submit-release"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-neon via-magenta to-aqua text-night font-bold text-xs uppercase tracking-wider shadow-glow hover:scale-105 active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4 fill-night" />
              Отправить новый релиз
            </Link>
            <a
              href="https://t.me/moder_cxrner_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full glass-badge border border-white/15 text-xs font-semibold text-white/80 hover:text-white transition"
            >
              <Send className="w-3.5 h-3.5 text-aqua" />
              Бот модерации
            </a>
          </div>
        </div>

        {/* Notice if Supabase offline */}
        {errorNotice && (
          <div className="mb-8 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Внимание по конфигурации базы данных:</p>
              <p className="text-white/70 mt-1">{errorNotice}</p>
            </div>
          </div>
        )}

        {/* Stat Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/40 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Всего релизов</span>
              <Disc className="w-4 h-4 text-neon" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-white">{totalReleases}</p>
            <p className="text-[11px] text-white/40 mt-1">Отправлено через веб и бот</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/40 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">На модерации</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-yellow-400">{inModeration}</p>
            <p className="text-[11px] text-white/40 mt-1">Проверка A&R команды</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/40 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">В релизе / Одобрено</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-400">{liveReleases}</p>
            <p className="text-[11px] text-white/40 mt-1">На мировых стримингах</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/40 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Роялти</span>
              <TrendingUp className="w-4 h-4 text-aqua" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-aqua">70%</p>
            <p className="text-[11px] text-white/40 mt-1">Выплаты раз в квартал</p>
          </div>
        </div>

        {/* Releases Table & Realtime Section */}
        {user ? (
          <DashboardReleasesTable
            initialForms={forms}
            profileArtistName={profileRow?.profile?.artist_name ?? null}
            userId={user.id}
          />
        ) : (
          <div className="glass-panel rounded-3xl p-10 text-center border border-white/10">
            <p className="text-white/60">Войдите в аккаунт для отображения ваших релизов.</p>
          </div>
        )}
      </Container>
    </div>
  );
}
