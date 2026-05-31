import { Link } from "react-router-dom";

export default function EntityCard({
  to,
  name,
  count,
  meta,
}: {
  to: string;
  name: string;
  count: number | null;
  meta?: string;
}) {
  return (
    <Link
      to={to}
      className="block bg-card border border-border border-l-2 border-l-primary rounded-sm p-4 hover:border-primary transition-colors"
    >
      <p className="font-serif text-lg leading-snug text-foreground">{name}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {count ?? 0} {count === 1 ? "episódio" : "episódios"}
        {meta ? ` · ${meta}` : ""}
      </p>
    </Link>
  );
}

export function EntityGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}