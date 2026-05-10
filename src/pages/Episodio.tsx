import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEpisodeBySlug, useEpisodeNeighbours, useEpisodeTranscript } from "@/hooks/useEpisode";
import TagSection, { ListSection } from "@/components/episodes/TagSection";
import { formatDate, formatDuration } from "@/lib/format";

export default function Episodio() {
  const { slug } = useParams<{ slug: string }>();
  const { data: ep, isLoading, isError } = useEpisodeBySlug(slug);
  const { data: neighbours } = useEpisodeNeighbours(ep?.published_at);
  const [showTranscript, setShowTranscript] = useState(false);
  const { data: transcriptChunks, isLoading: loadingTranscript } = useEpisodeTranscript(
    showTranscript ? ep?.id : undefined,
  );

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="h-12 w-2/3 bg-card animate-pulse rounded-sm mb-6" />
        <div className="h-4 w-1/3 bg-card animate-pulse rounded-sm mb-12" />
        <div className="h-64 bg-card animate-pulse rounded-sm" />
      </div>
    );
  }

  if (isError || !ep) {
    return (
      <div className="container py-24 text-center">
        <p className="font-serif italic text-xl text-muted-foreground mb-4">
          Episódio não encontrado.
        </p>
        <Link to="/episodios" className="text-primary hover:text-primary-hover">
          ← Ver todos os episódios
        </Link>
      </div>
    );
  }

  return (
    <article className="container py-12 max-w-4xl">
      <Link to="/episodios" className="text-sm text-muted-foreground hover:text-primary">
        ← Arquivo
      </Link>

      <header className="mt-6 pb-8 border-b border-border">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
          {ep.episode_number != null && <span>Nº {ep.episode_number}</span>}
          <span>{formatDate(ep.published_at)}</span>
          <span>{formatDuration(ep.duration_seconds)}</span>
          {ep.tipo_episodio && <span>{ep.tipo_episodio}</span>}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight">
          {ep.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {ep.url && (
            <a
              href={ep.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm uppercase tracking-wider rounded-sm hover:bg-primary-hover transition-colors"
            >
              Ouvir no Observador →
            </a>
          )}
          {ep.complexidade && (
            <Badge>{`Complexidade · ${ep.complexidade}`}</Badge>
          )}
          {ep.ligacao_portugal && <Badge tone="primary">★ Liga a Portugal</Badge>}
          {ep.controversia && <Badge tone="destructive">Episódio controverso</Badge>}
        </div>
      </header>

      {ep.resumo && (
        <section className="my-10">
          <p className="font-serif text-lg leading-relaxed text-foreground first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:text-primary first-letter:mr-2 first-letter:float-left first-letter:leading-none">
            {ep.resumo}
          </p>
        </section>
      )}

      {ep.ideias_principais && ep.ideias_principais.length > 0 && (
        <section className="my-10 bg-card border border-border rounded-sm p-6 shadow-parchment">
          <h3 className="font-serif text-xl mb-4">Ideias principais</h3>
          <ol className="space-y-3 list-none">
            {ep.ideias_principais.map((ideia, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-serif text-primary text-lg leading-none mt-1 shrink-0 w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground leading-relaxed">{ideia}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="ornament-rule my-10" />

      <div className="grid md:grid-cols-2 gap-x-10">
        <TagSection title="Personagens" items={ep.personagens} paramKey="personagem" />
        <TagSection title="Países e regiões" items={ep.paises} paramKey="pais" />
        <TagSection title="Épocas" items={ep.epocas} paramKey="epoca" />
        <TagSection title="Temas" items={ep.temas} paramKey="tema" />
        <TagSection title="Eventos" items={ep.eventos} />
        <TagSection title="Guerras e conflitos" items={ep.guerras_conflitos} />
      </div>

      <div className="ornament-rule my-10" />

      <div className="grid md:grid-cols-2 gap-x-10">
        <ListSection title="Livros recomendados" items={ep.livros_recomendados} icon="📖" />
        <ListSection title="Livros citados" items={ep.livros_citados} icon="📚" />
        <ListSection title="Filmes e documentários" items={ep.filmes_documentarios} icon="🎬" />
      </div>

      {/* Transcrição */}
      <section className="mt-12 border-t border-border pt-8">
        <button
          onClick={() => setShowTranscript((v) => !v)}
          className="font-serif text-lg text-primary hover:text-primary-hover transition-colors"
        >
          {showTranscript ? "Esconder transcrição —" : "Ver transcrição completa →"}
        </button>
        {showTranscript && (
          <div className="mt-6">
            {loadingTranscript ? (
              <p className="text-muted-foreground italic">A carregar transcrição…</p>
            ) : transcriptChunks && transcriptChunks.length > 0 ? (
              <div className="space-y-4 text-foreground leading-relaxed font-serif text-[15px] max-h-[60vh] overflow-y-auto pr-3 bg-card/50 border border-border rounded-sm p-6">
                {transcriptChunks.map((c, i) => (
                  <p key={i}>{c}</p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">Sem transcrição disponível.</p>
            )}
          </div>
        )}
      </section>

      {/* Navegação */}
      <nav className="mt-16 grid sm:grid-cols-2 gap-4">
        <NeighbourLink direction="prev" item={neighbours?.prev ?? null} />
        <NeighbourLink direction="next" item={neighbours?.next ?? null} />
      </nav>
    </article>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "primary" | "destructive" }) {
  const cls =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "destructive"
        ? "bg-destructive text-destructive-foreground"
        : "bg-accent text-accent-foreground border border-border";
  return (
    <span className={`text-xs px-2.5 py-1 uppercase tracking-wider rounded-sm ${cls}`}>
      {children}
    </span>
  );
}

function NeighbourLink({
  item, direction,
}: {
  item: { slug: string; title: string; episode_number: number | null } | null;
  direction: "prev" | "next";
}) {
  if (!item) return <div />;
  const isPrev = direction === "prev";
  return (
    <Link
      to={`/episodio/${item.slug}`}
      className={`block bg-card border border-border rounded-sm p-5 hover:border-primary transition-colors ${
        isPrev ? "" : "sm:text-right"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {isPrev ? "← Episódio anterior" : "Próximo episódio →"}
      </p>
      <p className="font-serif text-base text-foreground leading-snug">{item.title}</p>
    </Link>
  );
}