import Image from "next/image";
import Container from "../../components/Container";
import GlowButton from "../../components/GlowButton";
import DashboardReleasesTable from "../../components/DashboardReleasesTable";
import TelegramSyncCard from "../../components/TelegramSyncCard";
import CxrnerLinkHeroCard from "../../components/link/CxrnerLinkHeroCard";
import CabinetNav from "../../components/CabinetNav";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../../lib/supabaseServer";
import { getUserSmartLinks } from "../../lib/smartLinksDb";
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
    telegram_id?: string | number;
    telegram_username?: string;
    telegram_linked_at?: string;
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
      redirect("/auth/login?redirect=/dashboard");
    }
    user = authUser;

    const dbClient = getSupabaseAdminClient() || supabase;

    const { data: pRow } = await dbClient
      .from("cxrner_cabinet_users")
      .select("user_id, profile")
      .eq("user_id", user.id)
      .maybeSingle<CabinetProfileRow>();
    profileRow = pRow;

    const { data: profRow } = await dbClient
      .from("cxrner_profiles")
      .select("telegram_id")
      .eq("user_id", user.id)
      .maybeSingle<{ telegram_id?: string | null }>();

    const linkedTgId =
      profileRow?.profile?.telegram_id
        ? String(profileRow.profile.telegram_id)
        : profRow?.telegram_id
        ? String(profRow.telegram_id)
        : user.user_metadata?.telegram_id
        ? String(user.user_metadata.telegram_id)
        : null;

    const lookupIds = Array.from(
      new Set([String(user.id || "").trim(), String(linkedTgId || "").trim()].filter(Boolean))
    );

    let fRows: FormRow[] | null = null;
    let formsError: any = null;
    if (lookupIds.length > 1) {
      const res = await dbClient
        .from("cxrner_forms")
        .select("*")
        .in("telegram_id", lookupIds)
        .order("created_at", { ascending: false })
        .returns<FormRow[]>();
      fRows = res.data;
      formsError = res.error;
    } else {
      const res = await dbClient
        .from("cxrner_forms")
        .select("*")
        .eq("telegram_id", user.id)
        .order("created_at", { ascending: false })
        .returns<FormRow[]>();
      fRows = res.data;
      formsError = res.error;
    }

    if (formsError) {
      console.error("[Dashboard] cxrner_forms query error:", formsError.message);
      const fallbackRes = await dbClient
        .from("cxrner_forms")
        .select("*")
        .eq("telegram_id", user.id)
        .order("created_at", { ascending: false })
        .returns<FormRow[]>();
      if (!fallbackRes.error && fallbackRes.data) {
        fRows = fallbackRes.data;
      } else {
        errorNotice = formsError.message || "Ошибка чтения списка релизов";
      }
    }

    forms = (fRows ?? []).filter((f: any) => {
      if (!f) return false;
      if (f.user_deleted === true || f.form_payload?.user_deleted === true) return false;
      return String(f.status || "").toLowerCase() !== "deleted";
    });

    // Fallback: Check cxrner_public_releases if linked to Telegram and cxrner_forms is empty
    if (forms.length === 0 && linkedTgId) {
      try {
        const { data: pubRows } = await dbClient
          .from("cxrner_public_releases")
          .select("*")
          .eq("telegram_id", linkedTgId);

        if (pubRows && pubRows.length > 0) {
          forms = pubRows.map((r: any) => ({
            id: r.form_id || `${r.telegram_id}:${r.approved_at}`,
            artist_name: r.artist_name,
            track_name: r.track_name,
            genre: r.genre,
            status: r.status,
            upc: r.release_data?.upc || r.upc || null,
            created_at: r.approved_at || r.updated_at,
            source: "telegram",
            reject_reason: null,
            moderator_comment: null,
            form_payload: r.release_data,
          }));
        }
      } catch {}
    }
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    errorNotice =
      err?.message ||
      "Не удалось подключиться к базе данных. Проверьте настройки NEXT_PUBLIC_SUPABASE_URL.";
  }

  const isCeoSovereign =
    user?.email?.trim().toLowerCase() === "kazumaiq.music@gmail.com" ||
    String((profileRow?.profile as any)?.username || "")
      .trim()
      .toLowerCase() === "kazumaiq";

  const artistName = isCeoSovereign
    ? "KAZUMA // CEO"
    : profileRow?.profile?.artist_name ||
      user?.email?.split("@")[0] ||
      "Артист";

  // Calculate stats
  const totalReleases = forms.length;
  const inModeration = forms.filter((f) =>
    ["pending", "on_upload", "moderation", "on_moderation"].includes(String(f.status || "").toLowerCase())
  ).length;
  const liveReleases = forms.filter((f) =>
    ["approved", "published", "uploaded", "released"].includes(String(f.status || "").toLowerCase())
  ).length;
  const fixRequired = forms.filter((f) =>
    ["needfix", "fix_required"].includes(String(f.status || "").toLowerCase())
  ).length;

  const userSmartLinks = await getUserSmartLinks(user.id);

  return (
    <div className="min-h-screen pt-16 sm:pt-[72px] pb-24">
      <CabinetNav />
      <div className="pt-8">
        <Container>
        {/* Welcome Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/80 border border-purple-500/40 p-1 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex-shrink-0 mt-1">
              <Image
                src="/logo.png"
                alt="CXRNER MUSIC"
                width={56}
                height={56}
                className="object-contain w-full h-full p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#C084FC] animate-pulse" />
                <p className="font-sans text-xs font-bold text-[#C084FC]">
                  {isCeoSovereign
                    ? "Кабинет основателя и CEO · #000001"
                    : "Личный кабинет артиста"}
                </p>
                {isCeoSovereign && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#F59E0B]/25 via-[#8B5CF6]/25 to-[#22D3EE]/25 border border-[#F59E0B]/50 text-xs font-sans font-bold text-[#FDE68A]">
                    👑 CEO · kazumaiq.music@gmail.com
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {artistName}
              </h1>
              <p className="mt-1.5 text-sm text-[#DED8F6] font-sans">
                Ваши релизы, статус модерации и смарт-ссылки в одном окне.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/cabinet/verification"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 font-sans text-xs font-semibold text-white transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Верификация</span>
                </Link>
                <Link
                  href="/cabinet/referrals"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 font-sans text-xs font-semibold text-white transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span>Друзья и CXP</span>
                </Link>
                <Link
                  href="/cabinet/drop/inventory"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 font-sans text-xs font-semibold text-white transition"
                >
                  <span>Инвентарь DROP</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/submit-release"
              className="btn-energy inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm font-bold shadow-[0_0_24px_rgba(139,92,246,0.4)] active:scale-95 transition"
            >
              <span>Выпустить релиз</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a
              href="https://t.me/moder_cxrner_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-void-ghost inline-flex items-center gap-1.5 px-4 py-3.5 rounded-full border border-white/20 font-sans text-sm font-semibold text-white transition"
            >
              <Send className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>Бот модерации</span>
            </a>
          </div>
        </div>

        {/* Notice if Supabase offline */}
        {errorNotice && (
          <div className="mb-8 p-4 rounded-2xl bg-yellow-500/15 border border-yellow-400/40 text-yellow-100 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Внимание по конфигурации базы данных:</p>
              <p className="text-yellow-100 mt-1">{errorNotice}</p>
            </div>
          </div>
        )}

        {/* Adaptive Overview: Friendly 3-Step Onboarding for newcomers OR Crisp Stat Grid */}
        {totalReleases === 0 ? (
          <div className="mb-10 cxr-panel-chrome rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/25 border border-[#C084FC]/45 font-sans text-xs font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Быстрый старт за 2 минуты</span>
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-3">
                  Как выпустить свой первый релиз
                </h2>
                <p className="text-sm text-[#DED8F6] mt-1">
                  Всё максимально просто — следуйте 3 шагам ниже.
                </p>
              </div>
              <Link
                href="/submit-release"
                className="btn-void-primary px-6 py-3.5 font-sans text-sm normal-case tracking-normal shrink-0"
              >
                <span>Заполнить анкету релиза</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.06] border border-white/12 space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white font-display font-extrabold text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="font-display text-base font-bold text-white">Отправь трек</h3>
                <p className="text-xs sm:text-sm text-[#DED8F6] leading-relaxed">
                  Загрузи ссылку на аудио и обложку в разделе «Выпустить релиз» — роялти 70/30 без предоплаты.
                </p>
              </div>
              <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.06] border border-white/12 space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#22D3EE] text-[#0B0718] font-display font-extrabold text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="font-display text-base font-bold text-white">Привяжи Telegram</h3>
                <p className="text-xs sm:text-sm text-[#DED8F6] leading-relaxed">
                  Если уже подавал треки через бота — нажми «Привязать Telegram» ниже, и они сразу появятся здесь.
                </p>
              </div>
              <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.06] border border-white/12 space-y-2">
                <div className="w-8 h-8 rounded-full bg-white text-[#0B0718] font-display font-extrabold text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="font-display text-base font-bold text-white">Забирай Smart Link</h3>
                <p className="text-xs sm:text-sm text-[#DED8F6] leading-relaxed">
                  После одобрения ты получишь UPC и сможешь бесплатно сделать красивую мультиссылку на все площадки.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/15">
              <div className="flex items-center justify-between text-[#DED8F6] mb-3">
                <span className="text-xs font-bold">Всего релизов</span>
                <Disc className="w-4 h-4 text-[#C084FC]" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-white">{totalReleases}</p>
              <p className="text-xs text-[#C2BAE8] mt-1">Сайт и Telegram</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/15">
              <div className="flex items-center justify-between text-[#DED8F6] mb-3">
                <span className="text-xs font-bold">На модерации</span>
                <Clock className="w-4 h-4 text-amber-300" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-amber-300">{inModeration}</p>
              <p className="text-xs text-[#C2BAE8] mt-1">Проверка командой</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/15">
              <div className="flex items-center justify-between text-[#DED8F6] mb-3">
                <span className="text-xs font-bold">Одобрено</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-300">{liveReleases}</p>
              <p className="text-xs text-[#C2BAE8] mt-1">На площадках</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/15">
              <div className="flex items-center justify-between text-[#DED8F6] mb-3">
                <span className="text-xs font-bold">Роялти артиста</span>
                <TrendingUp className="w-4 h-4 text-[#22D3EE]" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#22D3EE]">70%</p>
              <p className="text-xs text-[#C2BAE8] mt-1">Выплаты раз в квартал</p>
            </div>
          </div>
        )}

        {/* CXRNER LINK Hub Hero Card (Narvent & Martin Garrix STMPD aesthetic) */}
        <div className="mb-10">
          <CxrnerLinkHeroCard activeCount={userSmartLinks.length} />
        </div>

        {/* Telegram Sync integration banner */}
        <div className="mb-10">
          <TelegramSyncCard
            initialLinked={Boolean(profileRow?.profile?.telegram_id)}
            initialTelegramId={
              profileRow?.profile?.telegram_id
                ? String(profileRow.profile.telegram_id)
                : null
            }
            initialTelegramUsername={profileRow?.profile?.telegram_username ?? null}
          />
        </div>

        {/* Releases Table & Realtime Section */}
        {user ? (
          <DashboardReleasesTable
            initialForms={forms}
            profileArtistName={profileRow?.profile?.artist_name ?? null}
            userId={user.id}
            linkedTelegramId={
              profileRow?.profile?.telegram_id
                ? String(profileRow.profile.telegram_id)
                : null
            }
          />
        ) : (
          <div className="glass-panel rounded-3xl p-10 text-center border border-white/10">
            <p className="text-white/60">Войдите в аккаунт для отображения ваших релизов.</p>
          </div>
        )}
      </Container>
      </div>
    </div>
  );
}
