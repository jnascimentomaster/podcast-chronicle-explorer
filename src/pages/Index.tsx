import { Link } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import EpisodeCard from "@/components/episodes/EpisodeCard";
import { useEpisodeCount, useRecentEpisodes, useTopThemes } from "@/hooks/useEpisodes";
import { supabaseConfigured } from "@/lib/supabase";

function ConfigNotice() {
  if (supabaseConfigured) return null;
  return (
    <div className="container mt-6">
      <div className="bg-accent/60 border border-border text-foreground rounded-sm p-4 text-sm">
        <strong className="font-serif">Liga a tua base de dados.</strong>{" "}
        Define <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no
        ficheiro <code>.env</code> para carregar episódios reais.
      </div>
    </div>
  );
}

export default function Index() {
  const { data: count } = useEpisodeCount();
  const { data: recent, isLoading: loadingRecent } = useRecentEpisodes(6);
  const { data: themes } = useTopThemes(12);

  return (
    <>
      <ConfigNotice />

      {/* Hero */}
      <section className="bg-background-alt border-b border-border">
        <div className="container pt-20 pb-16 text-center">
          <p className="label-eyebrow text-primary mb-5">
            Arquivo · Pesquisa · Memória
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-3xl mx-auto" style={{ letterSpacing: "-0.05em" }}>
            Toda a <span className="text-primary">História</span> contada no podcast,
            numa plataforma interactiva.
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            Episódios transcritos, indexados e organizados por temas, personagens
            e épocas. Pesquisa em linguagem natural e descobre o que já foi dito.
          </p>
          <div className="mt-10 max-w-2xl mx-auto">
            <SearchBar />
          </div>
          {count != null && (
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{count}</span>{" "}
              episódios transcritos e indexados
            </p>
          )}
        </div>
      </section>

      {/* Themes */}
      {themes && themes.length > 0 && (
        <section className="container py-16">
          <header className="mb-8 text-center">
            <p className="label-eyebrow text-primary mb-2">Temas</p>
            <h3 className="text-2xl font-bold">Explorar por tema</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Os temas mais recorrentes do arquivo
            </p>
          </header>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {themes.map((t) => (
              <Link
                key={t.name}
                to={`/episodios?tema=${encodeURIComponent(t.name)}`}
                className="px-3 py-1.5 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {t.name}
                <span className="ml-2 text-xs opacity-70">{t.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="container py-16 border-t border-border">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <p className="label-eyebrow text-primary mb-2">Recentes</p>
            <h3 className="text-2xl font-bold">Episódios recentes</h3>
            <p className="text-sm text-muted-foreground mt-1">
              As últimas adições ao arquivo
            </p>
          </div>
          <Link to="/episodios" className="text-sm font-semibold text-primary hover:text-primary-hover">
            Ver todos →
          </Link>
        </header>

        {loadingRecent ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(recent ?? []).map((ep) => (
              <EpisodeCard key={ep.id} episode={ep} />
            ))}
            {(!recent || recent.length === 0) && supabaseConfigured && (
              <p className="text-muted-foreground italic col-span-full text-center py-8">
                Ainda não há episódios para mostrar.
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
