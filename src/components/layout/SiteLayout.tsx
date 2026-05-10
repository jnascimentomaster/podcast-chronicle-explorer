import { Link, NavLink, Outlet } from "react-router-dom";
import { ReactNode } from "react";

function Nav({ to, children, end }: { to: string; children: ReactNode; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `text-sm font-semibold transition-colors ${
          isActive
            ? "text-primary"
            : "text-foreground/70 hover:text-primary"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background sticky top-0 z-30">
        <div className="container py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to="/" className="group">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none" style={{ letterSpacing: "-0.04em" }}>
              História <span className="text-primary">Explorer</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              O arquivo do podcast <span className="font-semibold">E o Resto é História</span>
            </p>
          </Link>
          <nav className="flex items-center gap-6">
            <Nav to="/" end>Início</Nav>
            <Nav to="/episodios">Episódios</Nav>
            <Nav to="/temas">Temas</Nav>
            <Nav to="/pesquisa">Pesquisa</Nav>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-border bg-background">
        <div className="container py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-muted-foreground">
          <p>
            Um arquivo dedicado ao podcast de Rui Ramos e João Miguel Tavares.
          </p>
          <a
            href="https://observador.pt/programas/e-o-resto-e-historia/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:text-primary-hover"
          >
            Ouvir no Observador →
          </a>
        </div>
      </footer>
    </div>
  );
}