/** Markdown della chat: resa, estrazione dei link, e ritaglio sicuro dello stream.
 *
 *  Sta qui e non dentro ChatAssistant.tsx perché è logica pura, identica nei tre
 *  hotel, e soprattutto perché il ritaglio dello stream va provato in isolamento
 *  (scripts/test-stream-markdown.mjs): è la parte che regge i bottoni-azione.
 */

/** I bottoni-azione (Chiama, Mappe, WhatsApp, Prenota) nascono da QUESTA regex.
 *  Una funzione e non una costante: con il flag /g l'oggetto RegExp porta con sé
 *  lastIndex, e riusarlo fra due chiamate salterebbe dei link.
 *  È anche l'oracolo della prova sul troncamento — perciò è esportata: se cambia,
 *  cambia in un posto solo e la prova continua a misurare la cosa giusta. */
export function actionLinkRe(): RegExp {
  return /\[([^\]]+)\]\((https?:\/\/[^\s)]+|tel:[^\s)]+)\)/g;
}

/** Convert basic markdown formatting to HTML for chat rendering.
 *  Handles **bold**, *italic*, and ~~strikethrough~~. */
export function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([\s\S]+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~([\s\S]+?)~~/g, "<del>$1</del>");
  return html;
}

/** Ritaglio sicuro del testo che arriva a pezzi dal Concierge.
 *
 *  La risposta si vede mentre arriva (SSE), quindi a ogni flush il testo è quasi
 *  sempre troncato in mezzo a qualcosa. Renderizzarlo così com'è produce i difetti
 *  per cui lo streaming a schermo fu tolto il 23/06/2026 (commit 18b49ea): un link
 *  a metà — `[Chiama](tel:` — diventa per un istante un bottone rotto, e un `**`
 *  ancora aperto fa lampeggiare il grassetto a ogni token.
 *
 *  La cura non è nascondere tutto (quello era il buffering che si sta togliendo) né
 *  spogliare il Markdown durante lo stream (il tentativo intermedio, commit 895bdb5:
 *  il testo poi "saltava" quando la formattazione ricompariva a fine risposta). È
 *  tagliare all'ultimo punto in cui il Markdown è CHIUSO, e tenere il resto nel
 *  buffer finché non si chiude.
 *
 *  Due garanzie, entrambe verificate a ogni singolo troncamento dalla prova:
 *  1. quello che esce da qui non contiene mai un costrutto aperto, quindi
 *     actionLinkRe() non vede mai un link incompleto: un bottone o c'è intero o
 *     non c'è ancora;
 *  2. l'uscita è MONOTONA — allungare il testo in ingresso non la accorcia mai.
 *     Serve perché il testo già letto dall'ospite non deve tornare indietro; per
 *     questo un marcatore spezzato dal confine del buffer viene trattenuto invece
 *     che mostrato.
 */
export function safeStreamPrefix(text: string): string {
  /** Fine del testo o spazio: usato per le regole di apertura/chiusura. */
  const blank = (ch: string | undefined) => ch === undefined || /\s/.test(ch);

  let i = 0;
  /** Ultimo indice a cui tutti i costrutti risultavano chiusi. */
  let safe = 0;
  const open: Record<string, boolean> = { "**": false, "~~": false, "*": false };
  const settled = () => !open["**"] && !open["~~"] && !open["*"];

  while (i < text.length) {
    const rest = text.slice(i);

    if (rest[0] === "[") {
      // Un link vale solo se è completo: etichetta chiusa E url chiuso.
      const link = /^\[[^\]\n]*\]\((?:https?:\/\/|tel:|mailto:)[^\s)]*\)/.exec(rest);
      if (link) {
        i += link[0].length;
        if (settled()) safe = i;
        continue;
      }
      // `[testo]` seguito da un carattere che non è `(`: non è un link, è testo
      // normale. Serve però il carattere dopo per deciderlo, quindi in fondo al
      // buffer si trattiene comunque: potrebbe ancora arrivare la `(`.
      if (/^\[[^\]\n]*\][^(]/.test(rest)) {
        i += 1;
        if (settled()) safe = i;
        continue;
      }
      break; // link a metà, o ancora indecidibile: da qui in poi si trattiene tutto
    }

    const marker = rest.startsWith("**") ? "**" : rest.startsWith("~~") ? "~~" : rest[0] === "*" ? "*" : null;
    if (marker) {
      const after = rest[marker.length];
      const before = i > 0 ? text[i - 1] : undefined;
      if (!open[marker]) {
        // Serve il carattere successivo per sapere se apre davvero, e in fondo al
        // buffer non c'è ancora: trattieni.
        if (after === undefined) break;
        // Un marcatore seguito da spazio non apre niente (regola CommonMark). Senza
        // questa condizione un elenco puntato ("* Palestra") o un asterisco isolato
        // aprirebbero un corsivo che non si chiude mai, bloccando il flusso fino a
        // fine risposta.
        if (blank(after)) {
          i += marker.length;
          if (settled()) safe = i;
          continue;
        }
        open[marker] = true;
        i += marker.length;
        continue; // `safe` resta prima dell'apertura: il costrutto è aperto
      }
      // Simmetrico: un marcatore preceduto da spazio non chiude.
      if (!blank(before)) {
        open[marker] = false;
        i += marker.length;
        if (settled()) safe = i;
        continue;
      }
      i += marker.length;
      continue;
    }

    // Ultimo carattere disponibile e potrebbe essere la prima metà di un marcatore
    // (`~` che diventerà `~~`): trattienilo, altrimenti al pezzo successivo il testo
    // già mostrato dovrebbe accorciarsi.
    if (i === text.length - 1 && rest[0] === "~") break;

    i += 1;
    if (settled()) safe = i;
  }

  return text.slice(0, safe);
}
