import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export interface LugarMapPoint {
  canonical_name: string;
  slug: string;
  episode_count: number | null;
  lat: number;
  lng: number;
}

export function useLugaresMap() {
  return useQuery({
    queryKey: ["lugares-map"],
    enabled: supabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities" as never)
        .select("canonical_name,slug,episode_count,lat,lng")
        .eq("type", "lugar")
        .not("lat", "is", null)
        .order("episode_count", { ascending: false, nullsFirst: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as LugarMapPoint[];
    },
  });
}