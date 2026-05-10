## Problema

O `CREATE OR REPLACE FUNCTION` falha com `42P13` porque a RPC `search_episodes` já existe com um RETURNS TABLE diferente (sem `episode_number` e `published_at`). O Postgres não permite mudar o tipo de retorno via `OR REPLACE` — é preciso fazer DROP primeiro.

## Solução

Correr este SQL no Supabase Dashboard → SQL Editor (substitui o anterior):

```sql
drop function if exists public.search_episodes(vector, integer, double precision);

create function public.search_episodes(
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

## Se der erro nas colunas

Se o SQL falhar agora a queixar-se de `episode_number` ou `published_at` não existirem na tabela `episodes`, diz-me o erro exacto (ou os nomes reais das colunas) e ajusto a função — possíveis alternativas: `number`, `ep_number`, `date`, `pub_date`, `created_at`.

## Validação

1. Correr o SQL acima.
2. Pesquisar "diplomacia portuguesa" no site — devem aparecer resultados.
3. Se vier vazio, ver `npx supabase functions logs search --tail` para o `top_sim` e baixamos o threshold se preciso.

A edge function e o frontend já estão alinhados; só falta esta migration correr com sucesso.
