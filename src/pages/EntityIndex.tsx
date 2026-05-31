import { useState } from "react";
import { useEntityList, useEntitySearch, type EntityType } from "@/hooks/useEntities";
import EntityCard, { EntityGrid } from "@/components/entities/EntityCard";

const PAGE_SIZE = 60;

export default function EntityIndex({
  type,
  title,
  subtitle,
  detailPath,
}: {
  type: EntityType;
  title: string;
  subtitle: string;
  detailPath: string;
}) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const trimmed = search.trim();

  const list = useEntityList(type, page, PAGE_SIZE);
  const searchQ = useEntitySearch(type, trimmed);

  const rows = trimmed.length >= 2 ? (searchQ.data ?? []) : (list.data?.rows ?? []);
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </header>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Pesquisar por nome…"
          className="w-full sm:max-w-md py-3 px-4 bg-card border border-border rounded-sm placeholder:text-muted-foreground/80 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow"
        />
      </div>

      {(list.isLoading || searchQ.isLoading) && (
        <p className="text-muted-foreground italic">A carregar…</p>
      )}
      {(list.isError || searchQ.isError) && (
        <p className="text-destructive">Erro a carregar dados.</p>
      )}

      {rows.length === 0 && !list.isLoading && !searchQ.isLoading && (
        <p className="text-muted-foreground italic">Sem resultados.</p>
      )}

      <EntityGrid>
        {rows.map((r) => (
          <EntityCard
            key={r.id}
            to={`${detailPath}/${r.slug}`}
            name={r.canonical_name}
            count={r.episode_count}
          />
        ))}
      </EntityGrid>

      {trimmed.length < 2 && totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-sm border border-border bg-card text-foreground disabled:opacity-40 hover:border-primary transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-muted-foreground">
            Página {page + 1} de {totalPages} · {total} no total
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-sm border border-border bg-card text-foreground disabled:opacity-40 hover:border-primary transition-colors"
          >
            Seguinte →
          </button>
        </nav>
      )}
    </div>
  );
}