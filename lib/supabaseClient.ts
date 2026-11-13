import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://wjhqtrfsuudiogpwwzgx.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaHF0cmZzdXVkaW9ncHd3emd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTE3OTYsImV4cCI6MjEwMTY4Nzc5Nn0.fNVIC3dZuz7LLUTE0aOnF4ILVKBYXcftdU1ZjXyMZmo";

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase не настроен на сайте. Укажите NEXT_PUBLIC_SUPABASE_ANON_KEY в настройках Vercel."
    );
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
