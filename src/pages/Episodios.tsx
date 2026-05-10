import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EpisodeCard from "@/components/episodes/EpisodeCard";
import SearchBar from "@/components/SearchBar";
import { useEpisodes, useFacetValues } from "@/hooks/useEpisodes";

function FacetGroup({
  title, values, active, onPick, initialVisible = 6,
}: {
  title: string;
  values: string[];
  active: string | null;
  onPick: (v: string | null) => void;
  initialVisible?: number;
}) {
  if (!values.length) return null;
  const [expanded, setExpanded] = useState(false);
  const ordered = active && !values.includes(active) ? [active, ...values] : values;
  const reordered = active
    ? [active, ...ordered.filter((v) => v !== active)]
    : ordered;
  const visible = expanded ? reordered : reordered.slice(0, initialVisible);
  const hidden = reordered.length - visible.length;
  return (
    <div className="mb-5">
      <h4 className="font-serif text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {title}
      </h4>
      <ul className={`space-y-0.5 ${expanded ? "max-h-64 overflow-y-auto pr-1" : ""}`}>
        {visible.map((v) => {
          const isActive = active === v;
          return (
            <li key={v}>
              <button
                onClick={() => onPick(isActive ? null : v)}
                className={`text-left text-[13px] w-full px-2 py-0.5 rounded-sm transition-colors leading-snug ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent/60"
                }`}
              >
                {v}
              </button>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-[11px] uppercase tracking-wider text-primary hover:text-primary-hover"
        >
          + {hidden} mais
        </button>
      )}
      {expanded && reordered.length > initialVisible && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          mostrar menos
        </button>
      )}
    </div>
  );
}

export default function Episodios() {
  const [params, setParams] = useSearchParams();

  const filters = {
    q: params.get("q") ?? undefined,
    tema: params.get("tema") ?? undefined,
    pais: params.get("pais") ?? undefined,
    epoca: params.get("epoca") ?? undefined,
    complexidade: params.get("complexidade") ?? undefined,
    ligacaoPortugal: params.get("portugal") === "1",
    page: Math.max(1, Number(params.get("page") ?? 1)),
    pageSize: 20,
  };

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const { data: facets } = useFacetValues();
  const { data, isLoading, isError } = useEpisodes(filters);

  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  const activeFilters = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (filters.q) list.push({ key: "q", label: `“${filters.q}”` });
    if (filters.tema) list.push({ key: "tema", label: filters.tema });
    if (filters.pais) list.push({ key: "pais", label: filters.pais });
    if (filters.epoca) list.push({ key: "epoca", label: filters.epoca });
    if (filters.complexidade) list.push({ key: "complexidade", label: filters.complexidade });
    if (filters.ligacaoPortugal) list.push({ key: "portugal", label: "Liga a Portugal" });
    return list;
  }, [params]); // eslint-disable-line

  return (
    <div className="container py-12">
      <header className="max-w-3xl mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Arquivo
        </p>
        <h2 className="font-serif text-4xl mb-4">Todos os episódios</h2>
        <SearchBar size="md" initial={filters.q ?? ""} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-10">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 self-start">
          <div className="bg-card border border-border rounded-sm p-4 shadow-parchment text-sm">
            <p className="font-serif text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Filtros
            </p>
            <FacetGroup
              title="Tema"
              values={facets?.temas ?? []}
              active={filters.tema ?? null}
              onPick={(v) => setParam("tema", v)}
            />
            <FacetGroup
              title="País"
              values={facets?.paises ?? []}
              active={filters.pais ?? null}
              onPick={(v) => setParam("pais", v)}
            />
            <FacetGroup
              title="Época"
              values={facets?.epocas ?? []}
              active={filters.epoca ?? null}
              onPick={(v) => setParam("epoca", v)}
            />
            <FacetGroup
              title="Complexidade"
              values={facets?.complexidade ?? []}
              active={filters.complexidade ?? null}
              onPick={(v) => setParam("complexidade", v)}
              initialVisible={4}
            />
            <label className="flex items-center gap-2 text-[13px] cursor-pointer mt-2 pt-3 border-t border-border/60">
              <input
                type="checkbox"
                checked={filters.ligacaoPortugal}
                onChange={(e) => setParam("portugal", e.target.checked ? "1" : null)}
                className="accent-primary"
              />
              Liga a Portugal
            </label>
          </div>
        </aside>

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "A carregar…" : `${total} ${total === 1 ? "episódio" : "episódios"}`}
            </p>
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setParam(f.key, null)}
                    className="text-xs px-2 py-1 bg-accent text-accent-foreground border border-border rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {f.label} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          {isError && (
            <p className="text-destructive italic">Erro a carregar episódios.</p>
          )}

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 bg-card/60 border border-border rounded-sm animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {(data?.rows ?? []).map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
          )}

          {!isLoading && (data?.rows.length ?? 0) === 0 && (
            <div className="text-center py-16">
              <p className="font-serif italic text-xl text-muted-foreground">
                Nenhum episódio corresponde a esta pesquisa.
              </p>
            </div>
          )}

          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                disabled={filters.page <= 1}
                onClick={() => setParam("page", String(filters.page - 1))}
                className="px-3 py-1.5 text-sm border border-border rounded-sm disabled:opacity-40 hover:border-primary"
              >
                ← Anterior
              </button>
              <span className="text-sm text-muted-foreground">
                Página {filters.page} de {pages}
              </span>
              <button
                disabled={filters.page >= pages}
                onClick={() => setParam("page", String(filters.page + 1))}
                className="px-3 py-1.5 text-sm border border-border rounded-sm disabled:opacity-40 hover:border-primary"
              >
                Seguinte →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}