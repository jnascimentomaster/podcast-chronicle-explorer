import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export interface AnchoredEpisode {
  slug: string;
  episode_number: number | null;
  title: string;
  ano_foco: number;
  timeline_confianca: number | null;
}

export interface TransversalEpisode {
  slug: string;
  episode_number: number | null;
  title: string;
  ano_inicio: number | null;
  ano_fim: number | null;
}

export function useAnchoredEpisodes() {
  return useQuery({
    queryKey: ["timeline", "ancorado"],
    enabled: supabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes" as never)
        .select("slug,episode_number,title,ano_foco,timeline_confianca")
        .eq("timeline_tipo", "ancorado")
        .not("ano_foco", "is", null)
        .order("ano_foco", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as AnchoredEpisode[];
    },
  });
}

export function useTransversalEpisodes() {
  return useQuery({
    queryKey: ["timeline", "transversal"],
    enabled: supabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes" as never)
        .select("slug,episode_number,title,ano_inicio,ano_fim")
        .eq("timeline_tipo", "transversal")
        .order("ano_inicio", { ascending: true, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as TransversalEpisode[];
    },
  });
}

export interface Band {
  key: string;
  label: string;
  min: number; // inclusive
  max: number; // inclusive
}

export const BANDS: Band[] = [
  { key: "antiguidade", label: "Antiguidade", min: -10000, max: 499 },
  { key: "idade-media", label: "Idade Média", min: 500, max: 1499 },
  { key: "xvi-xvii", label: "Séculos XVI–XVII", min: 1500, max: 1699 },
  { key: "xviii", label: "Século XVIII", min: 1700, max: 1799 },
  { key: "xix-1", label: "Primeira metade do séc. XIX", min: 1800, max: 1849 },
  { key: "xix-2", label: "Segunda metade do séc. XIX", min: 1850, max: 1899 },
  { key: "1900s", label: "1900–1919", min: 1900, max: 1919 },
  { key: "1920s", label: "Anos 1920–30", min: 1920, max: 1939 },
  { key: "1940s", label: "Anos 1940", min: 1940, max: 1949 },
  { key: "1950s", label: "Anos 1950", min: 1950, max: 1959 },
  { key: "1960s", label: "Anos 1960", min: 1960, max: 1969 },
  { key: "1970s", label: "Anos 1970", min: 1970, max: 1979 },
  { key: "1980s", label: "Anos 1980", min: 1980, max: 1989 },
  { key: "1990s", label: "Anos 1990", min: 1990, max: 1999 },
  { key: "xxi", label: "Século XXI", min: 2000, max: 9999 },
];

export function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} a.C.`;
  return String(y);
}

export function formatRange(a: number | null, b: number | null): string {
  if (a == null && b == null) return "—";
  if (a != null && b != null) return `${formatYear(a)} – ${formatYear(b)}`;
  if (a != null) return `desde ${formatYear(a)}`;
  return `até ${formatYear(b!)}`;
}