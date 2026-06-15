import type { ServiceHours } from "@/lib/hours";

export const HOTEL = {
  name: "Grand Hotel San Marino",
  addressLine1: "Viale Onofri 31",
  addressLine2: "47890 San Marino",
  phone: "+378 0549 992400",
  phoneHref: "tel:+3780549992400",
  lat: 43.933783,
  lon: 12.448952,
};

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lon: number;
  phone?: string;
  phoneHref?: string;
}

/** GHSM Group venues outside the hotel — coordinates from OpenStreetMap (centro storico). */
export const GHSM_VENUES: MapPin[] = [
  {
    id: "titanoSuites",
    name: "Titano Suites",
    lat: 43.935832,
    lon: 12.447008,
    phone: "+378 0549 991007",
    phoneHref: "tel:+3780549991007",
  },
  {
    id: "laTerrazza",
    name: "Ristorante La Terrazza",
    lat: 43.936025,
    lon: 12.446984,
    phone: "+378 0549 991007",
    phoneHref: "tel:+3780549991007",
  },
  {
    id: "caffeTitano",
    name: "Caffè Titano",
    lat: 43.936063,
    lon: 12.446703,
    phone: "+378 0549 992473",
    phoneHref: "tel:+3780549992473",
  },
  {
    id: "cremeria",
    name: "La Cremeria del Titano",
    lat: 43.935983,
    lon: 12.446764,
    phone: "+378 0549 992473",
    phoneHref: "tel:+3780549992473",
  },
];

export interface Airport {
  id: string;
  code: string;
  name: string;
  distanceKm: number;
  lat: number;
  lon: number;
}

/** Airport coordinates: public IATA reference points. */
export const AIRPORTS: Airport[] = [
  { id: "rimini", code: "RMI", name: "Rimini", distanceKm: 25, lat: 44.0203, lon: 12.6128 },
  { id: "ancona", code: "AOI", name: "Ancona", distanceKm: 100, lat: 43.6163, lon: 13.3623 },
  { id: "forli", code: "FRL", name: "Forlì", distanceKm: 60, lat: 44.1949, lon: 12.0696 },
  { id: "bologna", code: "BLQ", name: "Bologna", distanceKm: 130, lat: 44.5354, lon: 11.2887 },
];

/** Real-time open/closed status definitions for in-hotel services (Europe/Rome). */
export const SERVICE_HOURS = {
  reception: { type: "always" } satisfies ServiceHours,
  arengo: {
    type: "ranges",
    ranges: [
      { open: "07:00", close: "10:00" },
      { open: "12:00", close: "14:30" },
      { open: "19:00", close: "21:30" },
    ],
  } satisfies ServiceHours,
  roomService: { type: "ranges", ranges: [{ open: "07:00", close: "23:00" }] } satisfies ServiceHours,
  messegue: { type: "onrequest" } satisfies ServiceHours,
  gym: { type: "ranges", ranges: [{ open: "08:00", close: "20:00" }] } satisfies ServiceHours,
  valet: { type: "ranges", ranges: [{ open: "07:00", close: "23:00" }] } satisfies ServiceHours,
  laundry: { type: "ranges", ranges: [{ open: "08:30", close: "16:00" }] } satisfies ServiceHours,
} as const;
