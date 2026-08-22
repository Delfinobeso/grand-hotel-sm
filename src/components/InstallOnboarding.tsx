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
 * TRE COSE CHE ABBIAMO DOVUTO CORREGGERE della libreria, tutte verificate a
 * pixel sul telefono e non a occhio:
 *
 * 1. TEMA. La libreria segue `prefers-color-scheme` e ha una variante scura; i
 *    siti degli hotel sono solo chiari. Con l'iPhone in modo scuro compariva un
 *    dialogo scuro sopra una pagina chiara: sembrava un corpo estraneo. Qui lo
 *    inchiodiamo alla variante chiara, che e' l'unica coerente col sito.
 * 2. LEGGIBILITA'. Il fondo predefinito e' bianco all'80% con sfocatura: sopra
 *    le foto degli hotel il testo della descrizione perdeva contrasto. Lo
 *    rendiamo opaco e portiamo i testi sopra la soglia AA.
 * 3. PAROLE. La libreria dice "Aggiungi alla schermata principale", iOS in
 *    italiano dice "Aggiungi alla schermata Home". In una guida che serve a
 *    dire *quello che vedrai fra due secondi*, una parola diversa fa esitare:
 *    la riportiamo a quella di sistema.
 *
 * COMPORTAMENTO (deciso da Aziz il 2026-08-22, e cambia rispetto a prima):
 *  - si apre DA SOLA al primo avvio, su iPhone come su Android. Fino a ieri su
 *    iOS non si apriva mai (scelta del 13/08, "il primo avvio da link deve
 *    restare pulito"): oggi la richiesta vince, perche' un ospite che non sa
 *    di poterla installare non la installa;
 *  - se non e' stata installata, si ripropone IL GIORNO DOPO, al massimo tre
 *    volte in tutto. Il tetto e' nostro: insistere all'infinito con un ospite
 *    che ha gia' detto no due volte non fa installare l'app, fa chiudere la
 *    pagina;
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
  const candidate = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
  for (const raw of candidate) {
    const due = raw.slice(0, 2).toLowerCase();
    if (due === "it" || due === "en" || due === "fr" || due === "de" || due === "es") return due;
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
 */
const TESTI: Record<Lingua, { descrizione: () => string; invito: string }> = {
  it: {
    descrizione: () => "Orari, servizi e concierge a portata di pollice, anche senza rete.",
    invito: "Non si scarica niente: resta un'icona sulla schermata Home.",
  },
  en: {
    descrizione: () => "Opening hours, services and concierge at your fingertips, even offline.",
    invito: "Nothing to download: it stays as an icon on your Home Screen.",
  },
  fr: {
    descrizione: () => "Horaires, services et conciergerie à portée de main, même hors ligne.",
    invito: "Rien à télécharger : une simple icône sur votre écran d'accueil.",
  },
  de: {
    descrizione: () => "Öffnungszeiten, Services und Concierge griffbereit, auch offline.",
    invito: "Nichts herunterzuladen: nur ein Symbol auf dem Home-Bildschirm.",
  },
  es: {
    descrizione: () => "Horarios, servicios y conserjería a mano, incluso sin conexión.",
    invito: "No se descarga nada: queda como un icono en la pantalla de inicio.",
  },
};

interface Stato {
  volte: number;
  ultimo: number;
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
    if (localStorage.getItem(CHIAVE_LEGACY) === "1") return { volte: 1, ultimo: Date.now() };
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

export default function InstallOnboarding({ appName }: { appName: string }) {
  const ref = useRef<PWAInstallElement | null>(null);
  // Contenitore che decide la visibilita'. Non si usa lo `style` sul custom
  // element perche' i suoi tipi JSX pretendono un CSSStyleDeclaration intero.
  const guscio = useRef<HTMLDivElement | null>(null);
  // `null` finche' non sappiamo la lingua, e finche' e' null NON montiamo
  // l'elemento. Non e' pignoleria: la libreria legge `description` una volta
  // sola quando l'elemento entra nel DOM, quindi montarlo con un valore
  // provvisorio lo congela li'. Misurato: su un telefono italiano restava la
  // descrizione inglese mentre il resto del dialogo era gia' in italiano.
  const [lingua, setLingua] = useState<Lingua | null>(null);
  const pronta = useRef(false);

  const applicaStile = useCallback((el: PWAInstallElement) => {
    // Le variabili della libreria, riscritte per stare coerenti col sito.
    // Sono dichiarate anche dentro la media query scura perche' altrimenti la
    // sua variante scura vincerebbe sull'iPhone in modo scuro — che e' proprio
    // il difetto visto sul telefono di Aziz.
    const regole = `
      #pwa-install-element .install-dialog,
      #pwa-install-element .install-dialog.apple {
        --background-color: #ffffff;
        --text-color-normal: #1b2430;
        --text-color-primary: #1b2430;
        --text-color-secondary: #46536a;
        --text-color-description: #46536a;
        --border-bottom-color: rgba(27, 36, 48, 0.14);
        backdrop-filter: none;
        /* Il pulsante predefinito e' grigio su grigio (misurato sullo screenshot
           del telefono: illeggibile). Blu-notte pieno con testo bianco. Non e' il
           colore di marca dei singoli hotel: due dei tre non espongono un token
           di marca leggibile, e indovinarlo su un'app cliente e' peggio che
           restare neutri. Se un giorno servisse, basta passarlo come prop. */
        --background-color-button: #1b2430;
        --background-color-button-active: #0f1720;
        --text-color-button: #ffffff;
      }
      @media (prefers-color-scheme: dark) {
        #pwa-install-element .install-dialog,
        #pwa-install-element .install-dialog.apple {
          --background-color: #ffffff;
          --text-color-normal: #1b2430;
          --text-color-primary: #1b2430;
          --text-color-secondary: #46536a;
          --text-color-description: #46536a;
          --background-color-button: #1b2430;
          --background-color-button-active: #0f1720;
          --text-color-button: #ffffff;
        }
      }
      /* La libreria colora il testo del pulsante con una variabile propria che
         in certi temi resta chiara su chiaro: lo forziamo sull'elemento.
         ATTENZIONE: solo il pulsante d'installazione. Una regola generica su
         tutti i button colpiva anche la x di chiusura e la faceva sparire
         (visto a schermo: restava un cerchio grigio vuoto). */
      #pwa-install-element .install-dialog button:not(.close) {
        color: #ffffff;
        background-color: #1b2430;
      }
      /* La × torna scura su fondo chiaro, com'e' nel tema chiaro della libreria. */
      #pwa-install-element .install-dialog .close {
        color: #1b2430;
      }
    `;
    const sr = el.shadowRoot;
    if (!sr) return;

    // FOGLIO ADOTTATO, non un <style> figlio. Perche': un <style> appeso allo
    // shadow root e' un nodo come gli altri, e quando la libreria ri-disegna
    // (succede a ogni showDialog dal link del footer) se lo porta via. Il
    // risultato, visto sul telefono di Aziz: aprendo dal footer tornavano il
    // fondo traslucido e la x invisibile, mentre all'apertura automatica era
    // tutto a posto — due strade, due risultati, e la differenza era solo che
    // una arrivava dopo un render. Un foglio adottato non e' un nodo del DOM:
    // sopravvive a qualunque render della libreria.
    const css = regole.replace(/;/g, " !important;");
    try {
      const gia = (sr.adoptedStyleSheets || []).some(
        (f) => (f as CSSStyleSheet & { dataBlasat?: boolean }).dataBlasat,
      );
      if (!gia) {
        const foglio = new CSSStyleSheet();
        foglio.replaceSync(css);
        (foglio as CSSStyleSheet & { dataBlasat?: boolean }).dataBlasat = true;
        sr.adoptedStyleSheets = [...(sr.adoptedStyleSheets || []), foglio];
      }
    } catch {
      // Safari molto vecchi non hanno i fogli costruibili: si ricade sul nodo
      // <style>, che e' meglio di niente anche se la libreria puo' toglierlo.
      if (!sr.querySelector("style[data-blasat]")) {
        const st = document.createElement("style");
        st.setAttribute("data-blasat", "1");
        st.textContent = css;
        sr.appendChild(st);
      }
    }

    // La x di chiusura la sistemiamo sull'ELEMENTO, non con un selettore.
    // Perche': il foglio iniettato sopra contiene la regola giusta, col
    // selettore giusto e perfino !important, e la libreria continua comunque a
    // dipingerla bianca (verificato a schermo: cerchio grigio senza x su fondo
    // bianco, cioe' invisibile). Non vale la pena litigare con una cascata che
    // non controlliamo: qui il valore lo scriviamo dove nessuno lo puo' battere.
    // Nello stesso passaggio si porta il bersaglio a 44px: ne misurava 26, sotto
    // il minimo tattile, ed e' l'unico modo che ha l'ospite per dire "no".
    const chiudi = sr.querySelector(".close") as HTMLElement | null;
    if (chiudi) {
      // LA CHIUSURA LA FACCIAMO NOI. Provato e misurato: con questa
      // configurazione (manual-apple + apertura forzata) ne' il tocco sulla x
      // ne' hideDialog() della libreria chiudono il dialogo — resta a schermo,
      // e un invito che non si puo' togliere di mezzo e' molto peggio di un
      // invito brutto. Nascondiamo l'intero elemento ospite: e' deterministico,
      // e la visibilita' la governiamo comunque gia' noi (vedi sotto).
      if (!chiudi.dataset.blasatChiusura) {
        chiudi.dataset.blasatChiusura = "1";
        chiudi.addEventListener("click", () => {
          if (guscio.current) guscio.current.style.display = "none";
          // Chi chiude ha detto no per oggi: si riprova domani, non subito.
          const s = leggiStato();
          scriviStato({ volte: Math.max(s.volte, 1), ultimo: Date.now() });
        });
      }
      chiudi.style.setProperty("color", "#1b2430", "important");
      chiudi.style.setProperty("min-width", "44px", "important");
      chiudi.style.setProperty("min-height", "44px", "important");
      chiudi.style.setProperty("display", "flex", "important");
      chiudi.style.setProperty("align-items", "center", "important");
      chiudi.style.setProperty("justify-content", "center", "important");
    }
  }, []);

  useEffect(() => {
    setLingua(linguaDispositivo());
    let annullato = false;

    // Import dinamico: il pacchetto registra un custom element toccando
    // `window`, quindi non puo' essere importato nel render lato server.
    import("@khmyznikov/pwa-install").then(() => {
      if (annullato) return;
      const el = ref.current;
      if (!el) return;
      pronta.current = true;
      applicaStile(el);

      // Gia' installata e aperta dall'icona: non si chiede niente a nessuno.
      if (el.isUnderStandaloneMode) return;

      const stato = leggiStato();
      if (stato.volte >= MAX_INVITI) return;
      if (stato.ultimo && Date.now() - stato.ultimo < GIORNO_MS) return;

      window.setTimeout(() => {
        if (annullato || !ref.current) return;
        if (guscio.current) guscio.current.style.display = "";
        // Sempre `forced`: senza, la libreria decide da sola in base a una sua
        // memoria interna e a volte non apre nulla. Quando aprire lo sappiamo
        // noi (vedi le regole sopra), a lei chiediamo solo di disegnare.
        ref.current.showDialog(true);
        applicaStile(ref.current);
        scriviStato({ volte: stato.volte + 1, ultimo: Date.now() });
      }, RITARDO_MS);
    });

    // Dal footer: apertura forzata, e NON consuma i tre tentativi automatici —
    // l'ha chiesta l'ospite, non gliel'abbiamo proposta noi.
    const apri = () => {
      const el = ref.current;
      if (!el || !pronta.current) return;
      if (guscio.current) guscio.current.style.display = "";
      el.showDialog(true);
      applicaStile(el);
    };
    window.addEventListener("blasat:show-onboarding", apri);

    // La x la sistemiamo sull'elemento, quindi ogni volta che la libreria
    // ri-disegna il suo shadow root ne nasce una nuova, di nuovo bianca su
    // bianco e di nuovo a 26px. L'osservatore la ricorregge appena compare.
    // Solo `childList`: osservare anche gli attributi farebbe rincorrere le
    // nostre stesse scritture di stile all'infinito.
    let osservatore: MutationObserver | null = null;
    const avvia = () => {
      const el = ref.current;
      if (!el || !el.shadowRoot || osservatore) return;
      osservatore = new MutationObserver(() => applicaStile(el));
      osservatore.observe(el.shadowRoot, { childList: true, subtree: true });
    };
    const t = window.setInterval(() => {
      if (osservatore) return window.clearInterval(t);
      avvia();
    }, 300);

    return () => {
      annullato = true;
      window.clearInterval(t);
      osservatore?.disconnect();
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
