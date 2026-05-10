import { Link } from "react-router-dom";
import type { Episode } from "@/types/episode";
import { formatDate, formatDuration, truncate } from "@/lib/format";

export default function EpisodeCard({ episode }: { episode: Episode }) {
  const tags = (episode.temas ?? []).slice(0, 4);
  return (
    <Link
      to={`/episodio/${episode.slug}`}
      className="group block bg-card border border-border rounded-sm p-6 shadow-parchment hover:border-primary/60 transition-colors"
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground">
          {episode.episode_number != null ? `Nº ${episode.episode_number}` : "Episódio"}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(episode.published_at)} · {formatDuration(episode.duration_seconds)}
        </span>
      </div>
      <h3 className="font-serif text-xl leading-snug text-foreground group-hover:text-primary transition-colors">
        {episode.title}
      </h3>
      {episode.resumo && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {truncate(episode.resumo, 260)}
        </p>
      )}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-sm bg-accent text-accent-foreground border border-border/60"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center gap-3">
        {episode.ligacao_portugal && (
          <span className="text-[10px] uppercase tracking-widest text-primary">★ Portugal</span>
        )}
        {episode.controversia && (
          <span className="text-[10px] uppercase tracking-widest text-destructive">Controverso</span>
        )}
        {episode.complexidade && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {episode.complexidade}
          </span>
        )}
      </div>
    </Link>
  );
}