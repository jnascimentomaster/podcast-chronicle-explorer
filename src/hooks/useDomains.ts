import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { DOMAINS, type Domain } from "@/lib/domains";
import type { Episode } from "@/types/episode";

type DomainRow = Pick<Episode, "dominio_primario" | "dominio_secundario" | "tema_principal">;

export interface DomainStats {
  domain: Domain;
  count: number;
  topThemes: { name: string; count: number }[];
}

export function useDomainStats() {
  return useQuery({
    queryKey: ["domains", "stats"],
    enabled: supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("dominio_primario,dominio_secundario,tema_principal");
      if (error) throw error;

      const byDomain = new Map<string, { count: number; themes: Map<string, number> }>();
      for (const d of DOMAINS) byDomain.set(d, { count: 0, themes: new Map() });

      for (const row of (data ?? []) as DomainRow[]) {
        const seen = new Set<string>();
        for (const d of [row.dominio_primario, row.dominio_secundario]) {
          if (!d || seen.has(d)) continue;
          seen.add(d);
          const entry = byDomain.get(d);
          if (!entry) continue;
          entry.count += 1;
          if (row.tema_principal) {
            entry.themes.set(row.tema_principal, (entry.themes.get(row.tema_principal) ?? 0) + 1);
          }
        }
      }

      return DOMAINS.map<DomainStats>((d) => {
        const e = byDomain.get(d)!;
        return {
          domain: d,
          count: e.count,
          topThemes: [...e.themes.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt"))
            .slice(0, 3)
            .map(([name, count]) => ({ name, count })),
        };
      });
    },
  });
}

export function useDomainThemes(domain: Domain | null) {
  return useQuery({
    queryKey: ["domains", "themes", domain],
    enabled: supabaseConfigured && !!domain,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("tema_principal,dominio_primario,dominio_secundario")
        .or(`dominio_primario.eq.${domain},dominio_secundario.eq.${domain}`);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as DomainRow[]) {
        if (!row.tema_principal) continue;
        counts.set(row.tema_principal, (counts.get(row.tema_principal) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt"));
    },
  });
}

const EP_SELECT = "id,slug,episode_number,title,published_at,duration_seconds,url,resumo,temas,personagens,paises,epocas,eventos,complexidade,ligacao_portugal,controversia,tipo_episodio,dominio_primario,dominio_secundario,tema_principal";

export function useEpisodesByTheme(domain: Domain | null, tema: string | null) {
  return useQuery({
    queryKey: ["domains", "episodesByTheme", domain, tema],
    enabled: supabaseConfigured && !!domain && !!tema,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select(EP_SELECT)
        .eq("tema_principal", tema!)
        .or(`dominio_primario.eq.${domain},dominio_secundario.eq.${domain}`)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Episode[];
    },
  });
}
