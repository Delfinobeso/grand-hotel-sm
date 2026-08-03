"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, LocateFixed, Footprints, Car, List, X } from "lucide-react";
import { HOTEL, GHSM_VENUES, POINTS_OF_INTEREST, AIRPORTS } from "@/lib/hotel";
import type { HotelContent } from "@/lib/content";
import { mapsUrl, SHEET, BACKDROP_FADE } from "@/components/ui";

type LatLng = [number, number];
type Kind = "poi" | "venue" | "airport";
type Filter = "all" | Kind;

interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  desc: string;
  kind: Kind;
  mode: "walk" | "drive";
  walk?: number;
  km?: number;
  /** Whether this place participates in the classic sightseeing route line. */
  routable: boolean;
}

function buildPlaces(t: HotelContent): Place[] {
  const venueDesc: Record<string, string> = {
    titanoSuites: t.about.group.titanoSuites.body,
    ...Object.fromEntries(t.dining.venues.map((v) => [v.id, v.body])),
  };
  const poiDesc: Record<string, string> = Object.fromEntries(t.info.pois.map((p) => [p.id, p.body]));

  const pois: Place[] = POINTS_OF_INTEREST.map((p) => ({
    id: p.id, name: p.name, lat: p.lat, lon: p.lon, desc: poiDesc[p.id] ?? "", kind: "poi", mode: "walk", walk: p.walkMinutes,
    routable: p.onRoute === true,
  }));
  const venues: Place[] = GHSM_VENUES.map((v) => ({
    id: v.id, name: v.name, lat: v.lat, lon: v.lon, desc: venueDesc[v.id] ?? "", kind: "venue", mode: "walk", walk: v.walkMinutes ?? 5,
    routable: true,
  }));
  const airports: Place[] = AIRPORTS.map((a) => ({
    id: a.id, name: `${a.name} ${a.code}`, lat: a.lat, lon: a.lon,
    desc: t.info.airports.note, kind: "airport", mode: "drive", km: a.distanceKm,
    routable: true,
  }));
  // Sightseeing first, then group venues, then airports (reachable by car).
  return [...pois, ...venues, ...airports];
}

/** I colori della mappa vivono nei token --map-* (globals.css), definiti in entrambi
 *  i temi: qui si consumano come var() così i pin e i chip seguono il tema scuro. */
const KIND_COLOR: Record<Kind, string> = {
  poi: "var(--map-poi)",
  venue: "var(--map-venue)",
  airport: "var(--map-airport)",
};

/** Lo stroke di una <path> SVG è un attributo di presentazione: non accetta var().
 *  Per la linea del percorso i token vanno quindi risolti a runtime e riletti
 *  quando cambia [data-theme]. */
const ROUTE_FALLBACK = { walk: "#0a2444", drive: "#3f7d6e" };

function readRouteColors() {
  if (typeof window === "undefined") return ROUTE_FALLBACK;
  const s = getComputedStyle(document.documentElement);
  return {
    walk: s.getPropertyValue("--map-poi").trim() || ROUTE_FALLBACK.walk,
    drive: s.getPropertyValue("--map-airport").trim() || ROUTE_FALLBACK.drive,
  };
}

const hotelIcon = L.divIcon({
  className: "",
  html: `<div class="ghsm-hotel-pin"><span class="ghsm-hotel-pulse"></span><span class="ghsm-hotel-dot"></span></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div class="ghsm-user-pin"><span class="ghsm-user-pulse"></span><span class="ghsm-user-dot"></span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function placeIcon(active: boolean, kind: Kind): L.DivIcon {
  const color = KIND_COLOR[kind];
  const size = active ? 22 : 14;
  const inner = active
    ? `<span class="ghsm-place-pin-active" style="--pin:${color}"></span>`
    : `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid var(--map-pin-border);box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`;
  return L.divIcon({ className: "", html: inner, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

/** Leaflet renders blank if its container had no size at init; fix size after mount. */
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const id = setTimeout(fix, 250);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

/** Drives camera + route whenever the active place changes (walking or driving).
 *  Places outside the classic route (new POIs added later, `routable: false`)
 *  still get the camera framing, just without a route line drawn to them. */
function MapDriver({ active, onRoute }: { active: Place; onRoute: (r: LatLng[]) => void }) {
  const map = useMap();

  useEffect(() => {
    const straight: LatLng[] = [
      [HOTEL.lat, HOTEL.lon],
      [active.lat, active.lon],
    ];
    // Frame the whole route; large bottom padding keeps it visible above the banners.
    // In alto il padding deve superare le DUE file di pill flottanti (header +
    // "Info e contatti"/"Elenco"/posizione): su mobile erano 100px e il marker
    // attivo con la sua etichetta finiva sotto le pill. Su lg le pill sono più in
    // alto e più compatte, quindi il valore originale resta valido.
    const frame = (coords: LatLng[]) => {
      // Il breakpoint è quello del viewport (lg di Tailwind), non la larghezza del
      // contenitore mappa, che su desktop è già ridotta dalla sidebar.
      const topPad = window.matchMedia("(min-width: 1024px)").matches ? 100 : 180;
      map.flyToBounds(L.latLngBounds(coords.length ? coords : straight), {
        paddingTopLeft: [28, topPad],
        paddingBottomRight: [28, 370],
        maxZoom: 17,
        duration: 0.9,
        easeLinearity: 0.24,
      });
    };

    if (!active.routable) {
      onRoute([]);
      frame(straight);
      return;
    }

    const ctrl = new AbortController();
    const profile = active.mode === "drive" ? "routed-car/route/v1/driving" : "routed-foot/route/v1/foot";
    const url = `https://routing.openstreetmap.de/${profile}/${HOTEL.lon},${HOTEL.lat};${active.lon},${active.lat}?overview=full&geometries=geojson`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const coords = d?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        const routeCoords = coords?.length ? coords.map(([lon, lat]) => [lat, lon] as LatLng) : straight;
        onRoute(routeCoords);
        frame(routeCoords);
      })
      .catch(() => {
        onRoute(straight);
        frame(straight);
      });

    return () => ctrl.abort();
  }, [active, map, onRoute]);

  return null;
}

export default function MapExplorer({ t, infoSheetOpen = false }: { t: HotelContent; infoSheetOpen?: boolean }) {
  const places = useMemo(() => buildPlaces(t), [t]);
  const [filter, setFilter] = useState<Filter>("all");
  const filteredPlaces = useMemo(
    () => (filter === "all" ? places : places.filter((p) => p.kind === filter)),
    [places, filter],
  );
  const [active, setActive] = useState(0);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);
  const rafId = useRef<number>(0);
  const mapRef = useRef<L.Map | null>(null);
  // Inizializzatore pigro: MapExplorer è caricato con ssr:false, quindi gira già
  // nel browser e i token sono leggibili al primo render (niente setState in effect).
  const [routeColors, setRouteColors] = useState(readRouteColors);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  // Set by selectPlace() (list sheet) when it needs a filter change to land the
  // target place first — consumed once the resulting re-render is committed.
  const pendingScroll = useRef<number | null>(null);

  const onRoute = useCallback((r: LatLng[]) => setRoute(r), []);

  // Rilegge i token del percorso a ogni cambio di tema.
  useEffect(() => {
    const obs = new MutationObserver(() => setRouteColors(readRouteColors()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // One-shot geolocation lookup — no watch, nothing sent anywhere but the map itself.
  const locateMe = useCallback(() => {
    if (locating) return;
    if (!navigator.geolocation) {
      setLocError(true);
      window.setTimeout(() => setLocError(false), 2500);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll: LatLng = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(ll);
        setLocating(false);
        mapRef.current?.flyTo(ll, 17, { duration: 0.9 });
      },
      () => {
        setLocating(false);
        setLocError(true);
        window.setTimeout(() => setLocError(false), 2500);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, [locating]);

  const scrollToCard = useCallback((i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    if (!card) return;
    programmatic.current = true;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    window.setTimeout(() => (programmatic.current = false), 600);
  }, []);

  const onScroll = useCallback(() => {
    if (programmatic.current) return;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < el.children.length; i++) {
        const c = el.children[i] as HTMLElement;
        const cc = c.offsetLeft - el.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setActive((prev) => (prev === best ? prev : best));
    });
  }, []);

  const selectFromMarker = useCallback(
    (i: number) => {
      setActive(i);
      scrollToCard(i);
    },
    [scrollToCard],
  );

  // Chip tap: swap the visible set, restart the carousel at the first card.
  const chooseFilter = useCallback(
    (f: Filter) => {
      setFilter(f);
      setActive(0);
      requestAnimationFrame(() => scrollToCard(0));
    },
    [scrollToCard],
  );

  // List sheet row tap: always resolve against the unfiltered set so any place
  // is reachable regardless of the active chip, then land the carousel on it.
  const selectPlace = useCallback(
    (id: string) => {
      const idx = places.findIndex((p) => p.id === id);
      if (idx === -1) return;
      setListOpen(false);
      pendingScroll.current = idx;
      setFilter("all");
      setActive(idx);
    },
    [places],
  );

  // Consumes a pending list-sheet selection once the "all" filter has committed
  // and the carousel's DOM reflects the full place list again.
  useEffect(() => {
    if (pendingScroll.current === null) return;
    const idx = pendingScroll.current;
    pendingScroll.current = null;
    scrollToCard(idx);
  }, [filter, places, active, scrollToCard]);

  const activePlace = filteredPlaces[active] ?? filteredPlaces[0] ?? places[0];

  const badgeFor = (k: Kind) => (k === "venue" ? "GHSM Group" : k === "airport" ? t.common.airport : t.info.poiLabel);

  const chipsHidden = infoSheetOpen || listOpen;

  const FILTERS: { key: Filter; label: string; dot?: string }[] = [
    { key: "all", label: t.common.filterAll },
    { key: "poi", label: t.common.filterPois, dot: KIND_COLOR.poi },
    { key: "venue", label: t.common.filterVenues, dot: KIND_COLOR.venue },
    { key: "airport", label: t.common.filterAirports, dot: KIND_COLOR.airport },
  ];

  // Places grouped by kind for the "Elenco" list sheet, in the same order as the map/carousel.
  const groups: { kind: Kind; label: string; items: Place[] }[] = [
    { kind: "poi", label: t.common.filterPois, items: places.filter((p) => p.kind === "poi") },
    { kind: "venue", label: t.common.filterVenues, items: places.filter((p) => p.kind === "venue") },
    { kind: "airport", label: t.common.filterAirports, items: places.filter((p) => p.kind === "airport") },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden isolate">
      <MapContainer
        ref={mapRef}
        center={[HOTEL.lat, HOTEL.lon]}
        zoom={16}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="absolute inset-0 h-full w-full"
        zoomSnap={0.25}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSize />
        <MapDriver active={activePlace} onRoute={onRoute} />

        {/* Route */}
        {route.length > 1 && (
          <Polyline
            key={activePlace.id}
            positions={route}
            pathOptions={{
              color: activePlace.mode === "drive" ? routeColors.drive : routeColors.walk,
              weight: 4,
              opacity: 0.9,
              lineCap: "round",
              className: activePlace.mode === "drive" ? "ghsm-drive-route" : "ghsm-walk-route",
            }}
          />
        )}

        {/* Hotel (origin) */}
        <Marker position={[HOTEL.lat, HOTEL.lon]} icon={hotelIcon} zIndexOffset={1200}>
          <Tooltip permanent direction="top" offset={[0, -14]} className="ghsm-label ghsm-label-hotel">
            {t.common.youAreHere}
          </Tooltip>
        </Marker>

        {/* Visitor's own position — client-side only, never sent anywhere */}
        {userPos && <Marker position={userPos} icon={userIcon} zIndexOffset={1100} />}

        {/* Places — only those matching the active chip filter */}
        {filteredPlaces.map((p, i) => {
          const isActive = i === active;
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lon]}
              icon={placeIcon(isActive, p.kind)}
              zIndexOffset={isActive ? 1000 : 0}
              eventHandlers={{ click: () => selectFromMarker(i) }}
            >
              {isActive && (
                <Tooltip key={`${p.id}-on`} permanent direction="top" offset={[0, -16]} className="ghsm-label ghsm-label-active">
                  {p.name}
                </Tooltip>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* "My location" — sits below the theme/lang controls in the page header (which
          paint above this whole isolate subtree regardless of z-index, since header is
          a positioned sibling with z-20) and above the carousel/scrim below. z-[750]
          keeps it above Leaflet's own panes (which top out around z-index 700) but
          below the scrim (z-800) and carousel (z-1000). */}
      <button
        onClick={locateMe}
        aria-label={t.common.myLocationLabel}
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[750] flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface)]/90 text-[var(--color-text)] shadow-[0_6px_20px_oklch(0.2_0.04_258/0.22)] ring-1 ring-[var(--color-border)] backdrop-blur-xl transition-transform duration-200 active:scale-95 disabled:opacity-60 lg:right-3 lg:top-16"
        disabled={locating}
      >
        <LocateFixed size={18} strokeWidth={2} className={locating ? "animate-pulse" : ""} />
      </button>

      <AnimatePresence>
        {locError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 top-[calc(env(safe-area-inset-top)+7.25rem)] z-[750] rounded-full bg-[var(--color-surface)]/95 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] shadow-[0_6px_20px_oklch(0.2_0.04_258/0.22)] ring-1 ring-[var(--color-border)] backdrop-blur-xl lg:right-3 lg:top-28"
          >
            {t.common.locationUnavailableLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Elenco" — mirrors the "Info e contatti" trigger in ExploreSection on the
          opposite corner (left on mobile, since the header's lang/theme pills own
          the top-right on mobile; left on desktop too, mirroring Info's top-right).
          Same isolate/z-[750] reasoning as "My location" above. */}
      <button
        onClick={() => setListOpen(true)}
        aria-label={t.common.listLabel}
        className="absolute left-3 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[750] inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--color-surface)]/90 px-4 text-[0.85rem] font-semibold text-[var(--color-text)] shadow-[0_6px_20px_oklch(0.2_0.04_258/0.22)] ring-1 ring-[var(--color-border)] backdrop-blur-xl transition-transform duration-200 active:scale-95 lg:left-3 lg:top-3"
      >
        <List size={16} strokeWidth={2} />
        {t.common.listLabel}
      </button>

      {/* Bottom scrim — explicit color stops (no color-interpolation hint, which iOS
          Safari can reject and drop the whole background → transparent). The lower
          ~45% stays near-opaque so the strip between the cards and the dock is fully
          covered; opacity then eases off smoothly with no sharp slope change (no Mach
          line). color-mix(... transparent) keeps each stop the bg colour at a reduced
          alpha (theme-aware, no grey/black tint). */}
      <div
        className="map-scrim pointer-events-none absolute inset-x-0 bottom-0 z-[800]"
        style={{ height: "26rem" }}
      />

      {/* Bottom overlay stack: category chips, carousel counter, then the place
          carousel. Anchored at the same bottom offset the carousel used alone. */}
      <div className="absolute inset-x-0 bottom-[var(--dock-inset)] z-[1000] flex flex-col gap-1.5 lg:bottom-4">
        {/* Attribuzione OpenStreetMap — requisito di licenza del tileset. Il control
            nativo di Leaflet è disattivato perché finirebbe sotto la dock e sotto le
            card; qui vive nella stessa pila del carosello, discreto ma sempre
            leggibile. Occupa la riga che prima teneva il contatore da solo. */}
        {!chipsHidden && (
          <div className="flex justify-end px-4">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--color-surface)]/70 px-2 py-0.5 text-[0.625rem] font-medium text-[var(--color-text-muted)] backdrop-blur-md"
            >
              © OpenStreetMap
            </a>
          </div>
        )}

        {/* Category chips — hidden while either bottom sheet is open (no visual doubling).
            Il contatore sta sulla stessa riga dei chip (ml-auto): da solo su una riga
            propria restava orfano a destra, soprattutto su desktop dove il carosello
            non arriva al bordo. */}
        {!chipsHidden && (
          <div className="relative z-10 flex items-center gap-2 px-4">
            <div className="flex flex-1 gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                return (
                  // Outer button = full 44px tap target (invisible padding); the inner
                  // span carries the compact ~34px pill look the chips are meant to have.
                  <button key={f.key} onClick={() => chooseFilter(f.key)} className="flex h-11 shrink-0 items-center">
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[0.8rem] font-semibold backdrop-blur-xl transition-colors duration-200 ${
                        isActive
                          ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                          : "bg-[var(--color-surface)]/85 text-[var(--color-text)] ring-1 ring-[var(--color-border)]"
                      }`}
                    >
                      {f.dot && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: isActive ? "currentColor" : f.dot }}
                        />
                      )}
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-[var(--color-surface)]/80 px-2.5 py-1 text-[0.7rem] font-medium tabular-nums text-[var(--color-text-muted)] backdrop-blur-md">
              {Math.min(active + 1, filteredPlaces.length)} {t.common.counterOf} {filteredPlaces.length}
            </span>
          </div>
        )}

        {/* Bottom banners. overflow-x-auto forces overflow-y to clip, which would crop
            the cards' drop shadows at the scroller's edges (a hard line above the dock).
            Generous vertical padding (pt-8 / pb-[5rem]) so each card's shadow fits fully
            inside the clip box — nothing is cropped, and the cards still sit above the
            dock. The -mt-7 pulls the scroller up so the visual gap between chips and
            cards stays small and constant (the pt-8 is only shadow room); the chips
            row is z-10 so it keeps painting and receiving taps above the overlap. */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="ghsm-carousel -mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pt-8 pb-[5.75rem] lg:pb-8"
        >
        {filteredPlaces.map((p, i) => {
          const isActive = i === active;
          return (
            <article
              key={p.id}
              className={`ghsm-card snap-center shrink-0 rounded-3xl bg-[var(--color-surface)]/95 p-4 backdrop-blur-xl transition-shadow duration-300 ${
                isActive
                  ? "shadow-[0_16px_44px_oklch(0.2_0.04_258/0.32)]"
                  : "shadow-[0_8px_24px_oklch(0.2_0.04_258/0.18)]"
              }`}
              style={{ width: "min(82vw, 22rem)", willChange: "transform" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
                  style={{
                    color:
                      p.kind === "venue"
                        ? "var(--map-badge-venue-text)"
                        : p.kind === "airport"
                          ? "var(--map-badge-airport-text)"
                          : "var(--color-accent)",
                    background:
                      p.kind === "venue"
                        ? "var(--map-badge-venue-bg)"
                        : p.kind === "airport"
                          ? "var(--map-badge-airport-bg)"
                          : "var(--color-accent-soft)",
                  }}
                >
                  {badgeFor(p.kind)}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[0.8rem] font-medium text-[var(--color-text-muted)]">
                  {p.mode === "drive" ? (
                    <>
                      <Car size={14} strokeWidth={2} />
                      {p.km} km {t.common.byCar}
                    </>
                  ) : (
                    <>
                      <Footprints size={14} strokeWidth={2} />
                      {p.walk} {t.common.minWalk}
                    </>
                  )}
                </span>
              </div>
              <h3 className="mt-2 font-display text-[1.15rem] font-semibold leading-snug text-[var(--color-text)]">
                {p.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-[0.85rem] leading-relaxed text-[var(--color-text-secondary)]">
                {p.desc}
              </p>
              <a
                href={mapsUrl(p.lat, p.lon, p.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 text-[0.85rem] font-semibold text-[var(--color-on-accent)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.97]"
              >
                {/* Niente chevron in coda: l'icona di navigazione in testa basta, e
                    così l'anatomia è identica agli altri bottoni primari dell'app. */}
                <Navigation size={15} strokeWidth={2} />
                {t.common.navigateLabel}
              </a>
            </article>
          );
        })}
        </div>
      </div>

      {/* "Elenco" bottom sheet — portaled to <body> so it escapes this component's
          own `isolate` stacking context (everything inside it is trapped as a single
          atomic layer below later page-level siblings like the header and the
          "Info e contatti" sheet, regardless of z-index used here — see the "My
          location" comment above). Portaling puts it back at the top level, at the
          same z-40 the "Info e contatti" sheet already uses successfully. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {listOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={BACKDROP_FADE}
                  onClick={() => setListOpen(false)}
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={SHEET}
                  className="fixed inset-x-0 bottom-0 z-40 max-h-[85svh] overflow-y-auto rounded-t-3xl bg-[var(--color-bg)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-5 py-3.5 backdrop-blur-md">
                    <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">{t.common.listLabel}</h2>
                    <button
                      onClick={() => setListOpen(false)}
                      aria-label="Close"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
                    >
                      <X size={18} strokeWidth={2} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-6 px-5 py-6">
                    {groups.map((g) => (
                      <section key={g.kind} className="space-y-2">
                        <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          {g.label}
                        </h3>
                        <div className="rounded-2xl bg-[var(--color-surface)] px-4 lg:px-5">
                          {g.items.map((p, i) => (
                            <button
                              key={p.id}
                              onClick={() => selectPlace(p.id)}
                              className={`flex w-full items-center justify-between gap-3 py-3.5 text-left ${
                                i !== 0 ? "border-t border-[var(--color-border)]" : ""
                              }`}
                            >
                              <span className="min-w-0 truncate font-medium text-[var(--color-text)]">{p.name}</span>
                              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-medium text-[var(--color-text-muted)]">
                                {p.mode === "drive" ? (
                                  <>
                                    <Car size={14} strokeWidth={2} />
                                    {p.km} km {t.common.byCar}
                                  </>
                                ) : (
                                  <>
                                    <Footprints size={14} strokeWidth={2} />
                                    {p.walk} {t.common.minWalk}
                                  </>
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
