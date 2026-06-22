import type { ServiceHours } from "@/lib/hours";

export const HOTEL = {
  name: "Grand Hotel San Marino",
  addressLine1: "Viale Onofri 31",
  addressLine2: "47890 San Marino",
  phone: "+378 0549 992400",
  phoneHref: "tel:+3780549992400",
  lat: 43.933581,
  lon: 12.449153,
};

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lon: number;
  phone?: string;
  phoneHref?: string;
  walkMinutes?: number;
  bookingUrl?: string;
}

/** TheFork booking widget for Ristorante La Terrazza. */
export const LA_TERRAZZA_BOOKING =
  "https://widget.thefork.com/it/bdef5000-1a1c-435f-9501-170ed277ac99?origin=facebook&utm_medium=integration&utm_source=instagram&step=date";

/** GHSM Group venues outside the hotel — coordinates from OpenStreetMap (centro storico). */
export const GHSM_VENUES: MapPin[] = [
  {
    id: "titanoSuites",
    name: "Titano Suites",
    lat: 43.936049,
    lon: 12.446947,
    phone: "+378 0549 991007",
    phoneHref: "tel:+3780549991007",
    walkMinutes: 5,
  },
  {
    id: "laTerrazza",
    name: "Ristorante La Terrazza",
    lat: 43.9353,
    lon: 12.4490,
    phone: "+378 0549 991007",
    phoneHref: "tel:+3780549991007",
    walkMinutes: 6,
    bookingUrl:
      "https://widget.thefork.com/it/bdef5000-1a1c-435f-9501-170ed277ac99?origin=facebook&utm_medium=integration&utm_source=instagram&step=date",
  },
  {
    id: "caffeTitano",
    name: "Caffè Titano",
    lat: 43.936071,
    lon: 12.446717,
    phone: "+378 0549 992473",
    phoneHref: "tel:+3780549992473",
    walkMinutes: 5,
  },
  {
    id: "cremeria",
    name: "La Cremeria del Titano",
    lat: 43.936024,
    lon: 12.446753,
    phone: "+378 0549 992473",
    phoneHref: "tel:+3780549992473",
    walkMinutes: 5,
  },
];

export interface PointOfInterest {
  id: string;
  name: string;
  lat: number;
  lon: number;
  walkMinutes: number;
}

/** San Marino landmarks worth visiting — coordinates verified via OpenStreetMap Nominatim. */
export const POINTS_OF_INTEREST: PointOfInterest[] = [
  { id: "palazzoPubblico", name: "Palazzo Pubblico", lat: 43.936783, lon: 12.446273, walkMinutes: 5 },
  { id: "basilica", name: "Basilica del Santo", lat: 43.937147, lon: 12.446694, walkMinutes: 5 },
  { id: "museoStato", name: "Museo di Stato", lat: 43.935991, lon: 12.446556, walkMinutes: 5 },
  { id: "guaita", name: "Prima Torre · Rocca Guaita", lat: 43.935215, lon: 12.449239, walkMinutes: 8 },
  { id: "cesta", name: "Seconda Torre · Rocca Cesta", lat: 43.932623, lon: 12.451356, walkMinutes: 12 },
  { id: "funivia", name: "Funivia di San Marino", lat: 43.939070, lon: 12.445616, walkMinutes: 10 },
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
