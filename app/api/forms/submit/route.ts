import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";

type Body = {
  artist_name: string;
  track_name: string;
  genre: string;
  release_type: string;
  release_date: string | null;
  cover_link: string | null;
  audio_link: string | null;
  links: string | null;
  promo_text: string | null;
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
      cover_link: body.cover_link,
      audio_link: body.audio_link,
      links: body.links,
      promo_text: body.promo_text,
      source: "web",
    };

    const { data, error } = await supabase
      .from("cxrner_forms")
      .insert({
        user_id: user.id,
        artist_name: body.artist_name,
        track_name: body.track_name,
        genre: body.genre,
        release_type: body.release_type,
        status: "pending",
        source: "web",
        form_payload: formPayload,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: error?.message ?? "Ошибка сохранения" }, { status: 500 });
    }

    // уведомляем Telegram-бота (без падения формы при ошибке)
    try {
      const botPayload = {
        form_id: data.id,
        artist_name: body.artist_name,
        track_name: body.track_name,
        genre: body.genre,
        release_type: body.release_type,
      };
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/new-release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(botPayload),
      });
    } catch {
      // логирование можно добавить позже, но не ломаем UX
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Ошибка сервера" }, { status: 500 });
  }
}

