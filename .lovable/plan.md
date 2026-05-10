## Problema

A RPC `search_episodes` existe e os 96 chunks têm embeddings, mas a pesquisa devolve sempre `[]` por dois motivos:

1. **Threshold demasiado alto.** A RPC tem `min_similarity DEFAULT 0.5`. A edge function não passa esse parâmetro, então fica em 0.5 — em corpora pequenos (96 chunks) e com `text-embedding-3-small`, a similaridade típica para queries genéricos como "diplomacia portuguesa" anda entre 0.25 e 0.45. Resultado: filtra tudo.

2. **Colunas devolvidas não batem com o frontend.** A RPC devolve `episode_id, slug, title, chunk_text, chunk_index, similarity`. O frontend (`SearchResult` em `useSemanticSearch.ts` e a UI em `Pesquisa.tsx`) espera também `episode_number` e `published_at`, e assume `episode_id` como string (a RPC devolve `integer`).

## Solução

### 1. Recriar a RPC para devolver os campos que a UI mostra e baixar o threshold default

Migration SQL a correr no Supabase (Dashboard → SQL Editor, ou via CLI):

```sql
create or replace function public.search_episodes(
  query_embedding vector,
  match_count integer default 12,
  min_similarity double precision default 0.15
)
returns table(
  episode_id integer,
  slug text,
  episode_number integer,
  title text,
  published_at timestamptz,
  chunk_text text,
  chunk_index integer,
  similarity double precision
)
language sql stable
as $$
  select
    e.id            as episode_id,
    e.slug,
    e.episode_number,
    e.title,
    e.published_at,
    c.chunk_text,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity
  from episode_chunks c
  join episodes e on e.id = c.episode_id
  where 1 - (c.embedding <=> query_embedding) > min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

Notas:
- Ajusta os nomes/tipos de `episode_number` e `published_at` ao que existe mesmo na tabela `episodes` (podem ser `int`/`text`/`date`/`timestamp`). Se algum não existir, retiramos da RETURNS.
- `0.15` é um default seguro para corpus pequeno; a edge function vai passar explicitamente.

### 2. Edge function — passar `min_similarity` e logging

Em `supabase/functions/search/index.ts`:
- Passar `min_similarity: 0.15` no `supabase.rpc("search_episodes", {...})`.
- Aceitar override opcional via body (`min_similarity` no JSON) para podermos afinar a partir do cliente sem redeploy.
- Adicionar log do nº de resultados e do top-similarity para diagnóstico.

Depois redeploy:
```
npx supabase functions deploy search --no-verify-jwt --project-ref voaypwubagvhedtrootg
```

### 3. Frontend — alinhar tipos

Em `src/hooks/useSemanticSearch.ts`:
- Mudar `episode_id: string` → `episode_id: number`.
- Manter `episode_number` e `published_at` opcionais (`number | null`, `string | null`) — já são tratados como nullable na UI.

`Pesquisa.tsx` não precisa de mudar (já lida com `episode_number != null` e `formatDate(published_at)`).

## Validação

1. Correr a migration SQL.
2. Redeploy da edge function.
3. Pesquisar "diplomacia portuguesa" → devem aparecer resultados com % de relevância ≥ 15%.
4. Se ainda vier vazio, baixar o threshold para `0.05` temporariamente e inspeccionar os logs (`npx supabase functions logs search --tail`) para ver o top-similarity real.

## Pergunta antes de avançar

Confirmas que a tabela `episodes` tem mesmo as colunas `episode_number` e `published_at`? Se os nomes forem diferentes (ex.: `number`, `date`, `pub_date`), diz-me os nomes reais para eu ajustar a RETURNS da função.