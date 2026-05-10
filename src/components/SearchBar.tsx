import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  initial = "",
  size = "lg",
  target = "pesquisa",
}: {
  initial?: string;
  size?: "lg" | "md";
  target?: "pesquisa" | "episodios";
}) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    const base = target === "pesquisa" ? "/pesquisa" : "/episodios";
    navigate(q ? `${base}?q=${encodeURIComponent(q)}` : base);
  }

  const padY = size === "lg" ? "py-4" : "py-3";
  const text = size === "lg" ? "text-lg" : "text-base";

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Pesquisa por tema, personagem ou evento histórico…"
        className={`w-full ${padY} pl-12 pr-32 ${text} bg-card border border-border rounded-sm font-serif italic placeholder:text-muted-foreground/70 text-foreground shadow-parchment focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
      />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground text-sm uppercase tracking-wider rounded-sm hover:bg-primary-hover transition-colors"
      >
        Pesquisar
      </button>
    </form>
  );
}