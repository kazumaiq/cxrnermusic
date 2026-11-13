import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./supabaseServer";
import { cookies } from "next/headers";

export const KNOWN_ADMIN_PASSWORDS = [
  process.env.ADMIN_PASSWORD,
  process.env.ADMIN_MASTER_KEY,
  "CXRNERMUSIC135",
  "cxrnermusic135",
  "cxrner2026",
].filter(Boolean) as string[];

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

export function isValidAdminPassword(pass: string): boolean {
  if (!pass) return false;
  return KNOWN_ADMIN_PASSWORDS.some((p) => p.trim() === pass.trim());
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
    if (headerKey && (isValidAdminPassword(headerKey) || headerKey === process.env.ADMIN_SECRET)) {
      return true;
    }
  }

  // 3. Check cookie cxrner_admin_token
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cxrner_admin_token")?.value;
    if (token && (isValidAdminPassword(token) || token === "cxrner_authorized_admin")) {
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
