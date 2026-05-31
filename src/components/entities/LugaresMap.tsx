import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { useLugaresMap } from "@/hooks/useLugaresMap";

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function LugaresMap() {
  const { data, isLoading, isError } = useLugaresMap();
  const navigate = useNavigate();
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

  if (isLoading) return <p className="text-muted-foreground italic">A carregar mapa…</p>;
  if (isError) return <p className="text-destructive">Erro a carregar mapa.</p>;

  return (
    <div
      className="w-full rounded-sm overflow-hidden border border-border"
      style={{ height: "70vh", minHeight: 420 }}
    >
      <MapContainer
        center={[20, 10]}
        zoom={2}
        scrollWheelZoom={!isMobile}
        style={{ height: "100%", width: "100%", background: "#FAFAFA" }}
        worldCopyJump
      >
        <InvalidateOnMount />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(data ?? []).map((p) => {
          const count = p.episode_count ?? 0;
          const radius = 4 + Math.sqrt(count) * 1.2;
          return (
            <CircleMarker
              key={p.slug}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{
                color: "#1D4ED8",
                fillColor: "#2563EB",
                fillOpacity: 0.6,
                weight: 1,
              }}
              eventHandlers={{
                click: () => navigate(`/lugar/${p.slug}`),
              }}
            >
              <Tooltip direction="top" offset={[0, -2]} opacity={1}>
                <div className="text-sm">
                  <strong>{p.canonical_name}</strong>
                  <span className="text-muted-foreground"> · {count} ep.</span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}