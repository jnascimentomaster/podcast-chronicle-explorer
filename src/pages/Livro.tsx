import { Link, useParams } from "react-router-dom";
import { useEntityBySlug, useBookEpisodes } from "@/hooks/useEntities";
import EntityEpisodeList from "@/components/entities/EntityEpisodeList";

export default function Livro() {
  const { slug } = useParams<{ slug: string }>();
  const entity = useEntityBySlug("livro", slug);
  const eps = useBookEpisodes(slug);

  if (entity.isLoading) {
    return (
      <div className="container py-16">
        <div className="h-10 w-1/2 bg-card animate-pulse rounded-sm mb-4" />
      </div>
    );
  }

  if (!entity.data) {
    return (
      <div className="container py-24 text-center">
        <p className="font-serif italic text-xl text-muted-foreground mb-4">
          Livro não encontrado.
        </p>
        <Link to="/livros" className="text-primary hover:text-primary-hover">
          ← Todos os livros
        </Link>
      </div>
    );
  }

  const e = entity.data;
  const md = (e.metadata ?? {}) as { author?: string | null; authors?: unknown };
  let authors: string[] = [];
  if (Array.isArray(md.authors)) {
    authors = (md.authors as unknown[]).filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
  }
  if (authors.length === 0 && typeof md.author === "string" && md.author.trim().length > 0) {
    authors = [md.author.trim()];
  }
  const items = (eps.data ?? []).map((r) => ({
    episode_slug: r.episode_slug,
    episode_title: r.episode_title,
    episode_number: r.episode_number,
    published_at: r.published_at,
    subtype: r.link_subtype,
  }));

  return (
    <div className="container py-12 max-w-4xl">
      <Link to="/livros" className="text-sm text-muted-foreground hover:text-primary">
        ← Todos os livros
      </Link>
      <header className="mt-6 pb-6 border-b border-border">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
          {e.canonical_name}
        </h1>
        {authors.length > 0 && (
          <p className="mt-2 font-serif italic text-lg text-muted-foreground">
            {authors.join(", ")}
          </p>
        )}
        <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
          {items.length} {items.length === 1 ? "episódio" : "episódios"}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="label-eyebrow mb-4">Episódios</h2>
        {eps.isLoading ? (
          <p className="text-muted-foreground italic">A carregar…</p>
        ) : (
          <EntityEpisodeList items={items} />
        )}
      </section>
    </div>
  );
}