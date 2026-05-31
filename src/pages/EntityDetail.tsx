import { Link, useParams } from "react-router-dom";
import { useEntityBySlug, useEntityEpisodes, type EntityType } from "@/hooks/useEntities";
import EntityEpisodeList from "@/components/entities/EntityEpisodeList";

export default function EntityDetail({
  type,
  backTo,
  backLabel,
}: {
  type: EntityType;
  backTo: string;
  backLabel: string;
}) {
  const { slug } = useParams<{ slug: string }>();
  const entity = useEntityBySlug(type, slug);
  const eps = useEntityEpisodes(type, slug);

  if (entity.isLoading) {
    return (
      <div className="container py-16">
        <div className="h-10 w-1/2 bg-card animate-pulse rounded-sm mb-4" />
        <div className="h-4 w-1/3 bg-card animate-pulse rounded-sm" />
      </div>
    );
  }

  if (!entity.data) {
    return (
      <div className="container py-24 text-center">
        <p className="font-serif italic text-xl text-muted-foreground mb-4">
          Não encontrado.
        </p>
        <Link to={backTo} className="text-primary hover:text-primary-hover">
          ← {backLabel}
        </Link>
      </div>
    );
  }

  const e = entity.data;
  const aliases = (e.aliases ?? []).filter((a) => a && a !== e.canonical_name);

  return (
    <div className="container py-12 max-w-4xl">
      <Link to={backTo} className="text-sm text-muted-foreground hover:text-primary">
        ← {backLabel}
      </Link>

      <header className="mt-6 pb-6 border-b border-border">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
          {e.canonical_name}
        </h1>
        <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
          {e.episode_count ?? 0} {e.episode_count === 1 ? "episódio" : "episódios"}
        </p>
        {aliases.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Também referido como: <span className="italic">{aliases.join(", ")}</span>
          </p>
        )}
      </header>

      <section className="mt-8">
        <h2 className="label-eyebrow mb-4">Episódios</h2>
        {eps.isLoading ? (
          <p className="text-muted-foreground italic">A carregar…</p>
        ) : (
          <EntityEpisodeList items={eps.data ?? []} />
        )}
      </section>
    </div>
  );
}