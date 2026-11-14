import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseServer";

const MEDIA_BUCKET = "cxrner-media";
const MAX_UPLOAD_BYTES = 2_500_000;

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const kind = body.kind === "banner" ? "banner" : "avatar";
    const dataUrl = String(body.dataUrl || "").trim();

    const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) {
      return NextResponse.json(
        { ok: false, error: "Поддерживаются изображения PNG, JPG, WEBP или GIF" },
        { status: 400 }
      );
    }

    const contentType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const buffer = Buffer.from(match[2], "base64");

    if (buffer.byteLength === 0 || buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Размер сжатого изображения не должен превышать 2.5 МБ" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    if (admin) {
      try {
        const { data: buckets } = await admin.storage.listBuckets();
        const exists = Array.isArray(buckets) && buckets.some((b) => b.name === MEDIA_BUCKET);
        if (!exists) {
          await admin.storage.createBucket(MEDIA_BUCKET, {
            public: true,
            fileSizeLimit: MAX_UPLOAD_BYTES,
          });
        }

        const filePath = `profiles/${user.id}/${kind}_${Date.now()}.${ext}`;
        const { error: uploadErr } = await admin.storage
          .from(MEDIA_BUCKET)
          .upload(filePath, buffer, {
            contentType,
            upsert: true,
            cacheControl: "31536000",
          });

        if (!uploadErr) {
          const { data: pubData } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
          if (pubData?.publicUrl) {
            return NextResponse.json({
              ok: true,
              url: pubData.publicUrl,
              storage: "supabase",
            });
          }
        }
      } catch {
        // Fallback smoothly to compact inline Data URL
      }
    }

    // Fallback: return compact client-compressed Data URL (< ~180 KB)
    return NextResponse.json({
      ok: true,
      url: dataUrl,
      storage: "inline",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Ошибка загрузки изображения" },
      { status: 500 }
    );
  }
}
