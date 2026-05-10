import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Episode } from "@/types/episode";

const FULL_SELECT =
  "id,slug,episode_number,title,published_at,duration_seconds,url,resumo,ideias_principais,personagens,paises,epocas,temas,eventos,guerras_conflitos,livros_recomendados,livros_citados,filmes_documentarios,tipo_episodio,ligacao_portugal,controversia,complexidade,source";

export function useEpisodeBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["episode", slug],
    enabled: !!slug && supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select(FULL_SELECT)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as Episode | null;
    },
  });
}

export function useEpisodeNeighbours(publishedAt: string | null | undefined) {
  return useQuery({
    queryKey: ["episode", "neighbours", publishedAt],
    enabled: !!publishedAt && supabaseConfigured,
    queryFn: async () => {
      const [prev, next] = await Promise.all([
        supabase
          .from("episodes")
          .select("slug,title,episode_number")
          .lt("published_at", publishedAt!)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("episodes")
          .select("slug,title,episode_number")
          .gt("published_at", publishedAt!)
          .order("published_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        prev: (prev.data ?? null) as { slug: string; title: string; episode_number: number | null } | null,
        next: (next.data ?? null) as { slug: string; title: string; episode_number: number | null } | null,
      };
    },
  });
}

export function useEpisodeTranscript(episodeId: string | undefined) {
  return useQuery({
    queryKey: ["episode", "transcript", episodeId],
    enabled: !!episodeId && supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_chunks" as any)
        .select("chunk_text")
        .eq("episode_id", episodeId!)
        .order("id", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as { chunk_text: string }[]).map((r) => r.chunk_text);
    },
  });
}