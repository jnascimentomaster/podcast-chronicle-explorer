import { Link } from "react-router-dom";
import { useDomainStats } from "@/hooks/useDomains";
import { slugifyDomain } from "@/lib/domains";

export default function Temas() {
  const { data, isLoading } = useDomainStats();

  return (
    <section className="container py-12">
      <header className="mb-10 text-center max-w-2xl mx-auto">
        <p className="label-eyebrow text-primary mb-3">Arquivo · Mapa Temático</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold" style={{ letterSpacing: "-0.05em" }}>
          Domínios
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Os episódios estão organizados em oito domínios. Clica num domínio para explorar os seus temas.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {(isLoading ? Array.from({ length: 8 }) : data ?? []).map((entry, i) => {
          if (!entry) {
            return (
              <div
                key={i}
                className="bg-card border border-border border-l-4 border-l-primary rounded-md p-6 h-56 animate-pulse"
              />
            );
          }
          const stats = entry as NonNullable<typeof data>[number];
          return (
            <Link
              key={stats.domain}
              to={`/temas/${slugifyDomain(stats.domain)}`}
              className="group block bg-card border border-border border-l-4 border-l-primary rounded-md p-6 hover:shadow-card hover:border-l-primary-hover transition-shadow"
            >
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <span className="label-eyebrow text-primary">Domínio</span>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {stats.count} {stats.count === 1 ? "ep." : "eps."}
                </span>
              </div>
              <h2 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                {stats.domain}
              </h2>
              {stats.topThemes.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {stats.topThemes.map((t) => (
                    <li
                      key={t.name}
                      className="text-xs text-muted-foreground flex items-baseline justify-between gap-2"
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="tabular-nums opacity-70">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
