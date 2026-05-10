import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAllThemes } from "@/hooks/useEpisodes";
import { Input } from "@/components/ui/input";

type ThemeItem = { name: string; count: number };

const CATEGORIES: { id: string; label: string; match: RegExp }[] = [
  {
    id: "guerras",
    label: "Guerras e Conflitos",
    match: /guerra|conflito|batalha|revolu|invas|cerco|cruzad|resist|insurr/i,
  },
  {
    id: "portugal",
    label: "Portugal e Lusofonia",
    match: /portug|lusof|brasil|angola|moçambiq|cabo verde|guin|timor|estado novo|salaz|descobri|império portug/i,
  },
  {
    id: "politica",
    label: "Política e Diplomacia",
    match: /pol[ií]tic|diplom|estado|governo|democraci|monarqu|república|tratado|constitui|parlament|elei/i,
  },
  {
    id: "figuras",
    label: "Figuras Históricas",
    match: /rei|rainha|imperador|papa|presidente|líder|general|filós|dinastia|napole|hitler|stalin|césar/i,
  },
  {
    id: "europa",
    label: "Europa",
    match: /europ|frança|francês|alemã|alemanh|espanh|itáli|inglater|britân|reino unido|rússia|soviét|grécia|roma|bizant/i,
  },
  {
    id: "asia",
    label: "Ásia e Pacífico",
    match: /[áa]si|china|chinês|japão|japonês|índia|indiano|pers|otoman|árabe|islâm|mongol|coreia|vietn/i,
  },
  {
    id: "americas",
    label: "Américas",
    match: /am[ée]ric|estados unidos|eua|méxico|cuba|argentin|chile|peru|colômbia/i,
  },
  {
    id: "africa",
    label: "África",
    match: /[áa]fric|egipt|etiópi|nigér|congo|magreb|sahara/i,
  },
  {
    id: "cultura",
    label: "Cultura e Sociedade",
    match: /cultur|sociedad|religi|igrej|arte|literat|filos|ciênci|economi|comérci|escravat|escravid|migra|tecnolog/i,
  },
];

function classify(name: string) {
  for (const cat of CATEGORIES) if (cat.match.test(name)) return cat.id;
  return "outros";
}

export default function Temas() {
  const { data, isLoading } = useAllThemes();
  const [q, setQ] = useState("");

  const { grouped, total, maxCount } = useMemo(() => {
    const list = data ?? [];
    const term = q.trim().toLowerCase();
    const filtered = term ? list.filter((t) => t.name.toLowerCase().includes(term)) : list;

    const groups = new Map<string, ThemeItem[]>();
    for (const t of filtered) {
      const id = classify(t.name);
      const arr = groups.get(id) ?? [];
      arr.push(t);
      groups.set(id, arr);
    }
    for (const arr of groups.values()) {
      arr.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt"));
    }
    return {
      grouped: groups,
      total: filtered.length,
      maxCount: filtered[0]?.count ?? 1,
    };
  }, [data, q]);

  const sections = [
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    { id: "outros", label: "Outros temas" },
  ].filter((s) => (grouped.get(s.id)?.length ?? 0) > 0);

  return (
    <section className="container py-12">
      <header className="mb-8 text-center max-w-2xl mx-auto">
        <p className="label-eyebrow text-primary mb-3">
          Arquivo · Índice temático
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold" style={{ letterSpacing: "-0.05em" }}>Mapa de Temas</h1>
        <div className="ornament-rule my-5" />
        <p className="text-sm text-muted-foreground">
          {data ? `${total} temas` : "A carregar…"} organizados por categoria.
          Cada tema agrupa os episódios em que aparece.
        </p>
      </header>

      <div className="max-w-md mx-auto mb-12">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar temas…"
          className="bg-card border-border"
        />
      </div>

      {isLoading ? (
        <div className="space-y-10 max-w-5xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-5 w-48 bg-muted rounded-md animate-pulse mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="h-9 w-32 bg-muted rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sections.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Nenhum tema encontrado{q ? ` para “${q}”` : ""}.
        </p>
      ) : (
        <div className="space-y-12 max-w-5xl mx-auto">
          {sections.map((section) => {
            const items = grouped.get(section.id) ?? [];
            return (
              <div key={section.id}>
                <div className="flex items-baseline gap-4 mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">
                    {section.label}
                  </h2>
                  <div className="flex-1 ornament-rule" />
                  <span className="label-eyebrow">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((t) => {
                    const weight = t.count / maxCount;
                    const fontSize = 0.82 + weight * 0.45;
                    return (
                      <Link
                        key={t.name}
                        to={`/episodios?tema=${encodeURIComponent(t.name)}`}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 bg-accent text-accent-foreground rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                        style={{ fontSize: `${fontSize}rem` }}
                      >
                        <span>{t.name}</span>
                        <span className="text-[0.7rem] opacity-70 tabular-nums">
                          {t.count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}