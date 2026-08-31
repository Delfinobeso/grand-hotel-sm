/**
 * Ponte WhatsApp verso la Reception — versione "a bottone".
 *
 * Decisione del 2026-08-31 (vault, "GHSM — Ponte WhatsApp reception"): il ponte
 * automatico è stato SCARTATO da tre revisioni indipendenti. Quello che resta è
 * molto più semplice: quando il concierge ha il quadro completo di una richiesta
 * operativa (cosa serve E il numero di camera), la risposta porta in fondo un
 * bottone che apre il WhatsApp DELL'OSPITE con il messaggio già scritto ma NON
 * inviato. L'invio lo preme lui, dal suo numero. Blasat non trasmette nulla e
 * non conserva nulla; il mittente è una persona reale, quindi niente messaggi
 * anonimi verso il telefono della Reception.
 *
 * ── Perché questo file esiste, invece di far comporre il link al modello ──
 * Il messaggio viaggia DENTRO l'URL (`wa.me/<numero>?text=…`), quindi va
 * percent-encoded. Se si lascia comporre l'URL al modello, prima o poi arriva
 * un messaggio con gli accenti storpiati o troncato al primo carattere
 * speciale: è testo generato, non una funzione di codifica. Qui il modello
 * emette solo un MARCATORE con dentro il messaggio in chiaro; la codifica e la
 * costruzione del link li fa il server, che sa farli bene.
 *
 * ── La trappola dello streaming ──
 * La risposta arriva a pezzi dal provider, e il marcatore può essere spezzato
 * fra due pezzi ("…[[W" | "A: Camera 204 …"). Un `replace()` applicato a ogni
 * pezzo lascerebbe passare a schermo il marcatore grezzo ogni volta che il
 * taglio cade lì in mezzo — raro, quindi invisibile in prova e garantito in
 * produzione. `creaTrasformatoreWa()` tiene perciò un buffer di confine: NON
 * emette mai una coda di testo che potrebbe essere l'inizio di un marcatore.
 */

/** Delimitatori del marcatore. Scelti perché il modello non li produce da solo
 *  in prosa italiana e perché `]]` non compare dentro un messaggio di cortesia.
 *  Se un giorno servisse cambiarli, cambiarli anche in conciergeBehavior.ts. */
export const WA_APRE = "[[WA:";
export const WA_CHIUDE = "]]";

/** Etichetta del bottone, SEMPRE in italiano: è il client (ChatAssistant.tsx,
 *  ACTION_LABELS) che traduce le etichette nella lingua dell'ospite, esattamente
 *  come fa per "Chiama" e "Apri in Mappe". Se cambi questa stringa devi
 *  cambiare anche le chiavi in ACTION_LABELS dei tre repo, o il bottone resta
 *  in italiano nelle altre lingue. */
export const WA_ETICHETTA = "Scrivi su WhatsApp";

/** Tetto di sicurezza sul marcatore incompleto trattenuto nel buffer. Un
 *  marcatore mai chiuso (modello troncato da max_tokens, o che si inventa la
 *  sintassi) non deve né bloccare lo stream né finire a schermo: oltre questa
 *  soglia il frammento viene SCARTATO. Largo abbastanza per un messaggio di due
 *  righe con la citazione originale dell'ospite. */
const MAX_MARCATORE = 900;

/**
 * Numero WhatsApp della Reception, in sole cifre, pronto per `wa.me`.
 *
 * ⚠️ FALLIRE CHIUSO. Se `RECEPTION_WHATSAPP` non è configurata — e al momento
 * lo è per il solo Grand Hotel — questa ritorna null, il prompt non nomina
 * WhatsApp e il concierge si comporta ESATTAMENTE come prima di questa
 * modifica. È così che le due gemelle (Hotel Titano, Titano Suites) restano
 * invariate pur condividendo lo stesso file, e che si può pubblicare senza
 * aspettare che il numero arrivi.
 *
 * Il formato atteso è E.164 (`+378…`, `+39…`); si accettano spazi e separatori
 * perché una variabile d'ambiente scritta a mano li avrà. Un valore che non
 * somiglia a un numero di telefono viene rifiutato invece che passato a wa.me:
 * meglio nessun bottone che un bottone che apre una chat con nessuno.
 */
export function numeroWhatsappReception(): string | null {
  const grezzo = process.env.RECEPTION_WHATSAPP;
  if (!grezzo) return null;
  const cifre = grezzo.replace(/\D/g, "");
  // 8 cifre copre i fissi corti (San Marino ne ha), 15 è il massimo E.164.
  return cifre.length >= 8 && cifre.length <= 15 ? cifre : null;
}

/**
 * Percent-encoding per il parametro `text` di wa.me.
 *
 * `encodeURIComponent` da solo NON basta, per un motivo che non c'entra con
 * WhatsApp: lascia passare `( ) ' ! *` come caratteri letterali, e il client
 * riconosce i bottoni con la regex `\[([^\]]+)\]\((https?:…[^\s)]+)\)` — una
 * parentesi chiusa dentro l'URL taglierebbe il link a metà e il resto
 * finirebbe a schermo come testo. Li codifichiamo quindi a mano.
 * Gli spazi restano `%20` (non `+`): dentro un query string WhatsApp li rende
 * bene, `+` no.
 */
export function codificaTestoWa(testo: string): string {
  return encodeURIComponent(testo).replace(
    /[()'!*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/** Link Markdown pronto: la chat lo rende come bottone senza codice nuovo,
 *  è lo stesso meccanismo di [Chiama](tel:…) e [Apri in Mappe](https://…). */
export function linkWhatsapp(numero: string, messaggio: string): string {
  return `[${WA_ETICHETTA}](https://wa.me/${numero}?text=${codificaTestoWa(messaggio)})`;
}

/** Il testo normalizzato che finisce dentro il link: il modello tende a
 *  incorniciare il marcatore di spazi e a capo, e un messaggio WhatsApp che
 *  comincia con una riga vuota è sciatto. Le righe interne (la citazione della
 *  frase originale dell'ospite) vanno invece conservate. */
function ripulisciMessaggio(m: string): string {
  return m
    .split("\n")
    .map((r) => r.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface PezzoTrasformato {
  /** Da mandare all'ospite. */
  out: string;
  /** Da accumulare per il log analytics — vedi creaTrasformatoreWa(). */
  log: string;
}

export interface TrasformatoreWa {
  /** Consuma un pezzo dello stream e ritorna ciò che è sicuro emettere ORA. */
  push(pezzo: string): PezzoTrasformato;
  /** Chiude: emette il buffer residuo, scartando un marcatore mai terminato. */
  flush(): PezzoTrasformato;
}

/**
 * Trasformatore a buffer di confine: converte `[[WA: messaggio]]` nel link
 * Markdown, senza mai lasciar passare il marcatore grezzo nemmeno quando lo
 * streaming lo taglia in mezzo.
 *
 * La regola che rende la cosa corretta è una sola: **non emettere mai una coda
 * che potrebbe essere l'inizio di un marcatore**. In pratica, dopo aver
 * convertito tutti i marcatori completi, il resto viene emesso tranne il suo
 * suffisso più lungo che sia anche un prefisso di `[[WA:` (cioè `[`, `[[`,
 * `[[W`, `[[WA`, `[[WA:`). Quel pezzetto resta nel buffer e uscirà col pezzo
 * successivo, quando si saprà com'era davvero. Il ritardo massimo è di un
 * chunk e non si vede.
 *
 * @param numero  cifre da numeroWhatsappReception(), oppure null.
 *   ⚠️ Con `null` i marcatori vengono comunque RIMOSSI invece che mostrati. Non
 *   dovrebbe mai servire (senza numero il prompt non insegna la sintassi al
 *   modello), ma è la differenza fra un guasto silenzioso e un `[[WA: …]]`
 *   sullo schermo di un ospite. Il testo che non contiene marcatori esce
 *   comunque identico byte per byte, quindi "senza variabile" resta davvero
 *   "come prima".
 *
 * Sul campo `log`: l'analytics riceve il testo con il marcatore ridotto alla
 * sola ETICHETTA del bottone, senza l'URL. Due motivi, entrambi pratici: un
 * wa.me percent-encoded mangerebbe da solo i 700 caratteri del campo `a`
 * rendendo illeggibile la dashboard del cliente, e il messaggio precompilato
 * contiene il numero di camera — che non c'è ragione di duplicare nel log
 * (la revisione GDPR del ponte automatico lo segnalava esplicitamente).
 * Quello che l'ospite VEDE è comunque l'etichetta, quindi il log resta fedele
 * a "questa risposta a questa domanda".
 */
export function creaTrasformatoreWa(numero: string | null): TrasformatoreWa {
  let buf = "";
  /** Quanto del buffer corrente è un marcatore aperto e non ancora chiuso. */
  let dentroMarcatore = false;

  /** Lunghezza del suffisso di `s` che è anche prefisso di WA_APRE. */
  function codaAmbigua(s: string): number {
    const max = Math.min(WA_APRE.length - 1, s.length);
    for (let n = max; n > 0; n--) {
      if (s.endsWith(WA_APRE.slice(0, n))) return n;
    }
    return 0;
  }

  function macina(finale: boolean): PezzoTrasformato {
    let out = "";
    let log = "";

    for (;;) {
      if (dentroMarcatore) {
        const fine = buf.indexOf(WA_CHIUDE);
        if (fine === -1) {
          // Marcatore ancora aperto: non esce niente. Se ha superato ogni
          // misura ragionevole non si chiuderà più — lo si butta.
          if (buf.length > MAX_MARCATORE) {
            console.error(
              `[whatsapp] marcatore non terminato dopo ${buf.length} caratteri: scartato`,
            );
            buf = "";
            dentroMarcatore = false;
          }
          break;
        }
        const messaggio = ripulisciMessaggio(buf.slice(WA_APRE.length, fine));
        buf = buf.slice(fine + WA_CHIUDE.length);
        dentroMarcatore = false;
        if (numero && messaggio) {
          out += linkWhatsapp(numero, messaggio);
          log += WA_ETICHETTA;
        }
        // numero assente o marcatore vuoto: sparisce e basta.
        continue;
      }

      const apre = buf.indexOf(WA_APRE);
      if (apre === -1) break;
      out += buf.slice(0, apre);
      log += buf.slice(0, apre);
      buf = buf.slice(apre);
      dentroMarcatore = true;
    }

    if (!dentroMarcatore) {
      if (finale) {
        out += buf;
        log += buf;
        buf = "";
      } else {
        const tieni = codaAmbigua(buf);
        const sicuro = buf.slice(0, buf.length - tieni);
        out += sicuro;
        log += sicuro;
        buf = buf.slice(buf.length - tieni);
      }
    } else if (finale) {
      // Stream finito con un marcatore aperto: si scarta. Meglio una risposta
      // senza bottone che un `[[WA:` a schermo.
      console.error("[whatsapp] stream terminato con un marcatore aperto: scartato");
      buf = "";
      dentroMarcatore = false;
    }

    return { out, log };
  }

  return {
    push(pezzo: string) {
      buf += pezzo;
      return macina(false);
    },
    flush() {
      return macina(true);
    },
  };
}
