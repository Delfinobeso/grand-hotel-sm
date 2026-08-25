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
 * si nomina la lingua quando il margine sul secondo candidato è netto OPPURE
 * quando una sola lingua matcha del tutto (1-contro-0, non ambiguo);
 * altrimenti `confident` è false e il chiamante deve ripiegare su un
 * messaggio generico (mai indovinare). Le liste sono state ampliate il
 * 2026-08-25 (soprattutto l'inglese) perché una frase inglese normale poteva
 * pescare troppo poche parole-spia e cadere sotto soglia.
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
    // Ampliata 2026-08-25: stesso buco delle altre lingue (parole di contenuto).
    "aperto", "aperta", "qualcosa", "dopo", "adesso", "cibo", "mangiare", "stasera",
    "stanotte", "oggi", "tardi", "mezzanotte", "colazione", "ancora", "vicino", "niente",
  ],
  inglese: [
    // Ampliata 2026-08-25: prima mancavano parole comunissime nelle domande
    // da ospite ("for", "after", "any", "open", "now", "food"…) e una frase
    // inglese normale poteva pescare una sola parola-spia — es. "Is anything
    // open for food after midnight" matchava solo "is", finiva sotto soglia e
    // rispondeva in italiano. Aggiunte solo parole SENZA collisione con le
    // altre 4 lingue (niente "a"/"am"/"in", che sono anche IT/DE).
    "the", "is", "are", "can", "could", "will", "would", "you",
    "your", "what", "where", "when", "how", "why", "who", "which", "do", "does",
    "did", "i", "we", "my", "our", "us", "have", "has", "please", "possible",
    "room", "need", "want", "get", "go", "thanks", "hello", "there", "here",
    "this", "that", "any", "anything", "something", "some", "for", "after", "before",
    "at", "to", "of", "and", "with", "not", "open", "closed", "available", "now",
    "today", "tonight", "tomorrow", "late", "still", "around", "near", "food",
    "breakfast", "dinner", "lunch", "much", "many", "time", "help", "book", "about",
  ],
  francese: [
    "le", "les", "est", "êtes", "vous", "votre", "que", "où", "quand", "comment",
    "avez", "avons", "je", "nous", "pouvez", "peut", "s'il", "merci", "bonjour",
    "chambre", "réserver", "combien",
    // Ampliata 2026-08-25: stesso buco dell'inglese (parole di contenuto).
    "ouvert", "ouverte", "maintenant", "manger", "quelque", "chose", "près",
    "petit", "déjeuner", "dîner", "encore", "soir", "tard", "après", "pour", "avec",
  ],
  tedesco: [
    "der", "die", "das", "ist", "sind", "können", "sie", "ihr", "was", "wo",
    "wann", "wie", "haben", "ich", "wir", "bitte", "möchte", "zimmer", "danke",
    "hallo", "wieviel",
    // Ampliata 2026-08-25: stesso buco dell'inglese (parole di contenuto).
    "geöffnet", "jetzt", "essen", "etwas", "noch", "gibt", "einen", "eine",
    "nach", "abend", "heute", "spät", "auch", "für", "mit",
  ],
  spagnolo: [
    "el", "los", "las", "es", "son", "puede", "puedo", "usted", "qué", "dónde",
    "cuándo", "cómo", "tiene", "tienen", "tengo", "hay", "está", "necesito",
    "por favor", "gracias", "hola", "habitación", "reservar", "cuánto",
    // Ampliata 2026-08-25: stesso buco dell'inglese (parole di contenuto).
    "quiero", "quisiera", "abierto", "abierta", "ahora", "comida", "cerca",
    "algo", "hasta", "para", "esta", "tarde", "noche", "hoy", "cena",
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

  const secondoMatch = secondo?.match ?? 0;
  const confident =
    messaggio.trim().length >= LUNGHEZZA_MIN_AFFIDABILE &&
    primo.match > 0 &&
    // Sicuro in due casi: (a) margine netto sul secondo candidato; (b) una
    // sola lingua matcha del tutto (secondo a 0). Il caso (b) non è ambiguo —
    // 1-contro-0 dice comunque quale lingua è — ed era proprio quello che
    // lasciava scoperte le domande inglesi brevi fatte di parole di contenuto,
    // dove finiva in lista una sola parola-spia (es. "is") e il ripiego
    // generico veniva ignorato ~20% delle volte.
    (primo.match - secondoMatch >= MARGINE_MINIMO || secondoMatch === 0);

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
