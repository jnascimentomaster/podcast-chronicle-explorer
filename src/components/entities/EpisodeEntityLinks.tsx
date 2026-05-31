import { Link } from "react-router-dom";
import { useEpisodeEntities, type EntityType } from "@/hooks/useEntities";

const PATHS: Record<EntityType, string> = {
  personagem: "/personagem",
  lugar: "/lugar",
  livro: "/livro",
};

type EpEntity = {
  entity_id: string;
  type: EntityType;
  subtype: string | null;
  canonical_name: string;
  slug: string;
};

export default function EpisodeEntityLinks({
  episodeId,
}: {
  episodeId: string | number | undefined;
}) {
  const { data } = useEpisodeEntities(episodeId);
  const groups = {
    personagem: [] as EpEntity[],
    lugar: [] as EpEntity[],
    livro_recomendado: [] as EpEntity[],
    livro_citado: [] as EpEntity[],
  };
  for (const e of data ?? []) {
    if (e.type === "personagem") groups.personagem.push(e);
    else if (e.type === "lugar") groups.lugar.push(e);
    else if (e.type === "livro") {
      if (e.subtype === "recomendado") groups.livro_recomendado.push(e);
      else groups.livro_citado.push(e);
    }
  }

  return (
    <>
      <Section title="Personagens" items={groups.personagem} type="personagem" />
      <Section title="Lugares" items={groups.lugar} type="lugar" />
      <Section title="Livros recomendados" items={groups.livro_recomendado} type="livro" icon="📖" />
      <Section title="Livros citados" items={groups.livro_citado} type="livro" icon="📚" />
    </>
  );
}

function Section({
  title,
  items,
  type,
  icon,
}: {
  title: string;
  items: Array<{ entity_id: string; canonical_name: string; slug: string }>;
  type: EntityType;
  icon?: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-6">
      <h4 className="label-eyebrow mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((e) => (
          <Link
            key={e.entity_id}
            to={`${PATHS[type]}/${e.slug}`}
            className="text-sm px-3 py-1 rounded-full bg-accent text-accent-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {e.canonical_name}
          </Link>
        ))}
      </div>
    </section>
  );
}