import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export type EntityType = "personagem" | "lugar" | "livro";

export interface EntityRow {
  id: string;
  type: EntityType;
  subtype: string | null;
  canonical_name: string;
  slug: string;
  aliases: string[] | null;
  episode_count: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface EntityEpisodeRow {
  entity_id: string;
  type: EntityType;
  subtype: string | null;
  canonical_name: string;
  slug: string;
  episode_count: number | null;
  episode_id: number;
  episode_slug: string;
  episode_title: string;
  episode_number: number | null;
  published_at: string | null;
}

// Lista paginada de entidades de um tipo, ordenada por episode_count desc.
export function useEntityList(type: EntityType, page: number, pageSize = 60) {
  return useQuery({
    queryKey: ["entities", type, page, pageSize],
    enabled: supabaseConfigured,
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("entities" as never)
        .select("id,type,subtype,canonical_name,slug,aliases,episode_count", { count: "exact" })
        .eq("type", type)
        .order("episode_count", { ascending: false, nullsFirst: false })
        .order("canonical_name", { ascending: true })
        .range(from, to);
      if (error) throw error;
      return { rows: (data ?? []) as EntityRow[], total: count ?? 0 };
    },
  });
}

// Pesquisa server-side por canonical_name OU aliases.
export function useEntitySearch(type: EntityType, query: string, limit = 80) {
  const q = query.trim();
  return useQuery({
    queryKey: ["entities-search", type, q, limit],
    enabled: supabaseConfigured && q.length >= 2,
    queryFn: async () => {
      // Postgres OR + ilike + array contains (aliases é text[]).
      // Como aliases é array, usamos `cs` (contains) com um array de candidatos é difícil sem normalizar;
      // optamos por ilike no canonical_name e filtrar aliases client-side em fallback.
      const { data, error } = await supabase
        .from("entities" as never)
        .select("id,type,subtype,canonical_name,slug,aliases,episode_count")
        .eq("type", type)
        .ilike("canonical_name", `%${q}%`)
        .order("episode_count", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as EntityRow[];
    },
  });
}

export function useEntityBySlug(type: EntityType, slug: string | undefined) {
  return useQuery({
    queryKey: ["entity", type, slug],
    enabled: !!slug && supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities" as never)
        .select("id,type,subtype,canonical_name,slug,aliases,episode_count,metadata")
        .eq("type", type)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as EntityRow | null;
    },
  });
}

export function useEntityEpisodes(type: EntityType, slug: string | undefined) {
  return useQuery({
    queryKey: ["entity-episodes", type, slug],
    enabled: !!slug && supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_episodes" as never)
        .select(
          "entity_id,type,subtype,canonical_name,slug,episode_count,episode_id,episode_slug,episode_title,episode_number,published_at",
        )
        .eq("type", type)
        .eq("slug", slug!)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EntityEpisodeRow[];
    },
  });
}

// Entidades de UM episódio (para cross-linking nas pills).
export function useEpisodeEntities(episodeId: string | number | undefined) {
  return useQuery({
    queryKey: ["episode-entities", episodeId],
    enabled: episodeId != null && supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_episodes" as never)
        .select("entity_id,type,subtype,canonical_name,slug")
        .eq("episode_id", episodeId!);
      if (error) throw error;
      return (data ?? []) as Array<{
        entity_id: string;
        type: EntityType;
        subtype: string | null;
        canonical_name: string;
        slug: string;
      }>;
    },
  });
}

// Livros agregados para o índice /livros: usamos a view entity_episodes
// para apanhar o subtype por episódio e devolver por livro o nº de eps em cada secção.
export interface BookAggregate {
  entity_id: string;
  canonical_name: string;
  slug: string;
  recomendado_count: number;
  citado_count: number;
  total: number;
  authors?: string[] | null;
}

export function useBooksAggregated() {
  return useQuery({
    queryKey: ["books-aggregated"],
    enabled: supabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const all: Array<{
        entity_id: string;
        canonical_name: string;
        slug: string;
        link_subtype: string | null;
      }> = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("entity_episodes" as never)
          .select("entity_id,canonical_name,slug,link_subtype")
          .eq("type", "livro")
          .range(from, from + PAGE - 1);
        if (error) {
          console.error("[useBooksAggregated] entity_episodes error:", error);
          throw error;
        }
        const rows = (data ?? []) as typeof all;
        all.push(...rows);
        if (rows.length < PAGE) break;
      }
      const map = new Map<string, BookAggregate>();
      for (const r of all) {
        const cur = map.get(r.entity_id) ?? {
          entity_id: r.entity_id,
          canonical_name: r.canonical_name,
          slug: r.slug,
          recomendado_count: 0,
          citado_count: 0,
          total: 0,
        };
        if (r.link_subtype === "recomendado") cur.recomendado_count += 1;
        else if (r.link_subtype === "citado") cur.citado_count += 1;
        cur.total += 1;
        map.set(r.entity_id, cur);
      }

      // Buscar metadata (autores) de todos os livros.
      const meta: Array<{ id: string; metadata: Record<string, unknown> | null }> = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("entities" as never)
          .select("id,metadata")
          .eq("type", "livro")
          .range(from, from + PAGE - 1);
        if (error) {
          console.error("[useBooksAggregated] entities metadata error:", error);
          throw error;
        }
        const rows = (data ?? []) as typeof meta;
        meta.push(...rows);
        if (rows.length < PAGE) break;
      }
      const authorsById = new Map<string, string[]>();
      for (const row of meta) {
        const md = (row.metadata ?? {}) as { author?: string | null; authors?: unknown };
        let list: string[] = [];
        if (Array.isArray(md.authors)) {
          list = (md.authors as unknown[])
            .filter((x): x is string => typeof x === "string" && x.trim().length > 0);
        }
        if (list.length === 0 && typeof md.author === "string" && md.author.trim().length > 0) {
          list = [md.author.trim()];
        }
        if (list.length > 0) authorsById.set(row.id, list);
      }
      for (const b of map.values()) {
        const a = authorsById.get(b.entity_id);
        if (a) b.authors = a;
      }
      return Array.from(map.values());
    },
  });
}

// Para a página individual de um livro: episódios + subtype por episódio.
export function useBookEpisodes(slug: string | undefined) {
  return useQuery({
    queryKey: ["book-episodes", slug],
    enabled: !!slug && supabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_episodes" as never)
        .select(
          "entity_id,link_subtype,canonical_name,slug,episode_id,episode_slug,episode_title,episode_number,published_at",
        )
        .eq("type", "livro")
        .eq("slug", slug!)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        entity_id: string;
        link_subtype: string | null;
        canonical_name: string;
        slug: string;
        episode_id: number;
        episode_slug: string;
        episode_title: string;
        episode_number: number | null;
        published_at: string | null;
      }>;
    },
  });
}