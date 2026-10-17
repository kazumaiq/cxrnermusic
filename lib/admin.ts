import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./supabaseServer";
import { cookies } from "next/headers";

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cxrner2026";
const KNOWN_ADMIN_EMAILS = [
  "cxrner.label@gmail.com",
  "kazumaiq@gmail.com",
  "kazuma@cxrnermusic.com",
];

function splitEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: Pick<User, "id" | "email"> | null | undefined) {
  if (!user) return false;
  const ids = splitEnv(process.env.ADMIN_USER_IDS);
  const emails = [...splitEnv(process.env.ADMIN_EMAILS), ...KNOWN_ADMIN_EMAILS];
  return (
    ids.includes(user.id.toLowerCase()) ||
    Boolean(user.email && emails.includes(user.email.toLowerCase()))
  );
}

export async function getAdminUser() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return isAdminUser(user) ? user : null;
  } catch {
    return null;
  }
}

export async function verifyAdminRequest(request?: Request): Promise<boolean> {
  // 1. Check if user is logged in as admin via Supabase
  const user = await getAdminUser();
  if (user) return true;

  // 2. Check header x-admin-key
  if (request) {
    const headerKey = request.headers.get("x-admin-key");
    if (headerKey && (headerKey === DEFAULT_ADMIN_PASSWORD || headerKey === process.env.ADMIN_SECRET)) {
      return true;
    }
  }

  // 3. Check cookie cxrner_admin_token
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cxrner_admin_token")?.value;
    if (token && (token === DEFAULT_ADMIN_PASSWORD || token === "cxrner_authorized_admin")) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export async function requireAdmin(request?: Request) {
  const isAuthorized = await verifyAdminRequest(request);
  if (!isAuthorized) throw new Error("ADMIN_UNAUTHORIZED");
  return true;
}

