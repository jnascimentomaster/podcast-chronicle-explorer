import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Episode } from "@/types/episode";

const SELECT = "id,slug,episode_number,title,published_at,duration_seconds,url,resumo,temas,personagens,paises,epocas,eventos,complexidade,ligacao_portugal,controversia,tipo_episodio";

export interface EpisodeFilters {
  q?: string;
  tema?: string;
  pais?: string;
  epoca?: string;
  complexidade?: string;
  ligacaoPortugal?: boolean;
  page?: number;
  pageSize?: number;
}

export function useEpisodes(filters: EpisodeFilters = {}) {
  const {
    q, tema, pais, epoca, complexidade, ligacaoPortugal,
    page = 1, pageSize = 20,
  } = filters;

  return useQuery({
    queryKey: ["episodes", { q, tema, pais, epoca, complexidade, ligacaoPortugal, page, pageSize }],
    enabled: supabaseConfigured,
    queryFn: async () => {
      let query = supabase
        .from("episodes")
        .select(SELECT, { count: "exact" })
        .order("published_at", { ascending: false });

      if (q && q.trim()) query = query.ilike("title", `%${q.trim()}%`);
      if (tema) query = query.contains("temas", [tema]);
      if (pais) query = query.contains("paises", [pais]);
      if (epoca) query = query.contains("epocas", [epoca]);
      if (complexidade) query = query.eq("complexidade", complexidade);
      if (ligacaoPortugal) query = query.eq("ligacao_portugal", true);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.range(from, to);
      if (error) throw error;
      return { rows: (data ?? []) as Episode[], count: count ?? 0 };
    },
  });
}

export function useRecentEpisodes(limit = 6) {
  return useQuery({
    queryKey: ["episodes", "recent", limit],
    enabled: supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select(SELECT)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Episode[];
    },
  });
}

export function useEpisodeCount() {
  return useQuery({
    queryKey: ["episodes", "count"],
    enabled: supabaseConfigured,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("episodes")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useTopThemes(limit = 12) {
  return useQuery({
    queryKey: ["episodes", "topThemes", limit],
    enabled: supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.from("episodes").select("temas");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as { temas: string[] | null }[]) {
        for (const t of row.temas ?? []) {
          if (!t) continue;
          counts.set(t, (counts.get(t) ?? 0) + 1);
        }
      }
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));
    },
  });
}

export function useAllThemes() {
  return useQuery({
    queryKey: ["episodes", "allThemes"],
    enabled: supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.from("episodes").select("temas");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as { temas: string[] | null }[]) {
        for (const t of row.temas ?? []) {
          if (!t) continue;
          counts.set(t, (counts.get(t) ?? 0) + 1);
        }
      }
      return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt"));
    },
  });
}

export function useFacetValues() {
  return useQuery({
    queryKey: ["episodes", "facets"],
    enabled: supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("temas,paises,epocas,complexidade");
      if (error) throw error;
      const acc = { temas: new Set<string>(), paises: new Set<string>(), epocas: new Set<string>(), complexidade: new Set<string>() };
      for (const row of (data ?? []) as any[]) {
        for (const t of row.temas ?? []) acc.temas.add(t);
        for (const t of row.paises ?? []) acc.paises.add(t);
        for (const t of row.epocas ?? []) acc.epocas.add(t);
        if (row.complexidade) acc.complexidade.add(row.complexidade);
      }
      const sortPt = (a: string, b: string) => a.localeCompare(b, "pt");
      return {
        temas: [...acc.temas].sort(sortPt),
        paises: [...acc.paises].sort(sortPt),
        epocas: [...acc.epocas].sort(sortPt),
        complexidade: [...acc.complexidade].sort(sortPt),
      };
    },
  });
}