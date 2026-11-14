import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  generateVerificationCode,
  submitVerificationApplication,
  getArtistProfileByUserId,
  getVerificationByUserId,
} from "@/lib/ecosystemDb";

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Action to generate new code
    if (action === "generate_code") {
      const code = await generateVerificationCode(user.id);
      return NextResponse.json({ ok: true, code });
    }

    const artistProfile = await getArtistProfileByUserId(user.id);
    const verData = await getVerificationByUserId(user.id);

    return NextResponse.json({
      ok: true,
      artistProfile,
      verification: verData,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const { stageName, method, evidenceLinks, evidenceNotes, verificationCode } = body;

    if (!stageName || !stageName.trim()) {
      return NextResponse.json(
        { ok: false, error: "Укажите сценическое имя артиста" },
        { status: 400 }
      );
    }

    const application = await submitVerificationApplication({
      userId: user.id,
      stageName: stageName.trim(),
      method: method || "manual",
      evidenceLinks: Array.isArray(evidenceLinks) ? evidenceLinks : [],
      evidenceNotes: evidenceNotes || "",
      verificationCode: verificationCode || null,
    });

    return NextResponse.json({ ok: true, application });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
