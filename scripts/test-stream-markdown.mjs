/** Prova del ritaglio sicuro dello streaming (src/lib/streamMarkdown.ts).
 *
 *  Quello che conta davvero sono i BOTTONI-AZIONE: nascono dai link Markdown, quindi
 *  un link troncato dallo streaming diventerebbe un bottone rotto. Qui ogni risposta
 *  di prova viene tagliata in OGNI punto possibile, e a ogni taglio si verifica che
 *  ciò che finirebbe a schermo sia sano.
 *
 *  Uso: node scripts/test-stream-markdown.mjs
 */
import { safeStreamPrefix, renderMarkdown, actionLinkRe } from "../src/lib/streamMarkdown.ts";

const CASES = [
  ["testo semplice", "La colazione è servita dalle 7:00 alle 10:30 in sala Mességué."],
  ["due bottoni + grassetto", "Per prenotare **La Terrazza** può usare [Prenota La Terrazza](https://www.thefork.it/x/1) oppure [Chiama](tel:+390549991234)."],
  ["corsivo + mappa", "Siamo in *Contrada del Collegio 31*. [Apri in Mappe](https://maps.google.com/?q=Grand+Hotel)"],
  ["bottone WhatsApp da solo", "Le passo la Reception.\n\n[Scrivi su WhatsApp](https://wa.me/390549991234)"],
  ["grassetto + barrato + link", "Orari: **07:00–10:30**. Il menù ~~cambia~~ varia ogni giorno. [Visiona il menù](https://linktr.ee/menu)"],
  ["elenco puntato", "Ecco i servizi:\n* Palestra al piano -1\n* Spa su prenotazione\n* Wi-Fi gratuito"],
  ["asterisco e parentesi quadre non-link", "Nessun link qui, solo testo con un asterisco * isolato e una parentesi [nota] chiusa."],
  ["tutti i costrutti insieme", "**Grassetto a inizio** e *corsivo* e [Chiama la Reception](tel:9) alla fine."],
  ["tre bottoni di fila", "[Chiama](tel:9) [Apri in Mappe](https://maps.google.com/?q=a) [Scrivi su WhatsApp](https://wa.me/39055)"],
];

let failures = 0;
const fail = (msg) => { failures++; console.error("  FALLITO: " + msg); };

/** I bottoni che il componente estrarrebbe da questo testo. */
const buttons = (s) => [...s.matchAll(actionLinkRe())].map((m) => m[1] + " -> " + m[2]);

for (const [name, full] of CASES) {
  const finalButtons = buttons(full);
  let prev = "";
  let localFail = failures;

  for (let n = 0; n <= full.length; n++) {
    const out = safeStreamPrefix(full.slice(0, n));

    // 1. quello che si vede è sempre testo vero, mai inventato
    if (!full.startsWith(out)) fail(`${name}, taglio ${n}: l'uscita non è un prefisso del testo vero`);

    // 2. il testo non torna mai indietro (è questo che impedisce lo sfarfallio)
    if (!out.startsWith(prev)) fail(`${name}, taglio ${n}: il testo mostrato si è accorciato (${prev.length} -> ${out.length} caratteri)`);

    // 3. nessun link a metà: dopo aver tolto i link completi non resta nessun "]("
    const stripped = out.replace(actionLinkRe(), "");
    if (stripped.includes("](")) fail(`${name}, taglio ${n}: link incompleto a schermo -> ${JSON.stringify(out.slice(-40))}`);

    // 4. ogni bottone mostrato ora è un bottone vero della risposta finita, nello
    //    stesso ordine: mai uno a metà, mai uno che poi cambia
    const shown = buttons(out);
    for (let b = 0; b < shown.length; b++) {
      if (shown[b] !== finalButtons[b]) fail(`${name}, taglio ${n}: bottone ${b} diverso da quello finale — "${shown[b]}" invece di "${finalButtons[b]}"`);
    }

    // 5. nessun marcatore a due caratteri lasciato scoperto: se sopravvive alla
    //    resa, l'ospite lo legge come due asterischi che poi spariscono
    const html = renderMarkdown(stripped);
    if (html.includes("**")) fail(`${name}, taglio ${n}: "**" visibile a schermo -> ${JSON.stringify(out.slice(-40))}`);
    if (html.includes("~~")) fail(`${name}, taglio ${n}: "~~" visibile a schermo -> ${JSON.stringify(out.slice(-40))}`);

    prev = out;
  }

  // 6. a stream finito non deve restare niente nel buffer
  const complete = safeStreamPrefix(full);
  if (complete !== full) fail(`${name}: a fine stream restano ${full.length - complete.length} caratteri trattenuti: ${JSON.stringify(full.slice(complete.length))}`);

  if (failures === localFail) console.log(`ok  ${name} — ${full.length + 1} tagli, ${finalButtons.length} bottoni`);
}

console.log(failures === 0 ? "\nTUTTO OK" : `\n${failures} FALLIMENTI`);
process.exit(failures === 0 ? 0 : 1);
