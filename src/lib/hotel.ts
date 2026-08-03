import type { ServiceHours } from "@/lib/hours";

export const HOTEL = {
  name: "Grand Hotel San Marino",
  addressLine1: "Viale Onofri 31",
  addressLine2: "47890 San Marino",
  phone: "+39 0549 992400",
  phoneHref: "tel:+390549992400",
  lat: 43.933581,
  lon: 12.449153,
};

/** Link review reali (Google/Tripadvisor) per i 4 outlet GHSM, richiesti da feedback
 *  portale 2026-08-02 — chiave = MapPin.id dove esiste, "hotel" per il Grand Hotel stesso.
 *  Google usa il formato ufficiale Maps URLs (search query), non un Place ID. */
export const REVIEW_LINKS: Record<string, { googleUrl: string; tripadvisorUrl: string }> = {
  hotel: {
    googleUrl: "https://www.google.com/maps/search/?api=1&query=Grand+Hotel+San+Marino+Viale+Onofri+31+San+Marino",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Hotel_Review-g187809-d249113-Reviews-Grand_Hotel_San_Marino-City_of_San_Marino.html",
  },
  laTerrazza: {
    googleUrl:
      "https://www.google.com/maps/search/?api=1&query=Ristorante+La+Terrazza+Contrada+del+Collegio+31+San+Marino",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Restaurant_Review-g187809-d3645023-Reviews-La_Terrazza_Ristorante-City_of_San_Marino.html",
  },
  laLoggia: {
    googleUrl: "https://www.google.com/maps/search/?api=1&query=La+Loggia+Piazzetta+Garibaldi+San+Marino",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Restaurant_Review-g187809-d23476861-Reviews-La_Loggia-City_of_San_Marino.html",
  },
  messegue: {
    googleUrl: "https://www.google.com/maps/search/?api=1&query=Centro+Messegue+Viale+Onofri+31+San+Marino",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g187809-d34112368-Reviews-Centro_Messegue_San_Marino-City_of_San_Marino.html",
  },
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
  /** Solo per i locali con menu online reale (stessa fonte del concierge AI,
   *  vedi src/lib/concierge.ts § MENÙ e src/lib/menus.ts). L'Arengo, Cremeria
   *  e La Loggia non hanno menu online: nessun bottone per loro. */
  menuUrl?: string;
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
    phone: "+39 0549 991007",
    phoneHref: "tel:+390549991007",
    walkMinutes: 5,
  },
  {
    id: "laTerrazza",
    name: "Ristorante La Terrazza",
    lat: 43.9353,
    lon: 12.4490,
    phone: "+39 0549 991007",
    phoneHref: "tel:+390549991007",
    walkMinutes: 6,
    bookingUrl:
      "https://widget.thefork.com/it/bdef5000-1a1c-435f-9501-170ed277ac99?origin=facebook&utm_medium=integration&utm_source=instagram&step=date",
    menuUrl: "https://linktr.ee/laterrazza",
  },
  {
    id: "caffeTitano",
    name: "Caffè Titano",
    lat: 43.936071,
    lon: 12.446717,
    phone: "+39 0549 992473",
    phoneHref: "tel:+390549992473",
    walkMinutes: 5,
    menuUrl: "https://linktr.ee/caffetitanosanmarino",
  },
  {
    id: "cremeria",
    name: "La Cremeria del Titano",
    lat: 43.936024,
    lon: 12.446753,
    phone: "+39 0549 992473",
    phoneHref: "tel:+390549992473",
    walkMinutes: 5,
  },
  {
    id: "laLoggia",
    name: "La Loggia",
    lat: 43.935803,
    lon: 12.447041,
    phone: "+39 0549 946284",
    phoneHref: "tel:+390549946284",
    walkMinutes: 5,
  },
];

export interface PointOfInterest {
  id: string;
  name: string;
  lat: number;
  lon: number;
  walkMinutes: number;
  /** True for the 6 landmarks on the classic sightseeing route drawn on the map.
   *  New POIs added later are pin + card only, and are kept off that route line. */
  onRoute?: boolean;
}

/** San Marino landmarks worth visiting — coordinates verified via OpenStreetMap Nominatim. */
export const POINTS_OF_INTEREST: PointOfInterest[] = [
  { id: "palazzoPubblico", name: "Palazzo Pubblico", lat: 43.936783, lon: 12.446273, walkMinutes: 5, onRoute: true },
  { id: "basilica", name: "Basilica del Santo", lat: 43.937147, lon: 12.446694, walkMinutes: 5, onRoute: true },
  { id: "museoStato", name: "Museo di Stato", lat: 43.935991, lon: 12.446556, walkMinutes: 5, onRoute: true },
  { id: "guaita", name: "Prima Torre · Rocca Guaita", lat: 43.935215, lon: 12.449239, walkMinutes: 8, onRoute: true },
  { id: "cesta", name: "Seconda Torre · Rocca Cesta", lat: 43.932623, lon: 12.451356, walkMinutes: 12, onRoute: true },
  { id: "funivia", name: "Funivia di San Marino", lat: 43.939070, lon: 12.445616, walkMinutes: 10, onRoute: true },
  // Added 2026-07-19 — coordinates via Nominatim, walkMinutes via the app's own
  // OSRM foot router (routing.openstreetmap.de/routed-foot). Not part of the
  // classic route polyline: pin + card + list entry only (onRoute omitted).
  { id: "cavaBalestrieri", name: "Cava dei Balestrieri", lat: 43.9373895, lon: 12.4457579, walkMinutes: 7 },
  { id: "passoStreghe", name: "Passo delle Streghe", lat: 43.9347715, lon: 12.4497637, walkMinutes: 7 },
  { id: "montale", name: "Terza Torre · Torre Montale", lat: 43.9299904, lon: 12.4524743, walkMinutes: 10 },
  { id: "chiesaSanFrancesco", name: "Chiesa di San Francesco", lat: 43.9352302, lon: 12.4471200, walkMinutes: 4 },
  { id: "museoCuriosita", name: "Museo delle Curiosità", lat: 43.9351757, lon: 12.4484983, walkMinutes: 5 },
  { id: "portaSanFrancesco", name: "Porta San Francesco", lat: 43.9352215, lon: 12.4467932, walkMinutes: 4 },
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
