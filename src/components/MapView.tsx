"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { HotelContent } from "@/lib/content";
import { HOTEL, GHSM_VENUES, POINTS_OF_INTEREST } from "@/lib/hotel";
import { NavigateButton } from "@/components/ui";

type Variant = "hotel" | "venue" | "poi" | "user";

function createIcon(variant: Variant): L.DivIcon {
  if (variant === "user") {
    return L.divIcon({
      className: "",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px">
        <div style="width:14px;height:14px;border-radius:50%;background:#007AFF;border:3px solid white;box-shadow:0 0 0 2px #007AFF,0 2px 8px rgba(0,0,0,0.35)"></div>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  const size = variant === "hotel" ? 18 : 14;
  const background = variant === "hotel" ? "var(--color-accent)" : variant === "poi" ? "var(--color-accent-soft)" : "var(--color-surface)";
  const radius = variant === "poi" ? "4px" : "50%";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:${radius};background:${background};border:2px solid var(--color-accent);box-shadow:0 1px 4px rgba(0,0,0,0.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Bounding box covering hotel + centro storico POIs. */
const MAP_BOUNDS: L.LatLngBoundsExpression = [
  // southwest corner
  [43.932, 12.442],
  // northeast corner
  [43.942, 12.458],
];

/** Show a user-location dot and request geolocation permission. */
function UserMarker() {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        // lato utente, se è dentro i bounds non spostiamo la mappa
      },
      () => {
        // permission denied or error — silent
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
    );
  }, [map]);

  if (!position) return null;
  return <Marker position={position} icon={createIcon("user")} />;
}

export default function MapView({ t }: { t: HotelContent }) {
  const venueDescriptions: Record<string, string> = {
    titanoSuites: t.about.group.titanoSuites.body,
    ...Object.fromEntries(t.dining.venues.map((v) => [v.id, v.body])),
  };
  const poiDescriptions: Record<string, string> = Object.fromEntries(
    t.info.pois.map((p: { id: string; name: string; body: string }) => [p.id, p.body]),
  );

  const points: { id: string; name: string; lat: number; lon: number; body: string; variant: Variant }[] = [
    {
      id: "hotel",
      name: HOTEL.name,
      lat: HOTEL.lat,
      lon: HOTEL.lon,
      body: `${HOTEL.addressLine1}, ${HOTEL.addressLine2}`,
      variant: "hotel",
    },
    ...GHSM_VENUES.map((v) => ({
      id: v.id,
      name: v.name,
      lat: v.lat,
      lon: v.lon,
      body: venueDescriptions[v.id] ?? "",
      variant: "venue" as Variant,
    })),
    ...POINTS_OF_INTEREST.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat,
      lon: p.lon,
      body: poiDescriptions[p.id] ?? "",
      variant: "poi" as Variant,
    })),
  ];

  return (
    <MapContainer bounds={MAP_BOUNDS} scrollWheelZoom={false} className="h-full w-full" zoomSnap={0.5}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <UserMarker />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lon]} icon={createIcon(p.variant)}>
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
