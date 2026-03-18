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
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Не авторизован" }, { status: 401 });
    }

    const body = (await request.json()) as Body;

    if (!body.artist_name || !body.track_name || !body.genre) {
      return NextResponse.json({ ok: false, error: "Неверные данные" }, { status: 400 });
    }

    const formPayload = {
      artist_name: body.artist_name,
      track_name: body.track_name,
      genre: body.genre,
      release_type: body.release_type,
      release_date: body.release_date,
      cover_link: body.cover_link ?? null,
      audio_link: body.audio_link,
      files_link: body.files_link ?? body.audio_link ?? null,
      links: body.links,
      promo_text: body.promo_text,
      subtitle: body.subtitle ?? null,
      has_words: body.has_words ?? null,
      artist_full_name: body.artist_full_name ?? null,
      version: body.version ?? null,
      yandex_card_link: body.yandex_card_link ?? null,
      has_explicit: body.has_explicit ?? null,
      comment: body.comment ?? null,
      contact_telegram: body.contact_telegram ?? null,
      source: "web",
    };

    // `cxrner_forms.submission_key` — NOT NULL в текущей схеме.
    // Используем короткий случайный ключ, чтобы бот мог дальше отслеживать анкету.
    const submissionKey = randomBytes(18).toString("hex");

    const { data, error } = await supabase
      .from("cxrner_forms")
      .insert({
        // В `cxrner_forms` связь с пользователем хранится через `telegram_id` (веб-сабмишн связываем с auth user.id).
        telegram_id: user.id,
        // Telegram-бот хранит username сабмиттера. Для веба используем введённый `contact_telegram`.
        username: body.contact_telegram ?? null,
        artist_name: body.artist_name,
        track_name: body.track_name,
        genre: body.genre,
        release_type: body.release_type,
        submission_key: submissionKey,
        status: "pending",
        source: "web",
        form_payload: formPayload,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: error?.message ?? "Ошибка сохранения" }, { status: 500 });
    }

    // уведомляем Telegram-бота
    const botUrl = process.env.BOT_BACKEND_URL;
    if (!botUrl) {
      return NextResponse.json({ ok: false, error: "BOT_BACKEND_URL не настроен" }, { status: 500 });
    }

    const botPayload = {
      form_id: data.id,
      artist_name: body.artist_name,
      track_name: body.track_name,
      genre: body.genre,
      release_type: body.release_type,
    };

    const botRes = await fetch(`${botUrl}/api/new-release`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(botPayload),
    });

    if (!botRes.ok) {
      const text = await botRes.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Ошибка бэкенда бота (${botRes.status}): ${text || botRes.statusText}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Ошибка сервера" }, { status: 500 });
  }
}

