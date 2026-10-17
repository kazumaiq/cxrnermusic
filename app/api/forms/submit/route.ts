import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";

type Body = {
  artist_name: string;
  track_name: string;
  genre: string;
  release_type: string;
  release_date: string | null;
  cover_link?: string | null;
  audio_link: string | null;
  files_link?: string | null;
  links: string | null;
  promo_text: string | null;
  subtitle?: string | null;
  has_words?: boolean | null;
  artist_full_name?: string | null;
  version?: string | null;
  yandex_card_link?: string | null;
  has_explicit?: boolean | null;
  comment?: string | null;
  contact_telegram?: string | null;
};

export async function POST(request: Request) {
  try {
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "База данных Supabase не настроена на сервере. Укажите SUPABASE_URL и SUPABASE_ANON_KEY.",
        },
        { status: 503 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Для отправки релиза необходимо войти в личный кабинет.",
          needsAuth: true,
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Body;

    // Strict validation
    if (!body.artist_name?.trim()) {
      return NextResponse.json({ ok: false, error: "Укажите имя артиста." }, { status: 400 });
    }
    if (!body.track_name?.trim()) {
      return NextResponse.json({ ok: false, error: "Укажите название релиза/трека." }, { status: 400 });
    }
    if (!body.genre?.trim()) {
      return NextResponse.json({ ok: false, error: "Выберите жанр." }, { status: 400 });
    }

    const releaseType = body.release_type === "album" ? "альбом" : "сингл";
    const filesLink = body.files_link?.trim() || body.audio_link?.trim() || "";

    const formPayload = {
      type: releaseType,
      name: body.track_name.trim(),
      subname: body.subtitle?.trim() || ".",
      has_lyrics: body.has_words === false ? "Нет, это инструментал" : "Да",
      nick: body.artist_name.trim(),
      fio: body.artist_full_name?.trim() || body.artist_name.trim(),
      date: body.release_date || "",
      version: body.version?.trim() || "Оригинал",
      link: filesLink || ".",
      yandex: body.yandex_card_link?.trim() || ".",
      mat: body.has_explicit ? "Да" : "Нет",
      promo: body.promo_text?.trim() || ".",
      comment: body.comment?.trim() || ".",
      tracklist: ".",
      tg: body.contact_telegram?.trim() || "",
      artist_name: body.artist_name.trim(),
      track_name: body.track_name.trim(),
      genre: body.genre.trim(),
      release_type: body.release_type,
      release_date: body.release_date,
      cover_link: body.cover_link?.trim() || null,
      audio_link: filesLink || null,
      files_link: filesLink || null,
      links: body.links?.trim() || null,
      promo_text: body.promo_text?.trim() || null,
      subtitle: body.subtitle?.trim() || null,
      has_words: body.has_words ?? null,
      artist_full_name: body.artist_full_name?.trim() || null,
      yandex_card_link: body.yandex_card_link?.trim() || null,
      has_explicit: body.has_explicit ?? null,
      contact_telegram: body.contact_telegram?.trim() || null,
      source: "web",
    };

    // Unique submission key
    const submissionKey = randomBytes(18).toString("hex");

    const { data, error } = await supabase
      .from("cxrner_forms")
      .insert({
        telegram_id: user.id,
        username: body.contact_telegram?.trim() || null,
        artist_name: body.artist_name.trim(),
        track_name: body.track_name.trim(),
        genre: body.genre.trim(),
        release_type: body.release_type,
        submission_key: submissionKey,
        status: "pending",
        source: "web",
        form_payload: formPayload,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Не удалось сохранить заявку в базу." },
        { status: 500 },
      );
    }

    // Notify Telegram bot if configured
    const botUrl = process.env.BOT_BACKEND_URL;
    if (!botUrl) {
      // Saved in Supabase successfully, but bot backend is not yet attached
      return NextResponse.json({
        ok: true,
        id: data.id,
        botNotified: false,
        warning: "Заявка успешно сохранена в базе. Уведомление в Telegram-бот ожидает настройки BOT_BACKEND_URL.",
      });
    }

    try {
      const botPayload = {
        form_id: data.id,
        artist_name: body.artist_name.trim(),
        track_name: body.track_name.trim(),
        genre: body.genre.trim(),
        release_type: body.release_type,
        source: "web",
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (process.env.BOT_BACKEND_SECRET) {
        headers["x-cxrner-secret"] = process.env.BOT_BACKEND_SECRET;
        headers["authorization"] = `Bearer ${process.env.BOT_BACKEND_SECRET}`;
        headers["x-secret-key"] = process.env.BOT_BACKEND_SECRET;
        headers["x-api-key"] = process.env.BOT_BACKEND_SECRET;
      }

      const botRes = await fetch(`${botUrl}/api/new-release`, {
        method: "POST",
        headers,
        body: JSON.stringify(botPayload),
      });

      if (!botRes.ok) {
        const text = await botRes.text().catch(() => "");
        console.warn(
          `[Forms Submit] Release ${data.id} saved in Supabase, but Telegram bot webhook returned status ${botRes.status}: ${text || botRes.statusText}`,
        );
        return NextResponse.json({
          ok: true,
          id: data.id,
          botNotified: false,
        });
      }

      return NextResponse.json({ ok: true, id: data.id, botNotified: true });
    } catch (botErr: any) {
      console.warn(`[Forms Submit] Release ${data.id} saved in Supabase, but bot unreachable:`, botErr.message);
      return NextResponse.json({
        ok: true,
        id: data.id,
        botNotified: false,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
