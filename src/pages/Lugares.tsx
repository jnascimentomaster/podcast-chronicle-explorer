import EntityIndex from "./EntityIndex";

export default function Lugares() {
  return (
    <EntityIndex
      type="lugar"
      title="Lugares"
      subtitle="Países, regiões e cidades que dão palco ao podcast."
      detailPath="/lugar"
    />
  );
}