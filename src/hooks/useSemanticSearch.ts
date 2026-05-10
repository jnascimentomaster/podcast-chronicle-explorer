import { useQuery } from "@tanstack/react-query";
import { supabaseConfigured } from "@/lib/supabase";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

export interface SearchResult {
  episode_id: number;
  slug: string;
  episode_number: number | null;
  title: string;
  published_at: string | null;
  chunk_text: string;
  chunk_index?: number;
  similarity: number;
  score?: number;
  matches?: number;
}

export function useSemanticSearch(query: string, limit = 12) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["search", trimmed, limit],
    enabled: supabaseConfigured && trimmed.length >= 2,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ query: trimmed, limit }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pesquisa falhou (${res.status}): ${text}`);
      }
      const json = await res.json();
      return (json.results ?? []) as SearchResult[];
    },
  });
}
