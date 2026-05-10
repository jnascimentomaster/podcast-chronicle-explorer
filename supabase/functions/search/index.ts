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

    const { query, limit = 12, min_similarity = 0.28 } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "query inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const queryEmbedding = await embed(query.trim());

    const { data, error } = await supabase.rpc("search_episodes", {
      query_embedding: queryEmbedding,
      match_count: Math.min(Math.max(limit, 1), 50),
      min_similarity: typeof min_similarity === "number" ? min_similarity : 0.28,
    });

    if (error) {
      console.error("RPC search_episodes error:", error);
      throw new Error(`RPC error: ${error.message}`);
    }

    const top = Array.isArray(data) && data.length > 0 ? data[0].similarity : null;
    console.log(`search: query="${query}" results=${data?.length ?? 0} top_sim=${top}`);

    return new Response(
      JSON.stringify({ results: data ?? [] }),
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