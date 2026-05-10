import { createClient } from "@supabase/supabase-js";
import type { Episode } from "@/types/episode";

// Credenciais públicas do projecto Supabase existente.
// Cola aqui o teu URL e anon key — são chaves públicas, podem ficar no código.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export type Database = {
  public: {
    Tables: {
      episodes: {
        Row: Episode;
        Insert: Partial<Episode>;
        Update: Partial<Episode>;
      };
    };
  };
};

export const supabase = createClient<Database>(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
  {
    auth: { persistSession: false },
  },
);