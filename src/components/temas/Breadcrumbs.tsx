import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs">
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {c.to && !isLast ? (
              <Link
                to={c.to}
                className="label-eyebrow text-muted-foreground hover:text-primary transition-colors"
              >
                {c.label}
              </Link>
            ) : (
              <span className={`label-eyebrow ${isLast ? "text-foreground" : "text-muted-foreground"}`}>
                {c.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </span>
        );
      })}
    </nav>
  );
}
