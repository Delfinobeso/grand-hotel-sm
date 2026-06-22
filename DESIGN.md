# DESIGN.md — Grand Hotel San Marino

> Sistema visivo. Register **product** con momenti brand. Strategia colore: **Committed** sui momenti brand (hero/welcome navy), **Restrained** sul funzionale.

## Colore (OKLCH)

Navy brand `#0a2444` ≈ `oklch(0.24 0.066 258)`. Neutri **caldi** (hue ~80): contrasto caldo/freddo paper+navy come il direttorio stampato. Un solo accento = navy. Mai `#000`/`#fff`.

### Light (default)
```
--color-bg:            oklch(0.972 0.006 83)   /* carta avorio caldo */
--color-surface:       oklch(0.992 0.004 83)   /* card, near-white caldo */
--color-surface-muted: oklch(0.93  0.009 83)   /* fill secondari, chip */
--color-surface-2:     oklch(0.955 0.007 83)   /* sidebar/toolbar layer */
--color-border:        oklch(0.24 0.066 258 / 0.10)
--color-text:          oklch(0.23 0.02  258)   /* near navy-black */
--color-text-secondary:oklch(0.46 0.018 258)
--color-text-muted:    oklch(0.60 0.012 80)
--color-accent:        oklch(0.27 0.068 257)   /* navy brand */
--color-accent-soft:   oklch(0.27 0.068 257 / 0.08)
--color-on-accent:     oklch(0.98 0.005 83)
--color-success:       oklch(0.58 0.12 150)
--color-warning:       oklch(0.72 0.12 75)
--color-danger:        oklch(0.57 0.16 27)
```

### Dark (carbone caldo, non true black)
```
--color-bg:            oklch(0.17 0.005 75)
--color-surface:       oklch(0.215 0.006 75)
--color-surface-muted: oklch(0.27 0.007 75)
--color-surface-2:     oklch(0.195 0.006 75)
--color-border:        oklch(0.95 0 0 / 0.09)
--color-text:          oklch(0.95 0.006 80)
--color-text-secondary:oklch(0.74 0.008 80)
--color-text-muted:    oklch(0.58 0.008 80)
--color-accent:        oklch(0.80 0.072 245)   /* navy non leggibile su scuro → sky soft */
--color-accent-soft:   oklch(0.80 0.072 245 / 0.14)
--color-on-accent:     oklch(0.18 0.01 258)
```

Scena (forza il light di default): *ospite seduto sul bordo del letto alle 9 del mattino, sole dalla finestra, vuole sapere fino a che ora c'è la colazione.* Dark per lettura serale a letto.

## Tipografia — Apple system

Scelta esplicita del cliente: font Apple. Nessun import next/font: stack di sistema (SF Pro su Apple, native ovunque).
```
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
             "Segoe UI", system-ui, Roboto, "Helvetica Neue", Arial, sans-serif;
--font-serif: ui-serif, "New York", Georgia, "Times New Roman", serif;  /* solo wordmark hotel */
```
- Una famiglia (sans) porta titoli, label, body, dati. Serif Apple (New York) **solo** per il nome "Grand Hotel San Marino" nei momenti brand.
- Scala fissa rem (no fluid/clamp), ratio ~1.2. caption .6875 / label .8125 / sm .875 / base 1 / lg 1.125 / xl 1.375 / 2xl 1.75 / 3xl 2.125rem.
- Body prosa 65–75ch. Titoli `tracking-tight`, eyebrow uppercase `tracking-[0.16em]`.

## Spazio & layout

- Mobile-first. Contenuto max-w-5xl/6xl centrato; sidebar desktop 264-288px su `--color-surface-2`.
- Ritmo vario, non padding uniforme. Card solo dove sono il miglior affordance; **mai card annidate**, **mai card grid identiche** (variare dimensione/peso/immagine).
- Safe-area iOS: `env(safe-area-inset-*)`. Bottom nav + FAB rispettano l'inset.
- Border radius: pill (full) per azioni/chip, 2xl (1rem) per card, 3xl per hero/sheet.

## Motion (token)
```
--ease-out:      cubic-bezier(0.25, 1, 0.5, 1)      /* default state */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)      /* entrate */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)  /* micro FAB/check */
--ease-ios:      cubic-bezier(0.2, 0, 0, 1)         /* sheet/menu nativi */
```
Durate 150–250ms (stati), 300–400ms (sheet/accordion). Active state via `background`/opacity, scale solo micro (≤0.98). No bounce decorativo, no animazione di layout-props.

## Componenti & stati

Ogni componente interattivo: default · hover · focus-visible · active · disabled. Skeleton (no spinner) per loading. Empty state che insegna.
- **QuickAnswer**: tile risposta rapida in Home (icona + label + reveal inline / azione).
- **StatusBadge**: live aperto/chiuso/su richiesta (Europe/Rome, refresh 60s).
- **Card / AccordionItem / HoursTable / PriceList / ChipGrid / QuoteBlock**.
- **CallButton / NavigateButton / AddToCalendarButton**: pill, solid (navy) o outline (surface-muted).
- **ImageBanner / CardImage**: bleed, `<picture>` con variante `-sm.webp`.
- Icone: **Lucide** stroke 1.75. Mai emoji nell'UI.

## Divieti (oltre ai ban condivisi Impeccable)

No side-stripe border colorati (>1px). No gradient text. No glassmorphism decorativo (blur solo per scrim/sheet). No hero-metric template. No display font nelle label. No em dash. No emoji-icone.
