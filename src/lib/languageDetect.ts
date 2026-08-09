/**
 * Rilevamento lingua leggero per il messaggio dell'ospite del concierge —
 * NON un classificatore linguistico serio, solo un conteggio di parole
 * funzionali comuni alle 5 lingue supportate dal concierge (vedi LINGUA nel
 * system prompt). Deterministico, zero dipendenze, zero chiamate di rete:
 * deve girare prima della chiamata a DeepSeek senza aggiungere latenza.
 *
 * Perché serve: il system prompt del concierge è enorme e quasi interamente
 * in italiano — l'istruzione "rispondi nella lingua della domanda", pur
 * ripetuta, non basta da sola (verificato: ~20% di aderenza su domande
 * inglesi). Nominare esplicitamente la lingua rilevata in un messaggio di
 * rinforzo finale porta l'aderenza al 100% nei test — ma un rilevamento
 * SBAGLIATO che nomina la lingua sbagliata è peggio di nessun rilevamento:
 * forzerebbe attivamente la lingua sbagliata. Da qui la soglia di fiducia:
 * si nomina la lingua SOLO quando il margine sul secondo candidato è netto,
 * altrimenti `confident` è false e il chiamante deve ripiegare su un
 * messaggio generico (mai indovinare).
 */

export type LinguaConcierge = "italiano" | "inglese" | "francese" | "tedesco" | "spagnolo";

interface Rilevamento {
  lingua: LinguaConcierge;
  confident: boolean;
}

// Parole funzionali brevi e frequenti in domande da ospite d'hotel. Non è
// linguistica seria: è un conteggio di indizi, pesato dalla soglia di
// margine in `rileva()`, non dal singolo match.
const PAROLE: Record<LinguaConcierge, string[]> = {
  italiano: [
    "il", "lo", "la", "gli", "le", "che", "cosa", "dove", "quando", "come",
    "posso", "può", "puoi", "avete", "è", "sono", "per", "con", "del", "della",
    "dei", "delle", "una", "un", "mi", "ci", "si", "vorrei", "grazie", "buongiorno",
    "camera", "ristorante", "prenotare", "orario", "quanto",
  ],
  inglese: [
    "the", "is", "are", "can", "could", "you", "your", "what", "where", "when",
    "how", "do", "does", "i", "we", "my", "our", "have", "has", "please",
    "possible", "would", "room", "need", "want", "thanks", "hello", "there",
  ],
  francese: [
    "le", "les", "est", "êtes", "vous", "votre", "que", "où", "quand", "comment",
    "avez", "avons", "je", "nous", "pouvez", "peut", "s'il", "merci", "bonjour",
    "chambre", "réserver", "combien",
  ],
  tedesco: [
    "der", "die", "das", "ist", "sind", "können", "sie", "ihr", "was", "wo",
    "wann", "wie", "haben", "ich", "wir", "bitte", "möchte", "zimmer", "danke",
    "hallo", "wieviel",
  ],
  spagnolo: [
    "el", "los", "las", "es", "son", "puede", "puedo", "usted", "qué", "dónde",
    "cuándo", "cómo", "tiene", "tienen", "tengo", "hay", "está", "necesito",
    "por favor", "gracias", "hola", "habitación", "reservar", "cuánto",
  ],
};

// Sotto questa lunghezza il rischio di falso positivo è troppo alto ("ok",
// "grazie", "merci" da soli non bastano a fidarsi).
const LUNGHEZZA_MIN_AFFIDABILE = 8;
// Margine minimo (in match) tra il primo e il secondo candidato per
// dichiararsi "confident". Sotto questa soglia, meglio non nominare nulla.
const MARGINE_MINIMO = 2;

function normalizza(testo: string): string[] {
  return testo
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Rileva la lingua più probabile del messaggio. `confident=false` quando il
 *  messaggio è troppo corto o il segnale è ambiguo — il chiamante NON deve
 *  nominare la lingua in quel caso, solo eventualmente usare un promemoria
 *  generico. Mai un throw: input vuoto/strano ritorna italiano non confident
 *  (lingua di default del sito, comunque non usata se non confident). */
export function rileva(messaggio: string): Rilevamento {
  const parole = new Set(normalizza(messaggio));

  const punteggi = (Object.keys(PAROLE) as LinguaConcierge[]).map((lingua) => {
    const match = PAROLE[lingua].filter((p) => parole.has(p)).length;
    return { lingua, match };
  });

  punteggi.sort((a, b) => b.match - a.match);
  const [primo, secondo] = punteggi;

  const confident =
    messaggio.trim().length >= LUNGHEZZA_MIN_AFFIDABILE &&
    primo.match > 0 &&
    primo.match - (secondo?.match ?? 0) >= MARGINE_MINIMO;

  return { lingua: primo.lingua, confident };
}

/** Costruisce il messaggio di sistema di rinforzo da appendere in coda ai
 *  `messages` inviati a DeepSeek (mai dentro il prompt statico, mai salvato
 *  nello storico — solo per questa singola chiamata). Se non confident,
 *  torna la variante generica: nei test resta comunque nettamente meglio del
 *  silenzio (~80% contro ~20% di aderenza), senza il rischio di nominare la
 *  lingua sbagliata. */
export function promemoriaLingua(messaggioOspite: string): string {
  const { lingua, confident } = rileva(messaggioOspite);

  if (confident) {
    return (
      `PROMEMORIA CRITICO PRIMA DI RISPONDERE: l'ultimo messaggio dell'ospite è in ${lingua.toUpperCase()}. ` +
      `Scrivi l'INTERA risposta in ${lingua}, anche se le informazioni che usi per rispondere sono in italiano. ` +
      `Vale sempre, anche per le risposte brevi che rimandano alla Reception.`
    );
  }

  return (
    "PROMEMORIA CRITICO PRIMA DI RISPONDERE: scrivi l'INTERA risposta nella stessa identica lingua " +
    "dell'ultimo messaggio dell'ospite qui sopra — anche se le informazioni che usi sono in italiano."
  );
}
