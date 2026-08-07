import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./supabaseServer";

function splitEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: Pick<User, "id" | "email"> | null | undefined) {
  if (!user) return false;
  const ids = splitEnv(process.env.ADMIN_USER_IDS);
  const emails = splitEnv(process.env.ADMIN_EMAILS);
  return ids.includes(user.id.toLowerCase()) || Boolean(user.email && emails.includes(user.email.toLowerCase()));
}

export async function getAdminUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return isAdminUser(user) ? user : null;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("ADMIN_UNAUTHORIZED");
  return user;
}
