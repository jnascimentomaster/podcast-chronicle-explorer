import EntityIndex from "./EntityIndex";

export default function Personagens() {
  return (
    <EntityIndex
      type="personagem"
      title="Personagens"
      subtitle="Figuras históricas que percorrem o arquivo do podcast, ordenadas pelo número de episódios."
      detailPath="/personagem"
    />
  );
}