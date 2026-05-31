import { Link } from "react-router-dom";
import { formatDate } from "@/lib/format";

export default function EntityEpisodeList({
  items,
}: {
  items: Array<{
    episode_slug: string;
    episode_title: string;
    episode_number: number | null;
    published_at: string | null;
    subtype?: string | null;
  }>;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground italic">Sem episódios.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((e) => (
        <li key={e.episode_slug}>
          <Link
            to={`/episodio/${e.episode_slug}`}
            className="block bg-card border border-border border-l-2 border-l-primary rounded-sm p-4 hover:border-primary transition-colors"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-muted-foreground">
              {e.episode_number != null && <span>Nº {e.episode_number}</span>}
              <span>{formatDate(e.published_at)}</span>
              {e.subtype && (
                <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground tracking-wider">
                  {e.subtype}
                </span>
              )}
            </div>
            <p className="mt-2 font-serif text-lg text-foreground leading-snug">
              {e.episode_title}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}