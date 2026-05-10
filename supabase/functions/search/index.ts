// Edge function: pesquisa semântica do História Explorer.
//
// DEPLOY NO TEU PROJECTO SUPABASE (não no Lovable):
//
//   1. Define o secret OPENAI_API_KEY no teu projecto:
//        supabase secrets set OPENAI_API_KEY=sk-...
//
//   2. Deploy a função:
//        supabase functions deploy search --project-ref voaypwubagvhedtrootg
//
//   3. (opcional) Para que possa ser chamada com a anon key sem JWT:
//        supabase functions deploy search --no-verify-jwt --project-ref voaypwubagvhedtrootg
//
// A função espera que exista uma RPC `search_episodes` no schema public
// que aceita um embedding vector(1536) e devolve linhas com:
//   episode_id, slug, episode_number, title, published_at, chunk_text, similarity
// Ajusta o nome dos parâmetros abaixo se a tua função usar outros.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const STOPWORDS = new Set([
  "a", "ao", "aos", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos", "o", "os", "para", "por", "um", "uma",
]);

function meaningfulTerms(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length >= 3 && !STOPWORDS.has(term));
}

function isHybridMissing(error: { message?: string; code?: string } | null): boolean {
  const haystack = `${error?.code ?? ""} ${error?.message ?? ""}`;
  return /hybrid_search_episodes|PGRST202|schema cache|could not find.*function/i.test(haystack);
}

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.data[0].embedding as number[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não está configurada nos secrets do projecto.");
    }

    const { query, limit = 12 } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "query inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const trimmed = query.trim();
    const queryEmbedding = await embed(trimmed);
    const matchCount = Math.min(Math.max(limit, 1), 50);

    const terms = meaningfulTerms(trimmed);
    let searchMode = "hybrid";

    // Hybrid: vector + full-text com RRF, agregado por episódio.
    let { data, error } = await supabase.rpc("hybrid_search_episodes", {
      query_text: trimmed,
      query_embedding: queryEmbedding,
      match_count: matchCount,
      candidates: 120,
    });

    // Para queries com várias palavras, não aceitamos fallback vector-only: é precisamente
    // isso que devolve resultados fracos que só contêm “portuguesa”, etc.
    if (error && isHybridMissing(error) && terms.length >= 2) {
      throw new Error(
        "A pesquisa híbrida ainda não está activa na base de dados. Corre o SQL supabase/sql/hybrid_search.sql e volta a fazer deploy da função search.",
      );
    }

    // Fallback para a RPC antiga apenas em queries curtas/1 termo.
    if (error && isHybridMissing(error)) {
      searchMode = "legacy_vector";
      console.warn("hybrid_search_episodes não existe — fallback vector-only para query curta");
      const fb = await supabase.rpc("search_episodes", {
        query_embedding: queryEmbedding,
        match_count: matchCount,
        min_similarity: 0.28,
      });
      data = fb.data;
      error = fb.error;
    }

    if (error) {
      console.error("RPC error:", error);
      throw new Error(`RPC error: ${error.message}`);
    }

    // Threshold dinâmico só no fallback vector-only. Na pesquisa híbrida, a componente
    // lexical já filtra resultados e alguns matches bons podem ter similarity baixa.
    let results = Array.isArray(data) ? data : [];
    if (searchMode === "legacy_vector" && results.length > 0) {
      const topSim = results[0].similarity ?? 0;
      const cutoff = Math.max(0.22, topSim - 0.12);
      results = results.filter((r: { similarity?: number }) =>
        (r.similarity ?? 0) >= cutoff
      );
    }

    results = results.map((row: Record<string, unknown>) => ({ ...row, search_mode: searchMode }));

    console.log(
      `search: mode=${searchMode} q="${trimmed}" total=${data?.length ?? 0} kept=${results.length} top=${results[0]?.similarity ?? null}`,
    );

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("search function error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});