import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as
  string | undefined;
const supabasePublishableKey = import.meta.env
  .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
        auth: {
          // Sesi hanya di memori (tanpa persist/refresh otomatis): reload
          // berarti masuk kembali dan data selalu diambil fresh.
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

// Hapus sisa token basi dari era persistSession.
try {
  if (typeof localStorage !== "undefined") {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        localStorage.removeItem(key);
      }
    }
  }
} catch {
  // Storage tidak tersedia/diizinkan.
}

export const isSupabaseConfigured = Boolean(supabase);
