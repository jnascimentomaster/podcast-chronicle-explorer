// Edge function: pesquisa híbrida com query expansion
// v2: query expansion via OpenAI + tag boost no SQL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API_KEY         = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const STOPWORDS = new Set([
  "a","ao","aos","as","com","da","das","de","do","dos","e","em",
  "na","nas","no","nos","o","os","para","por","um","uma","que","se",
  "foi","era","ser","ter","há","mais","mas","isso","este","esta",
]);

function meaningfulTerms(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function isHybridMissing(error: { message?: string; code?: string } | null): boolean {
  const h = `${error?.code ?? ""} ${error?.message ?? ""}`;
  return /hybrid_search_episodes|PGRST202|schema cache|could not find.*function/i.test(h);
}

// ---------------------------------------------------------------------------
// Query expansion: enriquece a query com sinónimos e termos relacionados
// Usa GPT-4o-mini para ser rápido e barato (~$0.0001 por chamada)
// ---------------------------------------------------------------------------
async function expandQuery(query: string): Promise<string> {
  // Só expandir queries com 1-3 palavras significativas
  const terms = meaningfulTerms(query);
  if (terms.length === 0 || terms.length > 4) return query;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 60,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "És um especialista em história. Dado um termo de pesquisa em português, " +
              "devolve 4-6 termos relacionados separados por vírgula, sem explicações. " +
              "Inclui sinónimos, variantes e conceitos directamente relacionados. " +
              "Responde apenas com os termos, em português.",
          },
          { role: "user", content: query },
        ],
      }),
    });

    if (!res.ok) return query;

    const json = await res.json();
    const expanded = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!expanded) return query;

    // Combinar query original com termos expandidos
    const combined = `${query} ${expanded}`;
    console.log(`query expansion: "${query}" → "${combined}"`);
    return combined;

  } catch {
    // Em caso de erro, usar query original
    return query;
  }
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------
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
  if (!res.ok) throw new Error(`OpenAI embeddings: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não está configurada.");
    }

    const { query, limit = 12 } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "query inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const trimmed   = query.trim();
    const matchCount = Math.min(Math.max(limit, 1), 50);
    const terms     = meaningfulTerms(trimmed);

    // 1. Query expansion (paralelo com nada — rápido)
    const expandedQuery = await expandQuery(trimmed);

    // 2. Embedding da query expandida
    const queryEmbedding = await embed(expandedQuery);

    let searchMode = "hybrid";

    // 3. Hybrid search
    let { data, error } = await supabase.rpc("hybrid_search_episodes", {
      query_text:      trimmed,        // full-text usa a query original (mais precisa)
      query_embedding: queryEmbedding, // vector usa a query expandida (mais rica)
      match_count:     matchCount,
      candidates:      120,
    });

    // Fallback: se hybrid não existe e query tem múltiplos termos, abortar
    if (error && isHybridMissing(error) && terms.length >= 2) {
      throw new Error(
        "hybrid_search_episodes não encontrada. Corre migration_search_v2.sql no Supabase.",
      );
    }

    // Fallback vector-only para queries de 1 termo
    if (error && isHybridMissing(error)) {
      searchMode = "legacy_vector";
      console.warn("fallback vector-only (query curta)");
      const fb = await supabase.rpc("search_episodes", {
        query_embedding: queryEmbedding,
        match_count:     matchCount,
        min_similarity:  0.28,
      });
      data  = fb.data;
      error = fb.error;
    }

    if (error) throw new Error(`RPC error: ${error.message}`);

    let results = Array.isArray(data) ? data : [];

    // Threshold dinâmico só no fallback
    if (searchMode === "legacy_vector" && results.length > 0) {
      const topSim = results[0].similarity ?? 0;
      const cutoff = Math.max(0.22, topSim - 0.12);
      results = results.filter((r: { similarity?: number }) => (r.similarity ?? 0) >= cutoff);
    }

    results = results.map((row: Record<string, unknown>) => ({
      ...row,
      search_mode: searchMode,
    }));

    console.log(
      `search: mode=${searchMode} q="${trimmed}" expanded="${expandedQuery}" ` +
      `total=${data?.length ?? 0} kept=${results.length}`,
    );

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("search error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
