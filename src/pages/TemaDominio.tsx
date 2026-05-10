import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { domainFromSlug, slugifyDomain, slugifyTheme } from "@/lib/domains";
import { useDomainThemes } from "@/hooks/useDomains";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/temas/Breadcrumbs";

export default function TemaDominio() {
  const { dominioSlug = "" } = useParams();
  const domain = domainFromSlug(dominioSlug);
  const { data, isLoading } = useDomainThemes(domain);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return term ? data.filter((t) => t.name.toLowerCase().includes(term)) : data;
  }, [data, q]);

  if (!domain) {
    return (
      <section className="container py-12">
        <p className="text-muted-foreground">Domínio não encontrado.</p>
        <Link to="/temas" className="text-primary font-semibold hover:underline">
          ← Voltar aos domínios
        </Link>
      </section>
    );
  }

  const total = data?.reduce((s, t) => s + t.count, 0) ?? 0;

  return (
    <section className="container py-10">
      <Breadcrumbs items={[{ label: "Temas", to: "/temas" }, { label: domain }]} />

      <header className="mt-6 mb-8 max-w-3xl">
        <p className="label-eyebrow text-primary mb-3">Domínio</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ letterSpacing: "-0.04em" }}>
          {domain}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {data ? `${data.length} temas · ${total} ocorrências` : "A carregar…"}
        </p>
      </header>

      <div className="max-w-md mb-8">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar temas neste domínio…"
          className="bg-card border-border"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-9 w-32 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum tema encontrado.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map((t) => (
            <Link
              key={t.name}
              to={`/temas/${slugifyDomain(domain)}/${slugifyTheme(t.name)}`}
              state={{ tema: t.name }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <span>{t.name}</span>
              <span className="text-[0.7rem] opacity-70 tabular-nums">{t.count}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
