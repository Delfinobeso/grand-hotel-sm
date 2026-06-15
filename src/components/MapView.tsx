"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { HotelContent } from "@/lib/content";
import { HOTEL, GHSM_VENUES } from "@/lib/hotel";
import { NavigateButton } from "@/components/ui";

function createIcon(highlight: boolean): L.DivIcon {
  const size = highlight ? 18 : 14;
  const background = highlight ? "var(--color-accent)" : "var(--color-surface)";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${background};border:2px solid var(--color-accent);box-shadow:0 1px 4px rgba(0,0,0,0.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapView({ t }: { t: HotelContent }) {
  const descriptions: Record<string, string> = {
    titanoSuites: t.info.group.titanoSuites.body,
    ...Object.fromEntries(t.dining.venues.map((v) => [v.id, v.body])),
  };

  const points = [
    {
      id: "hotel",
      name: HOTEL.name,
      lat: HOTEL.lat,
      lon: HOTEL.lon,
      body: `${HOTEL.addressLine1}, ${HOTEL.addressLine2}`,
      highlight: true,
    },
    ...GHSM_VENUES.map((v) => ({
      id: v.id,
      name: v.name,
      lat: v.lat,
      lon: v.lon,
      body: descriptions[v.id] ?? "",
      highlight: false,
    })),
  ];

  return (
    <MapContainer center={[HOTEL.lat, HOTEL.lon]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lon]} icon={createIcon(p.highlight)}>
          <Popup>
            <div className="flex flex-col gap-2 py-1">
              <div>
                <p className="font-semibold text-[var(--color-text)]">{p.name}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{p.body}</p>
              </div>
              <NavigateButton lat={p.lat} lon={p.lon} name={p.name} label={t.common.openInMapsLabel} variant="solid" />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
