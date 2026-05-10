import { Link, NavLink, Outlet } from "react-router-dom";
import { ReactNode } from "react";

function Nav({ to, children, end }: { to: string; children: ReactNode; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `text-sm tracking-wide uppercase transition-colors ${
          isActive
            ? "text-primary border-b border-primary pb-1"
            : "text-muted-foreground hover:text-primary"
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
      <header className="border-b border-border bg-background-alt/40 backdrop-blur-sm">
        <div className="container py-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <Link to="/" className="group">
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground leading-none">
              História <span className="italic text-primary">Explorer</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground italic">
              O arquivo do podcast <span className="font-medium">E o Resto é História</span>
            </p>
          </Link>
          <nav className="flex items-center gap-6">
            <Nav to="/" end>Início</Nav>
            <Nav to="/episodios">Episódios</Nav>
            <Nav to="/pesquisa">Pesquisa</Nav>
            <span className="text-sm tracking-wide uppercase text-muted-foreground/50 cursor-not-allowed" title="Em breve">
              Temas
            </span>
          </nav>
        </div>
        <div className="ornament-rule" />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-border bg-background-alt/40">
        <div className="container py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-muted-foreground">
          <p className="font-serif italic">
            Um arquivo dedicado ao podcast de Rui Ramos e João Miguel Tavares.
          </p>
          <a
            href="https://observador.pt/programas/e-o-resto-e-historia/"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:text-primary-hover underline-offset-4 hover:underline"
          >
            Ouvir no Observador →
          </a>
        </div>
      </footer>
    </div>
  );
}