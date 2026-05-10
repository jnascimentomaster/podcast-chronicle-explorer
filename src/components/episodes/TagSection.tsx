import { Link } from "react-router-dom";

export default function TagSection({
  title, items, paramKey, icon,
}: {
  title: string;
  items: string[] | null | undefined;
  paramKey?: string;
  icon?: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-6">
      <h4 className="font-serif text-sm uppercase tracking-widest text-muted-foreground mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((v) => {
          const inner = (
            <span className="text-sm px-2.5 py-1 rounded-sm bg-accent text-accent-foreground border border-border/60">
              {v}
            </span>
          );
          if (!paramKey) return <span key={v}>{inner}</span>;
          return (
            <Link
              key={v}
              to={`/episodios?${paramKey}=${encodeURIComponent(v)}`}
              className="hover:opacity-80 transition-opacity"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ListSection({
  title, items, icon,
}: {
  title: string;
  items: string[] | null | undefined;
  icon?: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-6">
      <h4 className="font-serif text-sm uppercase tracking-widest text-muted-foreground mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((v, i) => (
          <li key={`${v}-${i}`} className="text-foreground leading-relaxed before:content-['—'] before:text-muted-foreground before:mr-2">
            {v}
          </li>
        ))}
      </ul>
    </section>
  );
}