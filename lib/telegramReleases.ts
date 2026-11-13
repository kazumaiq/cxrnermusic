import telegramBackupData from "@/data/telegram_releases_backup.json";
import { DossierRelease } from "@/components/admin/ReleaseDossierModal";
import { isTestRelease } from "./testReleases";

function normalizeStatus(st: string | null | undefined): string {
  const s = String(st || "").trim().toLowerCase();
  if (s === "pending" || s === "on_upload" || s === "upload") return "on_upload";
  if (s === "moderation" || s === "on_moderation" || s === "moderate") return "moderation";
  if (s === "approved" || s === "published" || s === "accept") return "approved";
  if (s === "needfix" || s === "needs_fix" || s === "needs_changes" || s === "needs_fix_link" || s === "fix_required") return "needfix";
  if (s === "rejected" || s === "reject" || s === "decline") return "rejected";
  if (s === "deleted" || s === "archive") return "deleted";
  return s || "on_upload";
}

function normalizeReleaseType(t: string | null | undefined): string {
  const s = String(t || "").trim().toLowerCase();
  if (s.includes("альбом") || s === "album") return "album";
  if (s.includes("ep") || s.includes("мини")) return "ep";
  return "single";
}

export function loadBackupTelegramReleases(): DossierRelease[] {
  const releases: DossierRelease[] = [];

  for (const [uid, rawList] of Object.entries(telegramBackupData as Record<string, any[]>)) {
    const list = Array.isArray(rawList) ? rawList : [];
    for (let idx = 0; idx < list.length; idx++) {
      const item = list[idx] || {};
      const submissionTime = item.submission_time || item.deleted_at || "2026-02-14T00:00:00.000Z";
      const id = `${uid}:${submissionTime}:${idx}`;

      const status = normalizeStatus(item.status);
      const isDeleted = Boolean(item.user_deleted || item.deleted_at || item.status === "deleted");

      const payload = {
        name: item.name || item.track_name || "Без названия",
        nick: item.nick || item.artist_name || "Артист",
        fio: item.fio || item.nick || "—",
        type: item.type || "сингл",
        genre: item.genre || "Phonk",
        date: item.date || "—",
        version: item.version || "Оригинал",
        link: item.link || item.files_link || "—",
        yandex: item.yandex || ".",
        mat: item.mat || (item.has_explicit ? "Да" : "Нет"),
        promo: item.promo || ".",
        comment: item.comment || ".",
        tg: item.tg || (item.username ? `@${item.username}` : "—"),
        upc: item.upc || null,
        moderator: item.moderator || "kazumaiq",
        submission_time: submissionTime,
        moderation_time: item.moderation_time || null,
        reject_reason: item.reject_reason || null,
      };

      releases.push({
        id,
        telegram_id: uid,
        username: item.username || (item.tg?.startsWith("@") ? item.tg.replace("@", "") : null),
        artist_name: item.nick || item.artist_name || "Артист",
        track_name: item.name || item.track_name || "Без названия",
        genre: item.genre || "Phonk",
        release_type: normalizeReleaseType(item.type),
        submission_key: submissionTime,
        status,
        upc: item.upc || null,
        reject_reason: item.reject_reason || null,
        moderator_comment: item.reject_reason || (status === "needfix" ? "Требуются правки по релизу" : null),
        moderation_message_id: item.moderation_message_id ? String(item.moderation_message_id) : null,
        created_at: submissionTime,
        updated_at: item.moderation_time || submissionTime,
        source: item.source || "telegram_bot",
        user_deleted: isDeleted,
        form_payload: payload,
      });
    }
  }

  return releases;
}

export function transformPublicReleaseToDossier(row: any): DossierRelease {
  const relData = row.release_data && typeof row.release_data === "object" ? row.release_data : {};
  const status = normalizeStatus(row.status || relData.status);
  const isDeleted = Boolean(relData.user_deleted || row.user_deleted || status === "deleted");

  const submissionTime = relData.submission_time || row.approved_at || row.updated_at || new Date().toISOString();
  const id = row.form_id || `${row.telegram_id}:${submissionTime}`;

  const payload = {
    name: row.track_name || relData.name || "Без названия",
    nick: row.artist_name || relData.nick || "Артист",
    fio: relData.fio || row.artist_name || "—",
    type: row.release_type || relData.type || "сингл",
    genre: row.genre || relData.genre || "Phonk",
    date: relData.date || "—",
    version: relData.version || "Оригинал",
    link: relData.link || relData.files_link || "—",
    yandex: relData.yandex || ".",
    mat: relData.mat || "Нет",
    promo: relData.promo || ".",
    comment: relData.comment || ".",
    tg: relData.tg || (row.username ? `@${row.username}` : "—"),
    upc: relData.upc || row.upc || null,
    moderator: relData.moderator || "kazumaiq",
    submission_time: submissionTime,
    moderation_time: relData.moderation_time || row.approved_at,
    reject_reason: relData.reject_reason || null,
    moderation_original_text: relData.moderation_original_text || null,
  };

  return {
    id,
    telegram_id: String(row.telegram_id || ""),
    username: row.username || (relData.tg?.startsWith("@") ? relData.tg.replace("@", "") : null),
    artist_name: row.artist_name || relData.nick || "Артист",
    track_name: row.track_name || relData.name || "Без названия",
    genre: row.genre || relData.genre || "Phonk",
    release_type: normalizeReleaseType(row.release_type || relData.type),
    submission_key: submissionTime,
    status,
    upc: relData.upc || row.upc || null,
    reject_reason: relData.reject_reason || null,
    moderator_comment: relData.comment || null,
    moderation_message_id: relData.moderation_message_id ? String(relData.moderation_message_id) : null,
    created_at: submissionTime,
    updated_at: row.updated_at || row.approved_at || submissionTime,
    source: relData.source || "telegram_bot",
    user_deleted: isDeleted,
    form_payload: payload,
  };
}

export function computeCmsStats(allReleases: DossierRelease[]) {
  const activeReleases = allReleases.filter((f) => !f.user_deleted && f.status !== "deleted");

  return {
    total: activeReleases.length,
    all_count: allReleases.length,
    on_upload: activeReleases.filter((f) => f.status === "on_upload" || f.status === "pending").length,
    moderation: activeReleases.filter((f) => f.status === "moderation" || f.status === "on_moderation").length,
    needfix: activeReleases.filter((f) => f.status === "needfix" || f.status === "fix_required").length,
    approved: activeReleases.filter((f) => f.status === "approved" || f.status === "published").length,
    rejected: activeReleases.filter((f) => f.status === "rejected").length,
    archived: allReleases.filter((f) => f.user_deleted || f.status === "deleted").length,
    with_upc: activeReleases.filter((f) => Boolean(f.upc && f.upc.trim())).length,
    test_count: allReleases.filter((f) => isTestRelease(f)).length,
  };
}

export async function getAllUnifiedReleases(supabase?: any): Promise<DossierRelease[]> {
  const map = new Map<string, DossierRelease>();

  // 1. Initial Telegram bot backlog (contains real pending, on_upload, moderation, needfix, rejected)
  try {
    const backupReleases = loadBackupTelegramReleases();
    for (const b of backupReleases) {
      map.set(b.id, b);
    }
  } catch (err) {
    console.warn("[Unified Releases] Backup load notice:", err);
  }

  // 2. Load public releases from Supabase (160 approved releases synced from Telegram)
  if (supabase) {
    try {
      const { data: pubData, error: pubErr } = await supabase
        .from("cxrner_public_releases")
        .select("*")
        .limit(1000);

      if (!pubErr && Array.isArray(pubData)) {
        for (const row of pubData) {
          const item = transformPublicReleaseToDossier(row);
          map.set(item.id, item);
        }
      }
    } catch (err) {
      console.warn("[Unified Releases] cxrner_public_releases load notice:", err);
    }

    // 3. Load cxrner_forms from Supabase
    try {
      const { data: formsData, error: formsErr } = await supabase
        .from("cxrner_forms")
        .select("*")
        .limit(1000);

      if (!formsErr && Array.isArray(formsData)) {
        for (const f of formsData) {
          map.set(f.id, {
            id: f.id,
            telegram_id: f.telegram_id,
            username: f.username,
            artist_name: f.artist_name,
            track_name: f.track_name,
            genre: f.genre,
            release_type: f.release_type,
            submission_key: f.submission_key,
            status: f.status,
            upc: f.upc,
            reject_reason: f.reject_reason,
            moderator_comment: f.moderator_comment,
            moderation_message_id: f.moderation_message_id,
            created_at: f.created_at,
            updated_at: f.updated_at,
            source: f.source,
            user_deleted: f.user_deleted,
            action_history: f.action_history,
            form_payload: f.form_payload,
          });
        }
      }
    } catch (err) {
      console.warn("[Unified Releases] cxrner_forms load notice:", err);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}
