# PRODUCT.md — Grand Hotel San Marino · Guida digitale in camera

> Contesto Impeccable. Register: **product** (l'interfaccia serve l'ospite mentre svolge un compito), con **momenti brand** sull'accoglienza (hero "Oggi", intro sezioni).

## Cos'è

PWA "in-camera" che sostituisce il direttorio di carta del Grand Hotel San Marino (4★, 60 camere e suite, GHSM Group dal 1894). L'ospite inquadra un QR in camera e ha sul proprio telefono: servizi, orari live, azioni reali (chiama, naviga, prenota), Concierge AI, e cosa fare a San Marino. Bilingue IT/EN, light/dark, installabile, funziona offline.

## Utenti (persona, in ordine di priorità)

1. **Turista / coppia internazionale** — visita San Marino (centro storico, bici, Tre Torri). Appena arrivato, in esplorazione. Cerca: Wi-Fi, colazione, cosa vedere, come muoversi, check-out. Apre da iPhone.
2. **Ospite benessere / Mességué** — soggiorno lungo, ritorna, età medio-alta, poco tech. Cerca: listino massaggi, palestra, menù dietetici, contatti. Richiede testo grande, navigazione semplice, bottoni "Chiama" evidenti.
3. **Business / MICE** — sale meeting, soggiorno breve, di fretta. Cerca: Wi-Fi subito, check-out, taxi/aeroporto, room service. Premia la velocità.
4. **Ospite eventi** (MotoGP, Rally Legend, Comics) — orientato fuori. Cerca: eventi, mappa, taxi.

**Priorità di layout: bilanciata turista + benessere.** Home pensata per il turista, ma con leggibilità e azioni chiare per l'ospite Mességué meno digitale.

Utente secondario: **staff reception** — l'app riduce le chiamate ripetitive (Wi-Fi, orari).

## Bisogni "primi 30 secondi" (trasversali, vanno in Home)

Wi-Fi · orario colazione · check-out · chiamare reception · canali TV. Oggi sono sepolti: la riscrittura li porta in primo piano come **Risposte rapide**.

## Principio di architettura

Da IA *document-mirror* (capitoli del PDF) a IA **intent-first**: l'ospite pensa per bisogni, non per capitoli. 5 pilastri allineati ai tre del brand (Hotels · Ristorazione · Benessere):
**Oggi · Hotel · Ristorante · Benessere · San Marino** + Concierge AI persistente.

## Brand & tono

- **Colore brand: navy profondo `#0a2444`** (dal badge logo ufficiale). Vincolo cliente: tenere solo i colori del brand. Neutri carta avorio caldi (continuità col direttorio stampato).
- **Voce**: calda, ospitale, essenziale. Mai gergo alberghiero pomposo. Frasi brevi. Diamo del "voi/Lei" (registro hospitality italiano). In EN tono cortese e diretto.
- **Vincolo contenuti**: nessun prezzo, orario o nome inventato. Tutto dalla Hotel Directory ufficiale (44pp). Dove il dato non c'è, si rimanda alla Reception.

## Tono microcopy

- Azioni reali, verbi diretti: "Chiama la Reception", "Apri in Mappe", "Aggiungi al calendario".
- Stati servizio onesti: Aperto / Chiuso · riapre alle / Su richiesta.
- Niente em dash. Niente emoji come icone (Lucide).

## Anti-reference (cosa NON deve essere)

- Un PDF impaginato a schermo / lenzuolata di testo come il cartaceo.
- Card grid identiche icona+titolo+testo ripetute all'infinito.
- App "da hotel generico" col solito blu navy + oro / serif Didone scontati.
- Concierge AI gadget inutile: deve rispondere a domande reali e rimandare alla reception quando non sa.

## Rischio maggiore

Riprodurre la struttura del cartaceo invece di riorganizzare per bisogni. Secondo rischio: leggibilità insufficiente per l'ospite benessere meno tech.

## Stack & vincoli tecnici

Next.js 16.2.9 (App Router, Turbopack), Tailwind v4, Framer Motion, Leaflet, Lucide. SPA client-side, deploy Vercel auto su push `master` (UN SOLO progetto Vercel). PWA iOS standalone. Concierge via `/api/chat` (DeepSeek, env `DEEPSEEK_API_KEY`).
