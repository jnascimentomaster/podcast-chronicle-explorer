import { useState, useEffect, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import Highlight from "@/components/Highlight";
import { formatDate } from "@/lib/format";

const SUGGESTIONS = [
  "diplomacia portuguesa",
  "Primeira Guerra Mundial",
  "império colonial",
  "Salazar e o Estado Novo",
  "queda de Constantinopla",
];

export default function Pesquisa() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);

  useEffect(() => {
    const q = params.get("q") ?? "";
    setInput(q);
    setSubmitted(q);
  }, [params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setParams({ q }, { replace: true });
    setSubmitted(q);
  }

  const { data, isLoading, isError, error } = useSemanticSearch(submitted);
  const errorMsg = error instanceof Error ? error.message : "";

  return (
    <div className="container py-12 max-w-4xl">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Pesquisa semântica
        </p>
        <h2 className="font-serif text-4xl mb-3">Pergunta ao arquivo</h2>
        <p className="text-muted-foreground italic">
          Pesquisa em linguagem natural pelo conteúdo de todas as transcrições.
        </p>
      </header>

      <form onSubmit={onSubmit} className="relative mb-10">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Quem foi o primeiro embaixador português em Pequim?"
          className="w-full py-4 pl-12 pr-32 text-lg bg-card border border-border rounded-sm font-serif italic placeholder:text-muted-foreground/70 text-foreground shadow-parchment focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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

      {!submitted && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4 italic">Sugestões para começar</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  setParams({ q: s }, { replace: true });
                  setSubmitted(s);
                }}
                className="px-3 py-1.5 bg-card border border-border rounded-sm text-sm hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && submitted && (
        <p className="text-center text-muted-foreground italic">A pesquisar no arquivo…</p>
      )}

      {isError && (
        <div className="bg-destructive/10 border border-destructive/40 text-destructive rounded-sm p-4 text-sm">
          <p className="font-medium mb-1">A pesquisa falhou.</p>
          <p className="text-xs opacity-80 break-all">{errorMsg}</p>
          <p className="mt-2 text-xs">
            Verifica que a edge function <code>search</code> está deployed no teu Supabase
            e que a OPENAI_API_KEY está configurada.
          </p>
        </div>
      )}

      {data && data.length === 0 && submitted && !isLoading && (
        <p className="text-center text-muted-foreground italic">
          Nada encontrado para “{submitted}”.
        </p>
      )}

      {data && data.length > 0 && (
        <ol className="space-y-6">
          {data.map((r, i) => (
            <li key={`${r.episode_id}-${i}`}>
              <Link
                to={`/episodio/${r.slug}`}
                className="block bg-card border border-border rounded-sm p-6 hover:border-primary transition-colors shadow-parchment"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground">
                    {r.episode_number != null ? `Nº ${r.episode_number}` : "Episódio"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.published_at)} · {(r.similarity * 100).toFixed(0)}% relevância
                  </span>
                </div>
                <h3 className="font-serif text-xl text-foreground mb-3">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-serif italic">
                  “…<Highlight text={r.chunk_text} query={submitted} />…”
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}