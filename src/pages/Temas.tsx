import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAllThemes } from "@/hooks/useEpisodes";
import { Input } from "@/components/ui/input";

export default function Temas() {
  const { data, isLoading } = useAllThemes();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const list = data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((t) => t.name.toLowerCase().includes(term));
  }, [data, q]);

  const maxCount = filtered[0]?.count ?? 1;

  return (
    <section className="container py-12">
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Arquivo · Índice temático
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl">Temas</h1>
        <p className="mt-3 text-sm text-muted-foreground italic">
          {data ? `${data.length} temas` : "A carregar…"} no arquivo. Cada tema agrupa os episódios em que aparece.
        </p>
      </header>

      <div className="max-w-md mx-auto mb-10">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar temas…"
          className="bg-card"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-9 w-32 bg-card/60 border border-border rounded-sm animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground italic py-12">
          Nenhum tema encontrado para “{q}”.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
          {filtered.map((t) => {
            const weight = t.count / maxCount;
            const fontSize = 0.85 + weight * 0.5;
            return (
              <Link
                key={t.name}
                to={`/episodios?tema=${encodeURIComponent(t.name)}`}
                className="px-4 py-2 bg-card border border-border rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
                style={{ fontSize: `${fontSize}rem` }}
              >
                <span>{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.count}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}