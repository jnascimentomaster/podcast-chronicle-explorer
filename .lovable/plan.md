
# História Explorer — Plano (Fase 1)

Construção faseada. Esta fase entrega o esqueleto visual, a ligação ao Supabase existente, a homepage e a página de episódios. A pesquisa semântica, página de episódio individual e exploração temática ficam para fases seguintes.

## 1. Ligação ao Supabase existente

A base já existe fora do Lovable, com `episodes`, `episode_chunks` e a função `search_episodes`. Não vamos activar Lovable Cloud (criaria um projecto novo e vazio).

Em vez disso:
- Criar um cliente Supabase em `src/lib/supabase.ts` que usa `import.meta.env.VITE_SUPABASE_URL` e `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- Pedir-te o **URL do projecto** e a **anon/publishable key** (são públicas, vão para `.env`).
- Gerar tipos TypeScript manualmente para `episodes` (sem depender do Lovable Cloud auto-gen).

> Vais precisar de colar URL e anon key quando arrancar a implementação. A `OPENAI_API_KEY` e a edge function de pesquisa só entram na Fase 2.

## 2. Design system pergaminho

Configurar `src/index.css` e `tailwind.config.ts` com tokens HSL semânticos:

```text
--background        pergaminho claro    (#F5F0E8)
--background-alt    pergaminho escuro   (#EDE4D0)
--card              creme               (#FAF6EE)
--foreground        tinta               (#2C1810)
--muted-foreground  castanho médio      (#5C4033)
--primary           saddlebrown         (#8B4513)
--primary-hover     castanho escuro     (#6B3A2A)
--border            bege dourado        (#C4A882)
--badge             #D4B896 / texto #2C1810
```

- Fontes via Google Fonts no `index.html`: **Playfair Display** (títulos) + **Lato** (corpo).
- Textura subtil de papel (SVG/CSS noise) no `body`.
- Componentes shadcn (Button, Card, Badge, Input) ajustados a estes tokens — variantes `parchment`, `ink`.
- Sem gradientes modernos. Sombras suaves castanhas.

## 3. Estrutura e rotas

Adicionar ao `App.tsx`:

```text
/             → Homepage
/episodios    → Lista de episódios (com filtros)
*             → NotFound (já existe)
```

Layout partilhado (`src/components/layout/SiteLayout.tsx`) com:
- Header: nome "História Explorer" + subtítulo + nav (Início, Episódios, Temas — Temas desactivado nesta fase).
- Footer com link para o Observador.

## 4. Homepage `/`

Componentes em `src/components/home/`:
- `Hero` — título serifado grande, subtítulo, barra de pesquisa em destaque (nesta fase faz `navigate('/episodios?q=...')`, ainda sem semântica).
- `ThemeCloud` — tags clicáveis dos temas mais frequentes. Hook `useTopThemes()` que faz `select temas from episodes`, agrega no cliente (com 5 episódios é trivial), top 12.
- `RecentEpisodes` — grid de até 6 episódios mais recentes (`order by published_at desc limit 6`).
- `EpisodeCounter` — `count` exact de `episodes`.

## 5. Página de episódios `/episodios`

`src/pages/Episodios.tsx`:
- Hook `useEpisodes({ search, tema, pais, epoca, complexidade, ligacaoPortugal, page })`.
- Query Supabase com `.ilike('title', %q%)`, `.contains('temas', [tema])`, etc., `range(...)` para paginação 20/pág.
- Filtros laterais (sidebar em desktop, drawer em mobile) — listas dinâmicas a partir de `select temas, paises, epocas, complexidade from episodes` agregadas no cliente nesta fase (5 episódios). Mais tarde mover para RPC.
- `EpisodeCard` reutilizável: número, título serifado, data formatada (pt-PT), duração (mm:ss), resumo truncado a ~3 linhas, 3-4 tag badges. Card inteiro clicável para `/episodio/[slug]` (rota só implementada na Fase 2 — link já preparado).
- Estado vazio + skeletons estilo pergaminho.
- Sincronização com query string (`?tema=`, `?q=`, `?page=`).

## 6. Tipos e utils

- `src/types/episode.ts` com a interface `Episode` correspondente às colunas indicadas.
- `src/lib/format.ts` com `formatDate`, `formatDuration`.
- `src/hooks/useEpisodes.ts`, `useTopThemes.ts`, `useRecentEpisodes.ts`, `useEpisodeCount.ts` (todos via React Query, já configurado em `App.tsx`).

## 7. Fora do âmbito desta fase (próximos passos)

- `/episodio/[slug]` com transcrição, ideias principais, livros, badges.
- `/pesquisa` + edge function `search` que gera embedding com `text-embedding-3-small` e chama RPC `search_episodes`. Vai requerer `OPENAI_API_KEY` como secret de edge function — para isso vamos activar Lovable Cloud **só para a edge function**, ou alternativamente alojar a função no teu próprio Supabase (decidimos quando chegarmos lá).
- `/temas` mapa categorizado.
- Mover agregações de filtros/temas para RPCs SQL quando o número de episódios crescer.

## Detalhes técnicos

- React 18 + Vite + TS + Tailwind + shadcn (já no projecto).
- `@supabase/supabase-js` a instalar.
- React Query para cache e estados de loading.
- `react-router-dom` já presente; adicionar nova rota.
- Sem alterações a `vite.config.ts` necessárias além de eventual Google Fonts no `index.html`.
- Responsivo: grid 1 col mobile, 2 col tablet, 3 col desktop nos cards.

Quando aprovares, começo por pedir-te `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e arranco pela infraestrutura (cliente + design system) antes das páginas.
