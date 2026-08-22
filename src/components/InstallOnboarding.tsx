"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PWAInstallElement } from "@khmyznikov/pwa-install";

/**
 * Invito a installare la PWA ("Aggiungi alla schermata Home") per i tre hotel.
 *
 * STORIA, perche' senza non si capisce niente di questo file:
 * fino al 2026-08-22 questo componente era una guida scritta da noi, 1123 righe,
 * con gli screenshot veri del foglio di condivisione di Safari. Funzionava, ma
 * aveva due limiti che pesavano su un hotel: cinque lingue soltanto, e degli
 * screenshot da rifare a mano su tre repo a ogni versione di iOS che cambia
 * quella schermata. Ora il lavoro lo fa @khmyznikov/pwa-install (MIT, ~28kB
 * compressi, nessuna chiamata di rete esterna): copre una trentina di lingue e
 * la guida iOS la mantiene qualcun altro. La versione precedente resta nella
 * storia di git se dovesse servire tornare indietro.
 *
 * DISEGNO (direzione del 2026-08-22, applicata qui):
 * il foglio non e' piu' a tutta larghezza appoggiato al bordo inferiore, ma una
 * CARTA FLOTTANTE: 12px di margine a sinistra, a destra e sotto (piu' la
 * safe-area), 28px di raggio su tutti e quattro gli angoli, ombra doppia e uno
 * scrim scuro dietro che la stacca dalle foto dell'hotel. La gerarchia dei testi
 * e' a tre voci di sistema (nome 20/600, beneficio 15/400, footnote 13/400):
 * prima il beneficio era a 12px, piu' piccolo di una didascalia, ed era il
 * difetto piu' grave. Il colore del marchio entra in DUE posti soltanto, il
 * pulsante e le icone della guida; la x e' diventata neutra perche' faceva un
 * terzo punto di colore che competeva col pulsante.
 *
 * DIFETTI DELLA LIBRERIA che questo file esiste per aggirare. Sono tutti
 * misurati sul telefono o in un browser vero, non dedotti: chi tocca questo file
 * non li riscopra da capo.
 *
 * 1. LA CHIUSURA NON CHIUDE. Con questa configurazione (manual-apple + apertura
 *    forzata) ne' il tocco sulla x ne' hideDialog() chiudono il dialogo: resta a
 *    schermo, alto 232px. Percio' l'elemento nasce dentro un <div> nascosto e la
 *    visibilita' la governiamo NOI. Un invito che non si toglie di mezzo e'
 *    molto peggio di un invito brutto.
 * 2. LE ICONE SI COLORANO CON fill, NON con color: i suoi svg hanno un fill
 *    proprio, quindi impostare solo il colore del testo non cambia niente.
 * 3. LA x HA opacity 0.5 DI SUO: va forzata a 1 o sembra grigia.
 * 4. SEGUE prefers-color-scheme e ha una variante scura tutta sua. I siti degli
 *    hotel hanno invece un tema loro, scritto in <html data-theme>: col telefono
 *    in modo scuro compariva un dialogo scuro su pagina chiara (e col toggle
 *    luna del sito, il contrario). Qui il foglio segue il SITO, non il telefono.
 * 5. I SELETTORI CSS DA SOLI NON REGGONO. Le regole vanno in un foglio ADOTTATO
 *    (un <style> figlio la libreria se lo porta via al primo ri-disegno) E i
 *    valori critici vanno riscritti anche inline sull'elemento.
 * 6. C'E' UNA FINESTRA fra il suo disegno e i nostri stili: chiusa con un
 *    MutationObserver attaccato subito piu' i ripassi a 50, 150, 400, 900, 1800
 *    e 3000 ms. Togliendo quei ripassi il difetto torna.
 * 7. LE SUE PAROLE NON SONO QUELLE DEL TELEFONO: in italiano dice "Aggiungi
 *    alla schermata principale" (sul pulsante E nel terzo passo della guida)
 *    mentre iOS dice "Aggiungi alla schermata Home". Le riscriviamo a DOM, ma
 *    solo in italiano: e' l'unica lingua in cui sappiamo con certezza cosa dice
 *    davvero il telefono (vedi CORREZIONI).
 * 8. IL SUO PULSANTE E' UNA GRIGLIA CON line-height PARI ALL'ALTEZZA (50px):
 *    e' cosi' che tiene la scritta in mezzo. Appena si porta il line-height a
 *    22 — e va portato, o in tedesco la riga lunga non ci sta — il contenuto
 *    resta appoggiato in alto e il centro dell'etichetta finisce a 11,8 su una
 *    capsula da 50. Qui il pulsante diventa una riga flex centrata nei due
 *    assi. Misurato sui pixel il 22/08, su tutti e tre gli hotel.
 * 9. <use> SI PORTA DIETRO LO STILE INLINE DELL'ORIGINALE. Il [+] del pulsante
 *    non e' un disegno suo: e' <use href="#pwa-add">, cioe' un clone dell'icona
 *    della guida che sta piu' in basso. Colorare l'originale (foglio o inline)
 *    colora anche il clone, e il clone finisce SUL FONDO DEL MARCHIO: sulle
 *    Suites erano 1705 pixel di #ed3427 su #e72113, un fantasma a 1,05:1.
 *    Percio' gli svg che qualche <use> clona non si colorano mai addosso: il
 *    colore arriva per eredita' dal contenitore (.svg-wrap nella guida, l'svg
 *    bianco dentro il pulsante), che e' anche il modo della libreria stessa.
 *
 * COMPORTAMENTO (deciso da Aziz il 2026-08-22, e NON si tocca):
 *  - si apre DA SOLA al primo avvio, su iPhone come su Android;
 *  - se non e' stata installata, si ripropone IL GIORNO DOPO, al massimo tre
 *    volte in tutto. Insistere all'infinito con un ospite che ha gia' detto no
 *    due volte non fa installare l'app, fa chiudere la pagina;
 *  - non compare MAI dentro l'app gia' installata;
 *  - resta sempre raggiungibile dal link nel footer (evento
 *    `blasat:show-onboarding`), e quella apertura non consuma i tre tentativi.
 *
 * ⚠️ LIMITE VERO SU IPHONE, da sapere prima di stupirsi dei numeri: l'app
 * installata sulla schermata Home ha un archivio dati SEPARATO da Safari. Chi
 * installa e poi apre l'icona e' un'altra "sessione" per il browser, che quindi
 * NON puo' sapere che l'installazione e' avvenuta e riproporra' l'invito il
 * giorno dopo. Su Android invece `getInstalledRelatedApps` funziona e il
 * problema non si pone. E' il motivo del tetto a tre.
 */

const CHIAVE = "blasat-install-v2";
// Chiave della versione precedente: chi aveva gia' chiuso la vecchia guida non
// deve ritrovarsela in faccia come se fosse la prima volta.
const CHIAVE_LEGACY = "blasat-onboarding-dismissed-v1";
const GIORNO_MS = 24 * 60 * 60 * 1000;
const MAX_INVITI = 3;
// Un attimo dopo il primo disegno: aprirla mentre la pagina si sta ancora
// componendo la fa sembrare un errore, non un invito.
const RITARDO_MS = 1200;

type Lingua = "it" | "en" | "fr" | "de" | "es";

/**
 * Lingua dell'interfaccia: quella del DISPOSITIVO, e se non e' fra quelle che
 * parliamo si ripiega sull'INGLESE — mai sull'italiano (regola di Aziz del
 * 2026-08-22). Un ospite tedesco o giapponese in un hotel di San Marino l'inglese
 * lo legge quasi sempre; l'italiano no.
 */
function linguaDispositivo(): Lingua {
  if (typeof navigator === "undefined") return "en";
  const candidate = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || ""];
  for (const raw of candidate) {
    const due = raw.slice(0, 2).toLowerCase();
    if (
      due === "it" ||
      due === "en" ||
      due === "fr" ||
      due === "de" ||
      due === "es"
    )
      return due;
  }
  return "en";
}

// Solo le due righe che scriviamo NOI (la libreria traduce le sue da sola).
/**
 * Le due righe che scriviamo noi. Il copy e' stato rifatto il 22/08 perche' le
 * prime dicevano due volte la stessa cosa ("si apre come un'app" sopra, "si apre
 * a tutto schermo" sotto) e ripetevano il nome dell'hotel che e' gia' scritto
 * grande due centimetri piu' su. Adesso la prima riga dice cosa ci GUADAGNA
 * l'ospite, la seconda toglie l'unica obiezione vera ("mi occupa spazio?").
 * Il nome dell'hotel non compare piu' nel testo: lo mette gia' la libreria come
 * titolo, e ripeterlo mangiava la riga senza aggiungere niente.
 * Nel disegno nuovo la prima diventa il beneficio (15px) e la seconda la
 * footnote (13px): la gerarchia fa il lavoro, le parole restano queste.
 */
const TESTI: Record<Lingua, { descrizione: () => string; invito: string }> = {
  it: {
    descrizione: () =>
      "Orari, servizi e concierge a portata di pollice, anche senza rete.",
    invito: "Non si scarica niente: resta un'icona sulla schermata Home.",
  },
  en: {
    descrizione: () =>
      "Opening hours, services and concierge at your fingertips, even offline.",
    invito: "Nothing to download: it stays as an icon on your Home Screen.",
  },
  fr: {
    descrizione: () =>
      "Horaires, services et conciergerie à portée de main, même hors ligne.",
    invito: "Rien à télécharger : une simple icône sur votre écran d'accueil.",
  },
  de: {
    descrizione: () =>
      "Öffnungszeiten, Services und Concierge griffbereit, auch offline.",
    invito: "Nichts herunterzuladen: nur ein Symbol auf dem Home-Bildschirm.",
  },
  es: {
    descrizione: () =>
      "Horarios, servicios y conserjería a mano, incluso sin conexión.",
    invito:
      "No se descarga nada: queda como un icono en la pantalla de inicio.",
  },
};

/**
 * LE PAROLE DELLA LIBRERIA CHE NON SONO QUELLE DEL TELEFONO (difetto 7).
 * In italiano la libreria dice "Aggiungi alla schermata principale"; iOS dice
 * "Aggiungi alla schermata Home". In una guida che serve a dire *quello che
 * vedrai fra due secondi*, una parola diversa fa esitare. La stessa stringa
 * compare in due punti — l'etichetta del pulsante e il terzo passo della guida
 * — e vanno corretti insieme, altrimenti il pulsante dice una cosa e il passo
 * un'altra: e' l'inconveniente che si vede a schermo, non in teoria.
 * SOLO L'ITALIANO. In inglese la libreria dice gia' "Add to Home Screen", che
 * e' la dicitura di sistema. Per francese, tedesco e spagnolo la dicitura di
 * iOS 26 non l'abbiamo potuta LEGGERE su un telefono in quella lingua:
 * indovinarla su un'app di un cliente vero e' peggio che lasciare la traduzione
 * della libreria, che almeno e' coerente con se stessa. Chi avra' davanti un
 * iPhone in francese aggiunga la riga qui, non a memoria.
 */
const CORREZIONI: Partial<Record<Lingua, Array<[string, string]>>> = {
  it: [["Aggiungi alla schermata principale", "Aggiungi alla schermata Home"]],
};

/**
 * I due temi del foglio. Non sono i colori del sito: sono i grigi di sistema,
 * perche' il foglio deve sembrare una cosa del telefono, non una cosa del sito
 * (per la stessa ragione qui non entra il serif dei titoli di pagina).
 * Il colore del marchio arriva solo da `accent` e `accentButton`.
 */
const TEMI = {
  chiaro: {
    cartaOpaca: "#ffffff",
    cartaVetro: "rgba(255, 255, 255, 0.72)",
    bordoVetro: "rgba(255, 255, 255, 0.55)",
    bordoOpaco: "rgba(10, 36, 68, 0.08)",
    anelloIcona: "rgba(0, 0, 0, 0.06)",
    titolo: "#1b2430",
    beneficio: "#46536a",
    // 4,93:1 sul vetro chiaro misurato (#e9e9e9). Il #6b7688 di prima stava
    // a 3,78: passa su bianco pieno (4,59) ma non sul vetro, che e' quello
    // che l'ospite vede davvero.
    footnote: "#5a6474",
    hairline: "rgba(10, 36, 68, 0.12)",
    xFondo: "rgba(10, 36, 68, 0.08)",
    xGlifo: "#46536a",
    ombra:
      "0 24px 60px rgba(10, 20, 35, 0.28), 0 2px 8px rgba(10, 20, 35, 0.08)",
  },
  scuro: {
    cartaOpaca: "#1f2125",
    cartaVetro: "rgba(30, 32, 36, 0.72)",
    bordoVetro: "rgba(255, 255, 255, 0.12)",
    bordoOpaco: "rgba(255, 255, 255, 0.10)",
    anelloIcona: "rgba(255, 255, 255, 0.10)",
    titolo: "#f2f3f6",
    beneficio: "#a8b0bd",
    footnote: "#8b93a1",
    hairline: "rgba(255, 255, 255, 0.14)",
    xFondo: "rgba(255, 255, 255, 0.12)",
    xGlifo: "#a8b0bd",
    // Sul fondo scuro l'ombra chiara della variante chiara non si vede: la carta
    // resterebbe incollata alla pagina. Stessa forma, piu' densa.
    ombra: "0 24px 60px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35)",
  },
};
type Tema = (typeof TEMI)["chiaro"];

// Lo scrim e' lo stesso nei due temi: serve a staccare la carta dalle foto, e le
// foto sono le stesse di giorno e di notte.
const SCRIM = "rgba(12, 18, 26, 0.30)";
// Sotto il dialogo della libreria (z-index 2147483001) e sopra qualunque cosa
// del sito, dock flottante compresa.
const Z_SCRIM = 2147483000;

/**
 * Il tema lo decide il SITO, non il telefono (difetto 4). Tutti e tre gli hotel
 * scrivono `data-theme="dark"` su <html> quando l'ospite tocca la luna, e
 * lasciano l'attributo assente quando e' chiaro.
 */
function temaSito(): Tema {
  if (typeof document === "undefined") return TEMI.chiaro;
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? TEMI.scuro
    : TEMI.chiaro;
}

function motoRidotto(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Vero solo sui telefoni. Su iPad e Mac la libreria mette il foglio in alto a
 *  destra ed e' giusto cosi': la carta inset e' un disegno da telefono. */
function schermoStretto(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(max-width: 666px)").matches;
}

interface Stato {
  volte: number;
  ultimo: number;
}

/**
 * Gia' dentro l'app installata? Allora l'invito non ha senso, ne' da solo ne'
 * dal link nel footer. Aziz l'ha visto comparire proprio li' (22/08).
 * Non ci fidiamo solo di `isUnderStandaloneMode` della libreria: leggiamo noi
 * le due bandiere, quella standard e quella di Safari, che e' l'unica che
 * risponde davvero su iPhone.
 */
function dentroApp(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function leggiStato(): Stato {
  try {
    const raw = localStorage.getItem(CHIAVE);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Stato>;
      return { volte: Number(s.volte) || 0, ultimo: Number(s.ultimo) || 0 };
    }
    // Migrazione dalla guida precedente: chi l'aveva chiusa conta come un invito
    // gia' speso, con l'orologio che parte da adesso (non sappiamo quando fu).
    if (localStorage.getItem(CHIAVE_LEGACY) === "1")
      return { volte: 1, ultimo: Date.now() };
  } catch {
    // Safari in navigazione privata puo' negare localStorage. In dubbio NON
    // insistiamo: un invito che ricompare a ogni apertura e' peggio del non
    // averlo. Il link nel footer resta comunque.
  }
  return { volte: 0, ultimo: 0 };
}

function scriviStato(s: Stato) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(s));
  } catch {
    /* vedi sopra: senza storage si perde solo la memoria, non la funzione */
  }
}

/**
 * I fotogrammi dell'entrata e dell'uscita. Stanno FUORI dalla stringa delle
 * regole per un motivo preciso: quella stringa passa da un replace che appiccica
 * !important a ogni dichiarazione, e dentro un @keyframes le dichiarazioni
 * !important sono ignorate per specifica — l'animazione non partirebbe.
 */
const FOTOGRAMMI = `
  @keyframes blasat-carta-entra {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes blasat-carta-esce {
    from { transform: translateY(0);    opacity: 1; }
    to   { transform: translateY(12px); opacity: 0; }
  }
  @keyframes blasat-carta-entra-piano { from { opacity: 0; } to { opacity: 1; } }
  @keyframes blasat-carta-esce-piano  { from { opacity: 1; } to { opacity: 0; } }
`;

const ENTRATA = "blasat-carta-entra 380ms cubic-bezier(0.32, 0.72, 0, 1) both";
const ENTRATA_PIANO = "blasat-carta-entra-piano 150ms ease-out both";
const USCITA = "blasat-carta-esce 200ms ease-in both";
const USCITA_PIANO = "blasat-carta-esce-piano 150ms ease-in both";

/** Aggiunge un foglio ADOTTATO a uno shadow root, una volta sola per marchio.
 *  Adottato e non <style> figlio: un nodo <style> la libreria se lo porta via al
 *  primo ri-disegno, un foglio adottato non e' un nodo del DOM e sopravvive. */
function adotta(sr: ShadowRoot, css: string, marchio: string) {
  type Marcato = CSSStyleSheet & { blasat?: string };
  try {
    const gia = (sr.adoptedStyleSheets || []).find(
      (f) => (f as Marcato).blasat === marchio,
    );
    if (gia) {
      // Il tema o il colore possono essere cambiati sotto i piedi (toggle luna):
      // si riscrive lo stesso foglio invece di accodarne un altro.
      (gia as CSSStyleSheet).replaceSync(css);
      return;
    }
    const foglio = new CSSStyleSheet() as Marcato;
    foglio.replaceSync(css);
    foglio.blasat = marchio;
    sr.adoptedStyleSheets = [...(sr.adoptedStyleSheets || []), foglio];
  } catch {
    // Safari molto vecchi non hanno i fogli costruibili: si ricade sul nodo
    // <style>, che e' meglio di niente anche se la libreria puo' toglierlo.
    const gia = sr.querySelector(`style[data-blasat="${marchio}"]`);
    if (gia) {
      gia.textContent = css;
      return;
    }
    const st = document.createElement("style");
    st.setAttribute("data-blasat", marchio);
    st.textContent = css;
    sr.appendChild(st);
  }
}

/**
 * `accent` e' il colore del marchio dell'hotel, preso dalla sua icona vera.
 * `accentButton` e' lo stesso colore appena piu' scuro, e serve SOLO al pulsante:
 * col testo bianco sopra, il verde del Titano stava a 3,89:1 e il corallo delle
 * Suites a 4,10:1, sotto la soglia di 4,5 per il testo normale. Bastano 3-5% di
 * luminosita' in meno per passare (4,62 e 4,54) restando sulla stessa tinta.
 * `accent` resta il colore pieno e va solo sulle icone della guida, che sono
 * elementi grafici: soglia 3:1, la passano entrambi.
 * ⚠️ Il marchio entra in questi DUE posti e basta. Non nella x (era li' fino al
 * 22/08 e faceva un terzo punto di colore che competeva col pulsante), non nel
 * fondo, non nei testi, non nell'ombra.
 */
export default function InstallOnboarding({
  appName,
  accent = "#1b2430",
  accentButton = "#1b2430",
}: {
  appName: string;
  accent?: string;
  accentButton?: string;
}) {
  const ref = useRef<PWAInstallElement | null>(null);
  // Contenitore che decide la visibilita'. Non si usa lo `style` sul custom
  // element perche' i suoi tipi JSX pretendono un CSSStyleDeclaration intero.
  const guscio = useRef<HTMLDivElement | null>(null);
  const scrim = useRef<HTMLDivElement | null>(null);
  // `null` finche' non sappiamo la lingua, e finche' e' null NON montiamo
  // l'elemento. Non e' pignoleria: la libreria legge `description` una volta
  // sola quando l'elemento entra nel DOM, quindi montarlo con un valore
  // provvisorio lo congela li'. Misurato: su un telefono italiano restava la
  // descrizione inglese mentre il resto del dialogo era gia' in italiano.
  const [lingua, setLingua] = useState<Lingua | null>(null);
  const pronta = useRef(false);
  // L'entrata deve scattare UNA volta per apertura. Senza questa bandiera
  // ripartirebbe a ogni ripasso (50-3000ms) e a ogni colpo dell'osservatore: la
  // carta rimbalzerebbe sei volte di fila.
  const animato = useRef(false);
  // Vero solo durante i 200ms dell'uscita: impedisce ai ripassi di riaccendere
  // lo scrim proprio mentre sta sparendo.
  const chiudendo = useRef(false);

  const applicaStile = useCallback(
    (el: PWAInstallElement) => {
      const sr = el.shadowRoot;
      if (!sr) return;
      const t = temaSito();
      const carta = t.cartaOpaca;

      // Le variabili della libreria, riscritte per stare coerenti col sito.
      // Non serve piu' ripeterle dentro la sua @media(prefers-color-scheme:dark):
      // ogni dichiarazione qui esce con !important e vince comunque, e il tema
      // giusto lo decide temaSito() sopra.
      const regole = `
      #pwa-install-element .install-dialog,
      #pwa-install-element .install-dialog.apple,
      #pwa-install-element .install-dialog.chrome {
        --background-color: ${carta};
        --text-color-normal: ${t.titolo};
        --text-color-primary: ${t.titolo};
        --text-color-secondary: ${t.beneficio};
        --text-color-description: ${t.beneficio};
        --border-bottom-color: ${t.hairline};
        --touch-header-color: ${t.hairline};
        --background-color-button: ${accentButton};
        --background-color-button-active: ${accentButton};
        --text-color-button: #ffffff;
        --icon-how-to-color: ${accent};
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      /* LA CARTA. Fino al 22/08 era un foglio a tutta larghezza incollato al
         bordo inferiore, con 10px di raggio solo sopra e nessuna ombra: la
         forma di una barra dei cookie, non di un foglio di sistema. */
      #pwa-install-element .install-dialog.apple.apple-mobile {
        border-radius: 28px;
        padding: 20px;
        box-sizing: border-box;
        grid-template-columns: 56px 1fr;
        column-gap: 14px;
        row-gap: 0;
        border: 1px solid ${t.bordoOpaco};
        box-shadow: ${t.ombra};
        /* La libreria mette una drop-shadow nera in un filter: filter crea un
           contesto e sporca il vetro. L'ombra la facciamo con box-shadow. */
        filter: none;
      }
      /* Solo sui telefoni: su iPad e Mac il foglio sta in alto a destra ed e'
         giusto cosi', una carta larga quanto lo schermo li' sarebbe un cartello. */
      @media (max-width: 666px) {
        #pwa-install-element .install-dialog.apple.apple-mobile {
          left: 12px;
          right: 12px;
          top: auto;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
          width: auto;
          max-width: none;
          margin: 0;
          max-height: calc(100vh - 96px);
        }
      }

      /* Header: icona 56 (22,37% di raggio, la proporzione delle icone iOS),
         14px fino al testo, niente righe di separazione — le righe tornano solo
         nella vista guida, dove servono davvero a dividere dei passi. */
      #pwa-install-element .install-dialog.apple.apple-mobile .icon {
        border-bottom: none;
        align-items: flex-start;
        justify-content: flex-start;
        margin: 0;
        padding: 0;
        width: 56px;
        height: 56px;
      }
      #pwa-install-element .install-dialog.apple.apple-mobile .icon .icon-image {
        width: 56px;
        height: 56px;
        border-radius: 12.5px;
        margin: 0;
        box-shadow: 0 0 0 1px ${t.anelloIcona};
        filter: none;
      }
      #pwa-install-element .install-dialog.apple.apple-mobile .about {
        display: flex;
        flex-direction: column;
        gap: 3px;
        border-bottom: none;
        margin: 0;
        padding: 0;
        min-width: 0;
      }
      /* Nome 20/25 semibold: prima era 18/22, un passo sotto la voce di
         headline del sistema. */
      #pwa-install-element .install-dialog.apple.apple-mobile .about .name {
        font-size: 20px;
        line-height: 25px;
        font-weight: 600;
        color: ${t.titolo};
        display: block;
        padding: 0;
        margin: 0;
        overflow: hidden;
      }
      /* Spazio per la x, che sta nello stesso riquadro della griglia. */
      #pwa-install-element .install-dialog.apple.apple-mobile .about .name {
        padding-inline-end: 40px;
      }
      /* Il beneficio: era a 12px, piu' piccolo di una didascalia, ed e' la riga
         che deve convincere. 15/20 e' la misura di sistema per il corpo. */
      #pwa-install-element .install-dialog.apple.apple-mobile .about .description {
        font-size: 15px;
        line-height: 20px;
        font-weight: 400;
        color: ${t.beneficio};
        margin: 0;
        padding: 0;
        overflow: visible;
      }
      /* La footnote: prima era a tutta larghezza e slegata dal resto, adesso sta
         dentro il padding della carta. */
      #pwa-install-element .install-dialog.apple.apple-mobile .welcome-to-install {
        font-size: 13px;
        line-height: 18px;
        font-weight: 400;
        color: ${t.footnote};
        padding: 14px 0 0 0;
        margin: 0;
        border-bottom: none;
        width: auto;
      }

      /* Il pulsante: capsula piena, ed e' l'UNICO punto di colore del marchio.
         L'etichetta va semibold: a 17/400 non sembrava un pulsante di sistema. */
      #pwa-install-element .install-dialog.apple .action-buttons {
        margin: 18px 0 0 0;
        padding: 0;
        border-radius: 25px;
        overflow: hidden;
      }
      #pwa-install-element .install-dialog.apple .action-buttons .dialog-button,
      #pwa-install-element .install-dialog.apple .dialog-button.button.install {
        border-radius: 25px;
        height: 50px;
        min-height: 50px;
        line-height: 22px;
        font-size: 17px;
        font-weight: 600;
        padding: 0 12px;
        color: #ffffff;
        background-color: ${accentButton};
        transition: filter 120ms ease-out;
        /* IL CONTENUTO AL CENTRO, non appoggiato al bordo di sopra. Il pulsante
           della libreria e' una griglia con line-height 50 (l'altezza intera):
           appena si porta il line-height a 22 per far stare due righe in
           tedesco, la riga di testo resta incollata in alto e il centro
           dell'etichetta finisce a 11,8 invece che a 25 su una capsula da 50.
           Misurato sui pixel, uguale su tutti e tre gli hotel. Qui la griglia
           diventa una riga flex centrata nei due assi. */
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #pwa-install-element .install-dialog.apple .action-buttons .button-text {
        justify-content: center;
        /* 15px di stacco fra il [+] e la scritta erano la differenza fra una
           riga intera e una riga tagliata: in tedesco "Hinzufugen zum
           Startbildschirm" a 17px semibold finiva con i puntini. Misurato, non
           supposto: con 10 di stacco e 12 di margine la riga ci sta. */
        gap: 10px;
      }
      /* Premuto: la libreria cambia colore di fondo, che con un colore di marca
         diventa una seconda tinta inventata. Meglio scurire quello che c'e'. */
      #pwa-install-element .install-dialog.apple .dialog-button.button:active {
        background-color: ${accentButton};
        filter: brightness(0.92);
      }

      /* LA x DIVENTA NEUTRA. Cerchio da 30 dentro un bersaglio da 44: il cerchio
         e' disegnato con un gradiente radiale proprio per tenere le due misure
         separate — 30 e' quanto si vede, 44 e' quanto si tocca, ed e' il minimo
         tattile per l'unico modo che ha l'ospite di dire no.
         I margini negativi la portano a 16px dai bordi della carta partendo dal
         riquadro della griglia, che sta a 20px. */
      #pwa-install-element .install-dialog.apple.apple-mobile .close {
        width: 44px;
        min-width: 44px;
        height: 44px;
        margin-top: -11px;
        margin-inline-end: -11px;
        margin-inline-start: auto;
        padding: 0;
        border: none;
        border-radius: 50%;
        opacity: 1;
        background-color: transparent;
        background-image: radial-gradient(circle at 50% 50%, ${t.xFondo} 0 15px, transparent 15px);
        color: ${t.xGlifo};
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #pwa-install-element .install-dialog.apple.apple-mobile .close svg {
        width: 18px;
        height: 18px;
        color: ${t.xGlifo};
        fill: ${t.xGlifo};
      }

      /* LE ICONE SI COLORANO CON fill, NON con color (difetto 2): i suoi svg
         hanno un fill proprio, quindi impostare il colore del testo non basta.
         ECCEZIONE, ed e' il difetto 9: gli svg che <use> clona altrove
         (#pwa-add, #arrow-left) NON si colorano sull'originale, o il clone si
         porta quel colore dentro il pulsante. Il loro colore arriva per
         EREDITA' dal contenitore, che e' anche il modo in cui lo fa la
         libreria stessa (.svg-wrap ha fill, i suoi svg non ce l'hanno). */
      #pwa-install-element .install-dialog svg:not(#pwa-add):not(#arrow-left) {
        color: ${accent};
        fill: ${accent};
      }
      #pwa-install-element .install-dialog .svg-wrap {
        color: ${accent};
        fill: ${accent};
      }
      /* Dentro il pulsante l'icona sta col testo, cioe' bianca: il colore del
         marchio sul fondo del marchio sarebbe invisibile. Il [+] del pulsante e'
         un <use href="#pwa-add">: bianco lo eredita da qui, perche' l'originale
         non ha piu' un colore scritto addosso. */
      #pwa-install-element .install-dialog button:not(.close) svg {
        color: #ffffff;
        fill: #ffffff;
      }

      /* LA VISTA GUIDA (dopo il tocco sul pulsante): eredita carta, raggi e
         padding. Qui — e solo qui — tornano le righe di separazione, perche'
         separano davvero dei passi. */
      #pwa-install-element .install-dialog.apple.apple-mobile.how-to .icon,
      #pwa-install-element .install-dialog.apple.apple-mobile.how-to .about {
        border-bottom: 1px solid ${t.hairline};
        padding-bottom: 14px;
      }
      #pwa-install-element .install-dialog.apple.apple-mobile.how-to .welcome-to-install {
        border-bottom: 1px solid ${t.hairline};
        padding: 14px 0;
      }
      #pwa-install-element .install-dialog.apple.apple-mobile .how-to-description {
        padding: 16px 0 0 0;
        gap: 12px;
      }
      #pwa-install-element .install-dialog.apple.apple-mobile .how-to-description .step-text {
        font-size: 15px;
        line-height: 20px;
        font-weight: 500;
        color: ${t.titolo};
      }

      /* IL VETRO, e solo dove la sfocatura c'e' davvero. Dove @supports non passa
         (browser vecchi, o motori che dichiarano di non saper sfocare) resta il
         fondo pieno di sopra: illeggibile mai. */
      @supports ((backdrop-filter: blur(28px)) or (-webkit-backdrop-filter: blur(28px))) {
        #pwa-install-element .install-dialog,
        #pwa-install-element .install-dialog.apple {
          --background-color: ${t.cartaVetro};
          background-color: ${t.cartaVetro};
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
        }
        #pwa-install-element .install-dialog.apple.apple-mobile {
          border-color: ${t.bordoVetro};
        }
      }
    `;

      adotta(sr, regole.replace(/;/g, " !important;") + FOTOGRAMMI, "foglio");

      // VALORI CRITICI ANCHE INLINE (difetto 5). Il foglio adottato basta in un
      // browser simulato; su iPhone vero no — Aziz ha mandato due schermate a
      // distanza di un'ora col dialogo ancora traslucido, e il raggio del
      // pulsante rendeva 0px NONOSTANTE la regola. Qui i valori si scrivono dove
      // nessuna cascata della libreria li puo' scavalcare.
      const dialogo = sr.querySelector(
        ".install-dialog.apple",
      ) as HTMLElement | null;
      const visibileOra =
        !!guscio.current && guscio.current.style.display !== "none";
      if (dialogo) {
        // Stessa scelta del blocco @supports, ma decisa qui a runtime perche' una
        // dichiarazione inline non puo' stare dentro @supports.
        const saSfocare =
          typeof CSS !== "undefined" &&
          typeof CSS.supports === "function" &&
          (CSS.supports("backdrop-filter", "blur(28px)") ||
            CSS.supports("-webkit-backdrop-filter", "blur(28px)"));
        const fondo = saSfocare ? t.cartaVetro : t.cartaOpaca;
        const p = (k: string, v: string) =>
          dialogo.style.setProperty(k, v, "important");
        p("background-color", fondo);
        p("opacity", "1");
        p("border-radius", "28px");
        p("border", `1px solid ${saSfocare ? t.bordoVetro : t.bordoOpaco}`);
        p("box-shadow", t.ombra);
        p("filter", "none");
        p("padding", "20px");
        p("box-sizing", "border-box");
        if (saSfocare) {
          p("backdrop-filter", "blur(28px) saturate(180%)");
          p("-webkit-backdrop-filter", "blur(28px) saturate(180%)");
        }
        // La carta inset solo sul telefono: su iPad e Mac la libreria la mette in
        // alto a destra e scriverle left/right inline la stenderebbe da bordo a
        // bordo.
        if (schermoStretto()) {
          p("left", "12px");
          p("right", "12px");
          p("top", "auto");
          p("bottom", "calc(env(safe-area-inset-bottom, 0px) + 12px)");
          p("width", "auto");
          p("max-width", "none");
          p("margin", "0");
        }

        // L'ENTRATA, una volta sola per apertura (difetto 6: applicaStile viene
        // richiamata dai sei ripassi e dall'osservatore). Solo a guscio gia'
        // visibile, altrimenti l'animazione si consuma mentre e' nascosto.
        if (visibileOra && !animato.current && !chiudendo.current) {
          animato.current = true;
          p("animation", motoRidotto() ? ENTRATA_PIANO : ENTRATA);
        }
      }
      const contenitore = sr.querySelector("aside") as HTMLElement | null;
      if (contenitore)
        contenitore.style.setProperty("opacity", "1", "important");

      // LO SCRIM LO GOVERNA QUESTA FUNZIONE, non il momento dell'apertura, e la
      // prova che serviva farlo cosi' e' misurata: prima lo si accendeva dentro
      // `mostra` guardando `el.isAppleMobilePlatform`, che pero' la libreria
      // riempie in una promessa (aspetta getInstalledRelatedApps). Su un
      // caricamento freddo quella promessa non era ancora arrivata quando
      // scadeva il nostro ritardo di 1200ms: la bandiera diceva "non e' Apple",
      // lo scrim restava a zero e la carta tornava a galleggiare sul collage di
      // foto — cioe' proprio il difetto che lo scrim esiste per togliere.
      // Qui la domanda e' un'altra e ha risposta immediata: c'e' la carta Apple
      // disegnata? Se la libreria cambia idea dopo, ridisegna, e l'osservatore
      // ci riporta qui. Su Android (scheda trascinabile, un'altra grammatica)
      // lo scrim resta spento e non intercetta i tocchi.
      if (scrim.current && !chiudendo.current) {
        const cartaAVista = !!dialogo && visibileOra;
        scrim.current.style.pointerEvents = cartaAVista ? "auto" : "none";
        if (cartaAVista) scrim.current.style.opacity = "1";
      }

      // Le icone: stessa storia, i selettori da soli non bastano sempre. Tre
      // casi: dentro il pulsante bianche, la x neutra, tutte le altre del marchio.
      // Gli id che qualche <use> clona altrove: su questi NON si scrive niente
      // inline (difetto 9), perche' lo stile inline dell'originale il clone se
      // lo porta dietro e vince sull'eredita' del posto dove finisce.
      const clonati = new Set<string>();
      sr.querySelectorAll("use").forEach((u) => {
        const href =
          u.getAttribute("href") || u.getAttribute("xlink:href") || "";
        if (href.startsWith("#")) clonati.add(href.slice(1));
      });
      sr.querySelectorAll("svg").forEach((sv) => {
        if (sv.id && clonati.has(sv.id)) {
          sv.style.removeProperty("fill");
          sv.style.removeProperty("color");
          // Il colore lo prende il contenitore, e da li' scende per eredita'
          // solo sull'originale: il clone nel pulsante eredita invece il bianco
          // dell'svg che lo ospita.
          const nido = sv.parentElement as HTMLElement | null;
          if (nido) {
            nido.style.setProperty("fill", accent, "important");
            nido.style.setProperty("color", accent, "important");
          }
          return;
        }
        const colore = sv.closest("button:not(.close)")
          ? "#ffffff"
          : sv.closest(".close")
            ? t.xGlifo
            : accent;
        (sv as SVGElement).style.setProperty("fill", colore, "important");
        (sv as SVGElement).style.setProperty("color", colore, "important");
      });

      const chiudi = sr.querySelector(".close") as HTMLElement | null;
      if (chiudi) {
        // LA CHIUSURA LA FACCIAMO NOI (difetto 1): ne' il tocco sulla x ne'
        // hideDialog() chiudono davvero il dialogo, quindi nascondiamo il nostro
        // guscio. La funzione vera sta in `chiudiFoglio`, appesa qui una volta.
        if (!chiudi.dataset.blasatChiusura) {
          chiudi.dataset.blasatChiusura = "1";
          chiudi.addEventListener("click", () => chiudiRif.current());
        }
        const p = (k: string, v: string) =>
          chiudi.style.setProperty(k, v, "important");
        p("opacity", "1");
        p("color", t.xGlifo);
        p("min-width", "44px");
        p("min-height", "44px");
        p("width", "44px");
        p("height", "44px");
        p("margin-top", "-11px");
        p("margin-inline-end", "-11px");
        p("margin-inline-start", "auto");
        p("padding", "0");
        p("border", "none");
        p("background-color", "transparent");
        p(
          "background-image",
          `radial-gradient(circle at 50% 50%, ${t.xFondo} 0 15px, transparent 15px)`,
        );
        p("display", "flex");
        p("align-items", "center");
        p("justify-content", "center");
      }

      // LE PAROLE DEL TELEFONO (difetto 7). Si riscrive solo se e' diverso,
      // altrimenti l'osservatore rincorrerebbe se stesso all'infinito.
      const correzioni = CORREZIONI[linguaDispositivo()];
      if (correzioni) {
        sr.querySelectorAll(
          ".dialog-button.button.install .button-text > span, .description-step .step-text",
        ).forEach((n) => {
          const prima = n.textContent || "";
          let dopo = prima;
          for (const [a, b] of correzioni) dopo = dopo.split(a).join(b);
          if (dopo !== prima) n.textContent = dopo;
        });
      }

      // ANDROID. La sua e' un'altra scheda (pwa-bottom-sheet) con un altro shadow
      // root, un altro DOM e una fisica di trascinamento tutta sua: qui le
      // passiamo solo i colori — tema del sito invece di prefers-color-scheme
      // (difetto 4) e pulsante del marchio al posto dell'indaco di serie. La
      // grammatica Material completa (carta inset, scrim, gerarchia a tre voci)
      // non e' un ri-stile ma una ricostruzione del suo DOM, e da qui non e'
      // verificabile su un Android vero: e' rimasta fuori apposta.
      const foglioAndroid = sr.querySelector(
        "pwa-bottom-sheet",
      ) as HTMLElement | null;
      const srAndroid = foglioAndroid?.shadowRoot;
      if (srAndroid) {
        const regoleAndroid = `
        .dialog-body {
          --text-color-normal: ${t.titolo};
          --background-color: ${carta};
          --border-bottom-color: ${t.hairline};
          color: ${t.titolo};
          background-color: ${carta};
        }
        .dialog-body .material-button.primary {
          --background-color-primary: ${accentButton};
          --text-color-primary: #ffffff;
          background-color: ${accentButton};
          color: #ffffff;
          height: 48px;
          line-height: 48px;
          border-radius: 24px;
          font-size: 16px;
          font-weight: 500;
          text-transform: none;
        }
        .dialog-body .material-button.primary svg {
          fill: #ffffff;
        }
        .dialog-body .how-to-body .description-step .svg-wrap svg {
          fill: ${accent};
        }
      `;
        adotta(
          srAndroid,
          regoleAndroid.replace(/;/g, " !important;"),
          "android",
        );
      }
    },
    [accent, accentButton],
  );

  // La chiusura vive in un ref perche' la registriamo su un nodo (la x) che la
  // libreria ricrea a ogni ri-disegno: il listener resta uno solo e punta sempre
  // alla versione buona.
  const chiudiRif = useRef<() => void>(() => {});
  const chiudiFoglio = useCallback(() => {
    const el = ref.current;
    const sr = el?.shadowRoot;
    const dialogo = sr?.querySelector(
      ".install-dialog.apple",
    ) as HTMLElement | null;
    const ridotto = motoRidotto();
    const durata = ridotto ? 150 : 200;
    chiudendo.current = true;
    // Esce in 200ms e SOLO dopo si spegne il guscio: spegnerlo subito e'
    // corretto ma brusco, la carta spariva di scatto.
    if (dialogo)
      dialogo.style.setProperty(
        "animation",
        ridotto ? USCITA_PIANO : USCITA,
        "important",
      );
    if (scrim.current) scrim.current.style.opacity = "0";
    window.setTimeout(() => {
      if (guscio.current) guscio.current.style.display = "none";
      if (dialogo) dialogo.style.removeProperty("animation");
      // Solo a uscita finita: azzerarlo subito riapriva la porta all'entrata se
      // la libreria ridisegnava proprio dentro quei 200ms.
      animato.current = false;
      chiudendo.current = false;
    }, durata);
    // Chi chiude ha detto no per oggi: si riprova domani, non subito.
    const s = leggiStato();
    scriviStato({ volte: Math.max(s.volte, 1), ultimo: Date.now() });
  }, []);
  chiudiRif.current = chiudiFoglio;

  useEffect(() => {
    setLingua(linguaDispositivo());
    let annullato = false;

    // Apre il guscio e riarma le bandiere; lo scrim e l'entrata li accende
    // applicaStile, che e' l'unico posto che sa cosa c'e' davvero disegnato.
    const mostra = (el: PWAInstallElement) => {
      animato.current = false;
      chiudendo.current = false;
      if (guscio.current) guscio.current.style.display = "";
      // Sempre `forced`: senza, la libreria decide da sola in base a una sua
      // memoria interna e a volte non apre nulla. Quando aprire lo sappiamo noi,
      // a lei chiediamo solo di disegnare.
      el.showDialog(true);
      applicaStile(el);
    };

    // L'ELEMENTO PUO' NON ESSERCI ANCORA, e per un motivo che si vede solo
    // misurando: al primo render questo componente restituisce null (aspetta di
    // sapere la lingua), e l'import qui sotto puo' risolversi in un microtask,
    // cioe' PRIMA che React abbia montato <pwa-install>. Quando succede
    // `ref.current` e' null. Prima si usciva e basta: l'invito non compariva
    // MAI per quel caricamento, in silenzio. Misurato in un browser vero, in un
    // giro su tre o quattro, su tutti e tre gli hotel. Adesso si aspetta.
    const conElemento = (fn: (el: PWAInstallElement) => void) => {
      let tentativi = 0;
      const prova = () => {
        if (annullato) return;
        const el = ref.current;
        if (el) {
          fn(el);
          return;
        }
        if (tentativi++ < 60) window.setTimeout(prova, 50);
      };
      prova();
    };

    // Import dinamico: il pacchetto registra un custom element toccando
    // `window`, quindi non puo' essere importato nel render lato server.
    import("@khmyznikov/pwa-install").then(() => {
      if (annullato) return;
      conElemento((el) => {
        pronta.current = true;
        applicaStile(el);

        // Gia' installata e aperta dall'icona: non si chiede niente a nessuno.
        if (dentroApp() || el.isUnderStandaloneMode) return;

        const stato = leggiStato();
        if (stato.volte >= MAX_INVITI) return;
        if (stato.ultimo && Date.now() - stato.ultimo < GIORNO_MS) return;

        window.setTimeout(() => {
          if (annullato || !ref.current) return;
          mostra(ref.current);
          scriviStato({ volte: stato.volte + 1, ultimo: Date.now() });
        }, RITARDO_MS);
      });
    });

    // Dal footer: apertura forzata, e NON consuma i tre tentativi automatici —
    // l'ha chiesta l'ospite, non gliel'abbiamo proposta noi.
    const apri = () => {
      const el = ref.current;
      if (!el || !pronta.current) return;
      // Anche dal footer: dentro l'app installata l'invito non ha senso.
      if (dentroApp() || el.isUnderStandaloneMode) return;
      mostra(el);
    };
    window.addEventListener("blasat:show-onboarding", apri);

    // Ogni volta che la libreria ri-disegna il suo shadow root nascono una x e
    // un pulsante nuovi, di nuovo coi suoi colori: l'osservatore li ricorregge
    // appena compaiono. Solo `childList`: osservare anche gli attributi farebbe
    // rincorrere le nostre stesse scritture di stile all'infinito.
    let osservatore: MutationObserver | null = null;
    const avvia = () => {
      const el = ref.current;
      if (!el || !el.shadowRoot || osservatore) return;
      osservatore = new MutationObserver(() => applicaStile(el));
      osservatore.observe(el.shadowRoot, { childList: true, subtree: true });
      applicaStile(el);
    };
    // Un colpo subito, poi qualche ripasso ravvicinato. Perche': la libreria
    // disegna il suo shadow root quando vuole lei, e c'e' una finestra in cui il
    // dialogo esiste gia' ma i nostri stili non sono ancora stati messi. In
    // quella finestra si vedono i suoi colori al posto di quelli del marchio —
    // misurato in produzione: nello stesso giro un hotel giusto e due sbagliati,
    // e al giro dopo l'inverso. Non e' il deploy: e' il tempismo.
    avvia();
    const ripassi = [50, 150, 400, 900, 1800, 3000].map((ms) =>
      window.setTimeout(() => {
        avvia();
        if (ref.current) applicaStile(ref.current);
      }, ms),
    );

    // Il toggle luna del sito cambia <html data-theme> mentre l'invito puo'
    // essere gia' a schermo: senza questo resterebbe una carta chiara su pagina
    // scura, che e' il difetto 4 al contrario.
    const occhioTema = new MutationObserver(() => {
      if (ref.current) applicaStile(ref.current);
    });
    occhioTema.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      annullato = true;
      ripassi.forEach((r) => window.clearTimeout(r));
      osservatore?.disconnect();
      occhioTema.disconnect();
      window.removeEventListener("blasat:show-onboarding", apri);
    };
  }, [applicaStile]);

  if (lingua === null) return null;
  const t = TESTI[lingua];
  return (
    // Nascosto di partenza, e lo mostriamo NOI quando decidiamo di chiedere.
    // Perche': `manual-apple` dovrebbe impedire l'apertura automatica, ma nella
    // 0.6.4 lo fa chiamando hideDialog(), che sul percorso Apple non nasconde
    // niente (misurato: dopo hideDialog() il dialogo resta alto 232px). Il
    // risultato era che si riapriva a ogni caricamento ignorando il "chiesto
    // gia' oggi". Cosi' il difetto della libreria non arriva mai all'ospite, e
    // le regole su quando chiedere restano nostre.
    <div ref={guscio} style={{ display: "none" }}>
      {/* Lo scrim: stacca la carta dalle foto dell'hotel, sopra la dock
          flottante del sito e sotto il dialogo (2147483001). Toccarlo vale
          esattamente come toccare la x. */}
      <div
        ref={scrim}
        aria-hidden="true"
        onClick={chiudiFoglio}
        style={{
          position: "fixed",
          inset: 0,
          background: SCRIM,
          opacity: 0,
          transition: "opacity 250ms ease-out",
          zIndex: Z_SCRIM,
        }}
      />
      <pwa-install
        ref={ref}
        manual-apple="true"
        manual-chrome="true"
        name={appName}
        description={t.descrizione()}
        install-description={t.invito}
        manifest-url="/manifest.json"
      />
    </div>
  );
}
