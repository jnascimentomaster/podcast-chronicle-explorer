import { Link, useLocation, useParams } from "react-router-dom";
import { useMemo } from "react";
import { domainFromSlug, slugifyDomain, slugifyTheme } from "@/lib/domains";
import { useDomainThemes, useEpisodesByTheme } from "@/hooks/useDomains";
import Breadcrumbs from "@/components/temas/Breadcrumbs";
import { formatDate } from "@/lib/format";

export default function TemaSubtema() {
  const { dominioSlug = "", temaSlug = "" } = useParams();
  const location = useLocation();
  const domain = domainFromSlug(dominioSlug);
  const { data: themes } = useDomainThemes(domain);

  const tema = useMemo<string | null>(() => {
    const fromState = (location.state as { tema?: string } | null)?.tema;
    if (fromState) return fromState;
    return themes?.find((t) => slugifyTheme(t.name) === temaSlug)?.name ?? null;
  }, [location.state, themes, temaSlug]);

  const { data: episodes, isLoading } = useEpisodesByTheme(domain, tema);

  if (!domain) {
    return (
      <section className="container py-12">
        <p className="text-muted-foreground">Domínio não encontrado.</p>
      </section>
    );
  }

  return (
    <section className="container py-10">
      <Breadcrumbs
        items={[
          { label: "Temas", to: "/temas" },
          { label: domain, to: `/temas/${slugifyDomain(domain)}` },
          { label: tema ?? "…" },
        ]}
      />

      <header className="mt-6 mb-8 max-w-3xl">
        <p className="label-eyebrow text-primary mb-3">Tema · {domain}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ letterSpacing: "-0.04em" }}>
          {tema ?? "Tema"}
        </h1>
        {episodes && (
          <p className="mt-3 text-sm text-muted-foreground">
            {episodes.length} {episodes.length === 1 ? "episódio" : "episódios"}
          </p>
        )}
      </header>

      {isLoading || !tema ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border border-l-4 border-l-primary rounded-md p-5 h-32 animate-pulse"
            />
          ))}
        </div>
      ) : episodes && episodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
          {episodes.map((ep) => {
            const tags = (ep.temas ?? []).slice(0, 3);
            return (
              <Link
                key={ep.id}
                to={`/episodio/${ep.slug}`}
                className="group block bg-card border border-border border-l-4 border-l-primary rounded-md p-5 hover:shadow-card hover:border-l-primary-hover transition-shadow"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="label-eyebrow text-primary">
                    {ep.episode_number != null ? `Nº ${ep.episode_number}` : "Episódio"}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(ep.published_at)}</span>
                </div>
                <h3 className="text-base font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                  {ep.title}
                </h3>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="text-[0.7rem] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum episódio encontrado neste tema.</p>
      )}
    </section>
  );
}
