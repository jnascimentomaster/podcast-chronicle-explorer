import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BANDS,
  formatRange,
  formatYear,
  useAnchoredEpisodes,
  useTransversalEpisodes,
  type AnchoredEpisode,
} from "@/hooks/useTimeline";

export default function Timeline() {
  const anchored = useAnchoredEpisodes();
  const transversal = useTransversalEpisodes();
  const [tab, setTab] = useState<"cronologica" | "panoramicos">("cronologica");

  const grouped = useMemo(() => {
    const map = new Map<string, AnchoredEpisode[]>();
    BANDS.forEach((b) => map.set(b.key, []));
    (anchored.data ?? []).forEach((ep) => {
      const band = BANDS.find((b) => ep.ano_foco >= b.min && ep.ano_foco <= b.max);
      if (band) map.get(band.key)!.push(ep);
    });
    return map;
  }, [anchored.data]);

  const maxCount = Math.max(1, ...BANDS.map((b) => grouped.get(b.key)?.length ?? 0));

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Timeline histórica</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Os episódios organizados pela <strong>época que retratam</strong>, não pela data em que
          foram publicados. Um episódio sobre Pearl Harbor aparece em 1941.
        </p>
      </header>

      <div className="mb-8 flex gap-2 border-b border-border">
        <TabBtn active={tab === "cronologica"} onClick={() => setTab("cronologica")}>
          Cronológica ({anchored.data?.length ?? 0})
        </TabBtn>
        <TabBtn active={tab === "panoramicos"} onClick={() => setTab("panoramicos")}>
          Panorâmicos ({transversal.data?.length ?? 0})
        </TabBtn>
      </div>

      {tab === "cronologica" && (
        <section>
          {anchored.isLoading && (
            <p className="text-muted-foreground italic">A carregar…</p>
          )}
          {anchored.isError && (
            <p className="text-destructive">Erro a carregar episódios.</p>
          )}
          <div className="space-y-4">
            {BANDS.map((band) => {
              const eps = grouped.get(band.key) ?? [];
              return (
                <BandBlock
                  key={band.key}
                  label={band.label}
                  count={eps.length}
                  maxCount={maxCount}
                  episodes={eps}
                />
              );
            })}
          </div>
        </section>
      )}

      {tab === "panoramicos" && (
        <section>
          <p className="mb-6 text-sm text-muted-foreground max-w-2xl">
            Episódios temáticos que atravessam vários períodos (ex: «história dos apelidos»,
            «invenção da infância»). Por percorrerem séculos, ficam fora da linha cronológica.
          </p>
          {transversal.isLoading && (
            <p className="text-muted-foreground italic">A carregar…</p>
          )}
          <ul className="divide-y divide-border border border-border rounded-sm bg-card">
            {(transversal.data ?? []).map((ep) => (
              <li key={ep.slug} className="p-4 hover:bg-muted/40 transition-colors">
                <Link to={`/episodio/${ep.slug}`} className="block">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    {formatRange(ep.ano_inicio, ep.ano_fim)}
                    {ep.episode_number != null && <span> · Ep. {ep.episode_number}</span>}
                  </div>
                  <div className="text-foreground font-medium hover:text-primary transition-colors">
                    {ep.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function BandBlock({
  label,
  count,
  maxCount,
  episodes,
}: {
  label: string;
  count: number;
  maxCount: number;
  episodes: AnchoredEpisode[];
}) {
  const [open, setOpen] = useState(false);
  const widthPct = Math.max(4, Math.round((count / maxCount) * 100));
  const empty = count === 0;
  return (
    <div className="border border-border rounded-sm bg-card overflow-hidden">
      <button
        onClick={() => !empty && setOpen(!open)}
        disabled={empty}
        className="w-full text-left p-4 flex items-center gap-4 hover:bg-muted/40 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
      >
        <div className="flex-shrink-0 w-6 text-muted-foreground">
          {empty ? "·" : open ? "▾" : "▸"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-lg text-foreground truncate">{label}</h2>
            <span className="text-sm text-muted-foreground font-sans flex-shrink-0">
              {count} {count === 1 ? "episódio" : "episódios"}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70"
              style={{ width: empty ? "0%" : `${widthPct}%` }}
            />
          </div>
        </div>
      </button>
      {open && !empty && (
        <ul className="divide-y divide-border border-t border-border">
          {episodes.map((ep) => {
            const low = (ep.timeline_confianca ?? 1) < 0.65;
            return (
              <li key={ep.slug} className="hover:bg-muted/40 transition-colors">
                <Link
                  to={`/episodio/${ep.slug}`}
                  className="flex items-baseline gap-4 px-4 py-3"
                >
                  <span
                    className={`font-mono text-sm tabular-nums w-20 flex-shrink-0 ${
                      low ? "text-muted-foreground/60" : "text-primary"
                    }`}
                    title={low ? "Datação de menor fiabilidade" : undefined}
                  >
                    {formatYear(ep.ano_foco)}
                  </span>
                  {ep.episode_number != null && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      Ep. {ep.episode_number}
                    </span>
                  )}
                  <span className="text-foreground hover:text-primary transition-colors">
                    {ep.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}