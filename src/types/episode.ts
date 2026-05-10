export type Complexidade = "básico" | "intermédio" | "avançado" | string;

export interface Episode {
  id: string;
  slug: string;
  episode_number: number | null;
  title: string;
  published_at: string | null;
  duration_seconds: number | null;
  url: string | null;

  resumo: string | null;
  ideias_principais: string[] | null;

  personagens: string[] | null;
  paises: string[] | null;
  epocas: string[] | null;
  temas: string[] | null;
  eventos: string[] | null;

  guerras_conflitos: string[] | null;
  livros_recomendados: string[] | null;
  livros_citados: string[] | null;
  filmes_documentarios: string[] | null;

  tipo_episodio: string | null;
  ligacao_portugal: boolean | null;
  controversia: boolean | null;
  complexidade: Complexidade | null;

  source: string | null;
}