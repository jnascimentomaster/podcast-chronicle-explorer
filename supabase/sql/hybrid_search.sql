-- =====================================================================
-- Hybrid search: vector + full-text (websearch_to_tsquery) com RRF.
-- Correr UMA VEZ no SQL editor do projecto Supabase voaypwubagvhedtrootg.
--
-- ASSUNÇÕES (ajusta se os nomes forem diferentes):
--   - tabela de chunks chama-se `episode_chunks`
--   - colunas: id, episode_id, chunk_index, chunk_text, embedding vector(1536)
--   - tabela `episodes` tem: id, slug, episode_number, title, published_at
--
-- Se a tua tabela de chunks tiver outro nome, faz find/replace de
-- `episode_chunks` antes de correr.
-- =====================================================================

-- 1) Coluna tsvector materializada (português) + índice GIN.
alter table public.episode_chunks
  add column if not exists chunk_tsv tsvector
  generated always as (to_tsvector('portuguese', coalesce(chunk_text, ''))) stored;

create index if not exists episode_chunks_tsv_idx
  on public.episode_chunks using gin (chunk_tsv);

-- 2) RPC hybrid_search_episodes — RRF entre top-N vector e top-N FTS,
--    agrega por episódio (max similarity + bónus por nº de matches),
--    devolve o melhor chunk para preview.
create or replace function public.hybrid_search_episodes(
  query_text       text,
  query_embedding  vector(1536),
  match_count      int  default 12,
  candidates       int  default 60,
  rrf_k            int  default 60
)
returns table (
  episode_id      bigint,
  slug            text,
  episode_number  int,
  title           text,
  published_at    timestamptz,
  chunk_text      text,
  chunk_index     int,
  similarity      float,
  score           float,
  matches         int
)
language sql stable as $$
  with q as (
    select websearch_to_tsquery('portuguese', query_text) as tsq
  ),
  vec as (
    select c.id, c.episode_id, c.chunk_index, c.chunk_text,
           1 - (c.embedding <=> query_embedding) as similarity,
           row_number() over (order by c.embedding <=> query_embedding) as rnk
    from public.episode_chunks c
    order by c.embedding <=> query_embedding
    limit candidates
  ),
  fts as (
    select c.id, c.episode_id, c.chunk_index, c.chunk_text,
           ts_rank_cd(c.chunk_tsv, (select tsq from q)) as rank,
           row_number() over (order by ts_rank_cd(c.chunk_tsv, (select tsq from q)) desc) as rnk
    from public.episode_chunks c
    where c.chunk_tsv @@ (select tsq from q)
    limit candidates
  ),
  fused as (
    select coalesce(v.id, f.id) as id,
           coalesce(v.episode_id, f.episode_id) as episode_id,
           coalesce(v.chunk_index, f.chunk_index) as chunk_index,
           coalesce(v.chunk_text, f.chunk_text) as chunk_text,
           coalesce(v.similarity, 0) as similarity,
           (case when v.rnk is not null then 1.0/(rrf_k + v.rnk) else 0 end)
         + (case when f.rnk is not null then 1.0/(rrf_k + f.rnk) else 0 end) as rrf,
           (case when f.rnk is not null then 1 else 0 end) as has_lex
    from vec v
    full outer join fts f on f.id = v.id
  ),
  per_chunk as (
    -- requer match lexical quando a query tem >= 2 palavras significativas;
    -- caso contrário aceita só vector.
    select * from fused
    where has_lex = 1
       or (select array_length(regexp_split_to_array(trim(query_text), '\s+'), 1)) < 2
  ),
  per_episode as (
    select episode_id,
           max(similarity) as similarity,
           sum(rrf)        as score,
           count(*)::int   as matches,
           (array_agg(chunk_text  order by rrf desc))[1] as chunk_text,
           (array_agg(chunk_index order by rrf desc))[1] as chunk_index
    from per_chunk
    group by episode_id
  )
  select e.id as episode_id, e.slug, e.episode_number, e.title, e.published_at,
         p.chunk_text, p.chunk_index, p.similarity, p.score, p.matches
  from per_episode p
  join public.episodes e on e.id = p.episode_id
  order by p.score desc, p.similarity desc
  limit match_count;
$$;

grant execute on function public.hybrid_search_episodes(text, vector, int, int, int)
  to anon, authenticated, service_role;
