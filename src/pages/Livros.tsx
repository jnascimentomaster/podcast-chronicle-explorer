import { useMemo, useState } from "react";
import { useBooksAggregated } from "@/hooks/useEntities";
import EntityCard, { EntityGrid } from "@/components/entities/EntityCard";

const TOP_PAGE = 60;

export default function Livros() {
  const { data, isLoading, isError } = useBooksAggregated();
  const [search, setSearch] = useState("");
  const [showAllRec, setShowAllRec] = useState(false);
  const [showAllCit, setShowAllCit] = useState(false);

  const normalised = useMemo(() => {
    if (!data) return null;
    const q = search
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const matches = (name: string) =>
      q.length < 2 ||
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(q);
    const recomendados = data
      .filter((b) => b.recomendado_count > 0 && matches(b.canonical_name))
      .sort((a, b) => b.recomendado_count - a.recomendado_count);
    const citados = data
      .filter((b) => b.citado_count > 0 && matches(b.canonical_name))
      .sort((a, b) => b.citado_count - a.citado_count);
    const todos = data
      .filter((b) => matches(b.canonical_name))
      .sort((a, b) => b.total - a.total);
    return { recomendados, citados, todos };
  }, [data, search]);

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Livros</h1>
        <p className="mt-2 text-muted-foreground">
          Bibliografia recomendada pelos autores e livros citados ao longo dos episódios.
        </p>
      </header>

      <div className="mb-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por título ou autor…"
          className="w-full sm:max-w-md py-3 px-4 bg-card border border-border rounded-sm placeholder:text-muted-foreground/80 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-shadow"
        />
      </div>

      {isLoading && <p className="text-muted-foreground italic">A carregar livros…</p>}
      {isError && <p className="text-destructive">Erro a carregar livros.</p>}

      {normalised && (
        <>
          {normalised.recomendados.length === 0 && normalised.citados.length === 0 ? (
            <Section
              icon="📚"
              title="Todos os livros"
              subtitle="Livros referidos ao longo dos episódios, por nº de aparições."
              books={normalised.todos}
              kind="total"
              showAll={showAllRec}
              setShowAll={setShowAllRec}
            />
          ) : (
            <>
              <Section
                icon="📖"
                title="Recomendados"
                subtitle="Sugestões de leitura dos autores."
                books={normalised.recomendados}
                kind="recomendado"
                showAll={showAllRec}
                setShowAll={setShowAllRec}
              />
              <div className="ornament-rule my-12" />
              <Section
                icon="📚"
                title="Citados"
                subtitle="Livros referidos durante as conversas."
                books={normalised.citados}
                kind="citado"
                showAll={showAllCit}
                setShowAll={setShowAllCit}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  books,
  kind,
  showAll,
  setShowAll,
}: {
  icon: string;
  title: string;
  subtitle: string;
  books: Array<{
    entity_id: string;
    canonical_name: string;
    slug: string;
    recomendado_count: number;
    citado_count: number;
    total: number;
    authors?: string[] | null;
  }>;
  kind: "recomendado" | "citado" | "total";
  showAll: boolean;
  setShowAll: (v: boolean) => void;
}) {
  const visible = showAll ? books : books.slice(0, TOP_PAGE);
  return (
    <section>
      <header className="mb-4">
        <h2 className="font-serif text-2xl text-foreground">
          <span className="mr-2">{icon}</span>
          {title}{" "}
          <span className="text-base text-muted-foreground font-sans">({books.length})</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </header>
      {books.length === 0 ? (
        <p className="text-muted-foreground italic">Sem livros nesta secção.</p>
      ) : (
        <>
          <EntityGrid>
            {visible.map((b) => (
              <EntityCard
                key={b.entity_id}
                to={`/livro/${b.slug}`}
                name={b.canonical_name}
                count={
                  kind === "recomendado"
                    ? b.recomendado_count
                    : kind === "citado"
                      ? b.citado_count
                      : b.total
                }
                meta={b.authors && b.authors.length > 0 ? b.authors.join(", ") : undefined}
              />
            ))}
          </EntityGrid>
          {books.length > TOP_PAGE && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                {showAll
                  ? "Mostrar menos ↑"
                  : `Mostrar todos (${books.length - TOP_PAGE} restantes) ↓`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}