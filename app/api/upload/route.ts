import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "covers";

function safeFolder(input: string) {
  const cleaned = input.replace(/[^a-z0-9-_]/gi, "").trim();
  return cleaned || "uploads";
}

function buildFilePath(folder: string, fileName: string) {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "png";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${safeFolder(folder)}/${id}.${ext}`;
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return Response.json({ ok: false, error: "Supabase env не настроены" }, { status: 500 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const folder = typeof form.get("folder") === "string" ? String(form.get("folder")) : "uploads";

  if (!file || !(file instanceof File)) {
    return Response.json({ ok: false, error: "Файл не найден" }, { status: 400 });
  }

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const path = buildFilePath(folder, file.name || "cover.png");
  const { error } = await client.storage.from(bucketName).upload(path, file, {
    contentType: file.type || "image/*",
    upsert: false,
  });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const { data } = client.storage.from(bucketName).getPublicUrl(path);
  return Response.json({ ok: true, url: data.publicUrl });
}
