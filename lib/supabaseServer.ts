import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wjhqtrfsuudiogpwwzgx.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaHF0cmZzdXVkaW9ncHd3emd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTE3OTYsImV4cCI6MjEwMTY4Nzc5Nn0.fNVIC3dZuz7LLUTE0aOnF4ILVKBYXcftdU1ZjXyMZmo";

export function getResolvedSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  );
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  const supabaseUrl = getResolvedSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getEcosystemDbClient(): Promise<{
  client: SupabaseClient | null;
  isAdmin: boolean;
}> {
  const adminClient = getSupabaseAdminClient();
  if (adminClient) {
    return { client: adminClient, isAdmin: true };
  }

  try {
    const serverClient = await getSupabaseServerClient();
    return { client: serverClient, isAdmin: false };
  } catch {
    // Running outside request scope (e.g. CLI test scripts)
    return { client: null, isAdmin: false };
  }
}

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const supabaseUrl = getResolvedSupabaseUrl();

  const supabaseAnonKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error("Supabase anon key is not set");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from Server Component
        }
      },
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Can be ignored
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Can be ignored
        }
      },
    },
  });
}
