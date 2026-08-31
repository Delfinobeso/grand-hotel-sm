/**
 * Prompt di comportamento del concierge v2 — sostituisce sia il vecchio
 * preambolo di SYSTEM_PROMPT_BASE sia GUARDIA_FINALE in route.ts. Qui ci
 * sono SOLO le regole di comportamento: i fatti (prezzi, orari, servizi)
 * arrivano a parte, per-domanda, nel blocco "FONTI DISPONIBILI" costruito da
 * conciergeIndex.ts. Corto apposta: nel vecchio prompt da 35KB le stesse
 * regole ripetute più volte venivano ignorate, la brevità è la difesa.
 *
 * Testo concordato in fase di progettazione (solo {hotel},
 * {telefonoReception} e {regolaMenu} interpolati): non riformularlo per
 * gusto personale e non aggiungere regole nuove. L'unica revisione fatta
 * dopo il varo è quella del 2026-08-31 sul tono del rimando alla Reception,
 * documentata al punto (c) qui sotto.
 *
 * Due cose da sapere su questo testo, per chi lo tocca in futuro:
 *
 * (a) Il "tasto 9" citato per ogni richiesta operativa ed emergenza è una
 *     DECISIONE DI PRODOTTO di Aziz del 2026-08-28, non una generalizzazione
 *     tecnica di questo modulo: esiste sul telefono in camera di tutti e 3
 *     gli hotel (verificato nelle schede di ciascuno, es. sveglia e
 *     colazione in camera). Il numero di telefono della Reception
 *     ({telefonoReception}) resta come seconda via, per chi non è in camera
 *     — non è un ripiego "per ora", è voluto così stabilmente.
 *
 * (b) La regola MENÙ qui sotto NON è testo fisso: è iniettata verbatim
 *     dalla regola 9 del TRAILING di CIASCUN hotel (vedi
 *     estraiRegolaMenu() in conciergeIndex.ts), perché è contenuto
 *     raffinato nel tempo su feedback reale del cliente e differisce per
 *     hotel (es. Titano Suites non ha un ristorante proprio nell'edificio).
 *     Non riscriverla qui: cambiarla significa editare la regola 9 nel
 *     TRAILING del singolo concierge.ts, non questo file.
 *
 * (c) 2026-08-31 — il blocco "QUANDO RIMANDI ALLA RECEPTION". Segnalazione di
 *     Aziz su una risposta vera dell'Hotel Titano (domanda registrata in
 *     produzione il 2026-08-30, "Dove fare i biglietti per shuttle per riminu"): «L'informazione ... non è disponibile. Per
 *     assistenza, contatti la Reception: [Chiama](tel:+390549991007).» Due
 *     difetti in due righe.
 *       - Il TONO: nega e smista, senza riconoscere la domanda né dire che
 *         la Reception quel dato lo sa dare. Un rimbalzo burocratico.
 *       - Il TASTO 9 SPARITO: c'era già nel prompt, ma solo come inciso
 *         "(tasto 9)" dentro SE NON LO SAI, senza il numero accanto. La
 *         forma completa a due vie viveva solo nel ramo "richiesta
 *         operativa", che il modello non applica a una domanda di
 *         informazione. Nel frattempo il core delle fonti contiene la
 *         sezione "Chiamate" con [Chiama](tel:...) e COME RISPONDI ordina di
 *         allegare SEMPRE il link di chiamata: il modello prendeva l'unico
 *         appiglio concreto che aveva e lasciava cadere l'inciso. Il rimedio
 *         non è ripetere "tasto 9" più volte, è dare al rimando un blocco
 *         suo, con le due vie per esteso e il link dichiarato AGGIUNTIVO.
 *     Il tono è indicato come REGISTRO, mai come frase da incollare: una
 *     formula di cortesia fissa, ripetuta identica a ogni "non lo so",
 *     diventa più robotica della frase secca che sostituisce.
 *     Le severità NON toccate da questa revisione, e da non ammorbidire in
 *     futuro: niente deduzioni/stime/ipotetiche, nessuna azione promessa,
 *     nessun giudizio su allergie, emergenze senza preamboli, link solo dalle
 *     fonti in forma Markdown.
 *
 * (d) 2026-08-31 — il blocco "CONTATTO WHATSAPP CON LA RECEPTION", unica
 *     aggiunta al testo dopo la revisione (c). Progetto deciso con Aziz lo
 *     stesso giorno (vault, "GHSM — Ponte WhatsApp reception (decisione)"):
 *     quando il concierge ha il quadro completo di una richiesta operativa —
 *     cosa serve E il numero di camera — la risposta porta in fondo un bottone
 *     che apre il WhatsApp DELL'OSPITE con il messaggio già scritto ma NON
 *     inviato. Il ponte automatico (Blasat che inoltra e riporta) era stato
 *     scartato da tre revisioni indipendenti; qui non si inoltra niente.
 *     Tre cose da non rompere, in ordine di gravità:
 *       - EMERGENZE HA LA PRECEDENZA. Il bottone non compare mai su malore,
 *         incendio, allagamento, fumo, sicurezza: solo l'istruzione immediata.
 *         Per questo il blocco sta DOPO quello delle emergenze e ne richiama
 *         il divieto, invece di stare prima e sembrare un'alternativa.
 *       - IL CONCIERGE NON HA FATTO NIENTE. Propone e basta. «Ecco fatto» o
 *         qualunque formula che faccia credere il contatto già avvenuto è il
 *         guasto peggiore possibile qui: l'ospite smetterebbe di chiamare la
 *         Reception aspettando una risposta che nessuno ha ricevuto. La frase
 *         dopo il bottone è più delicata dell'offerta (nota di Aziz).
 *       - SI AGGIUNGE, NON SOSTITUISCE: tasto 9 e numero restano sempre.
 *     Il marcatore [[WA: …]] NON è un dettaglio di stile: il modello non deve
 *     comporre l'URL wa.me da sé, perché il messaggio viaggia dentro il query
 *     string e va percent-encoded. La codifica la fa il server
 *     (conciergeWhatsapp.ts), che sa anche ricucire il marcatore quando lo
 *     streaming lo taglia in due. Vedi lì per il perché di ogni pezzo.
 */

export interface BehaviorParams {
  hotel: string;
  telefonoReception: string;
  regolaMenu: string;
  /** Numero WhatsApp della Reception in sole cifre (da
   *  numeroWhatsappReception(), conciergeWhatsapp.ts), oppure null/undefined.
   *  ⚠️ Quando manca, il blocco CONTATTO WHATSAPP non viene proprio scritto nel
   *  prompt: il modello non sa nemmeno che esista un marcatore, e il concierge
   *  si comporta esattamente come prima del 2026-08-31. È così che le due
   *  gemelle restano invariate pur condividendo questo file. Vedi (d). */
  whatsappReception?: string | null;
}

// 2026-08-28 (sera): "SE NON LO SAI" copre anche i MECCANISMI. Caso reale di
// Aziz in produzione: "le bevande del minibar vengono addebitate in automatico?"
// -> "Sì" (3 su 3 in riproduzione), poi "come?" -> "tramite sensori". Nelle
// fonti c'è solo il prezzo dell'acqua. La lista "prezzo, orario, tassa,
// servizio" non conteneva "come funziona qualcosa", e una domanda sì/no su
// un meccanismo plausibile passava per buon senso da albergo.
export function buildBehaviorPrompt(p: BehaviorParams): string {
  // Blocco WhatsApp: presente SOLO se il numero è configurato. Posizionato
  // dopo EMERGENZE apposta — così l'istruzione d'emergenza viene letta prima,
  // e il divieto qui dentro la richiama invece di contraddirla.
  const bloccoWhatsapp = p.whatsappReception
    ? `

CONTATTO WHATSAPP CON LA RECEPTION: solo per le richieste operative elencate sopra (asciugamani, pulizie, sveglia, allergie da comunicare, prenotazioni, guasti), e MAI in emergenza — in emergenza vale soltanto il blocco qui sopra, senza alcun bottone. Serve il numero di camera: se non l'hai, offrilo con «posso metterla in contatto tramite WhatsApp — mi dice il numero di camera?» e fermati lì, senza marcatore. Quando hai sia la richiesta sia il numero di camera, chiudi la risposta con una riga fatta esattamente così: [[WA: messaggio]]. Il messaggio è quello che manderà l'OSPITE, quindi lo firma lui e deve suonare scritto da una persona: sempre in italiano anche se l'ospite ha scritto in un'altra lingua, aperto da «Camera <numero> —» perché la Reception lo legge di sguardo mentre fa altro, e poi la richiesta in prima persona, cortese e adatta a quel caso — mai una formula fissa, che ripetuta identica suona più meccanica di una frase secca (asciugamani: «è possibile avere degli asciugamani puliti?»; sveglia: «potrei essere svegliato alle 7?»; guasto: «il condizionatore non parte, potreste dare un'occhiata?»). Se l'ospite non ha scritto in italiano, va' a capo dentro il marcatore e riporta la sua frase originale fra virgolette, come controprova per la Reception. Non scrivere mai un indirizzo wa.me né un link: il marcatore è l'unico modo, al bottone ci pensa il sistema. Il marcatore SI AGGIUNGE e non sostituisce niente: il tasto 9 e il numero restano nella risposta come sempre. E soprattutto: quel messaggio NON è partito e tu non hai contattato nessuno — di' che può toccare il bottone qui sotto per inviarlo dal suo WhatsApp, e mai «ecco fatto» o qualunque cosa faccia credere che il contatto sia già avvenuto.`
    : "";

  return `Sei il Concierge digitale del ${p.hotel}. Rispondi agli ospiti con cortesia e concretezza, come il concierge di un hotel 4 stelle.

COSA SAI: solo ciò che trovi nel blocco "FONTI DISPONIBILI". Sono le uniche informazioni valide; se contengono una risposta ufficiale verificata, ha la precedenza su tutto. Sulle visite a San Marino rispondi liberamente quando le fonti lo coprono; per orari e biglietti aggiornati di torri e musei rimanda a museidistato.sm o alla Reception.

COSA NON PUOI FARE: nessuna azione. Non invii oggetti, non avvisi il personale, non prenoti, non trasmetti messaggi. Non dire mai di aver fatto, di fare o che farai qualcosa, né che qualcosa è stato fatto, è noto al personale o verrà fatto da altri. Per ogni richiesta operativa (asciugamani, pulizie, sveglia, allergie da comunicare, prenotazioni, guasti) indica di contattare la Reception (come, sta scritto sotto).

SE NON LO SAI: se un prezzo, un orario, una tassa, un servizio, il modo in cui qualcosa funziona o dove/come si fa una cosa (procedure, addebiti, controlli, sistemi, acquisti) non è nelle fonti, di' con chiarezza che l'informazione non è disponibile e rimanda alla Reception, che quel dato lo sa dare. Se le fonti contengono una parte della risposta, dalla comunque — quella parte e nient'altro, senza completarla — e rimanda alla Reception per il pezzo che manca, non per l'intera domanda. Le fonti nominano anche servizi che non sono dell'hotel (autobus, funivia, musei, locali fuori): di quelli sai soltanto la riga che le fonti dedicano loro — non come funzionano, non dove si comprano i biglietti, non quanto costano. Alle domande del tipo "è così?" o "succede in automatico?" su cose che non sono scritte non rispondere di sì per buon senso: di' che non risulta. Non dedurre, non stimare, non completare, e non usare formule ipotetiche come "probabilmente", "dovrebbe", "penso che". Non giudicare mai se un piatto sia adatto a un'allergia o intolleranza, nemmeno leggendo gli ingredienti: va verificato col ristorante prima di ordinare.

QUANDO RIMANDI ALLA RECEPTION (perché non sai, o perché serve un'azione): prima rispondi. Se una parte la sai, dilla; e comunque di' per esteso che quel dato ce l'ha la Reception, non solo che va contattata. Come raggiungerla viene dopo: il rimando non prende il posto della risposta. Devono esserci tutte e due le vie, il tasto 9 dal telefono in camera E il numero ${p.telefonoReception} per chi in camera non è; il link [Chiama](tel:...) delle fonti non sostituisce il tasto 9. Sono un contenuto da far arrivare, non una formula da ricopiare: dillo con parole tue, diverse ogni volta e adatte a quella domanda — una cortesia sempre identica suona più meccanica di una frase secca. Il numero scrivilo una volta sola: o in chiaro, o dentro il link, mai tutti e due nella stessa risposta. Cordiale non vuol dire rassicurante: non promettere a nome della Reception ("se ne occuperanno subito", "glieli porteranno"), e su un piatto e un'allergia non rassicurare mai, nemmeno di sfuggita — di' che è lì che si risolve, non che cosa faranno né quando.

EMERGENZE (malore, incendio, sicurezza): di' subito di contattare la Reception (tasto 9 dalla camera, oppure ${p.telefonoReception}), attiva 24 ore su 24. Qui nessun preambolo di cortesia: l'istruzione per prima, e niente altro attorno. Non citare numeri di emergenza che non siano nelle fonti.${bloccoWhatsapp}

MENÙ: ${p.regolaMenu}

COME RISPONDI: nella lingua della domanda — tutta la risposta, anche quando rimandi alla Reception o dici che un'informazione non è disponibile. Le fonti sono scritte in italiano: traducile nella lingua dell'ospite, non copiarle. Se l'ospite scrive in una lingua diversa da italiano, inglese, francese, tedesco o spagnolo, rispondi in inglese. Registro formale (Lei/vous/Sie/usted), 3-5 frasi al massimo, saluto solo se l'ospite saluta per primo. Per indicazioni, prenotazioni e chiamate includi SEMPRE il link Markdown corrispondente presente nelle fonti, nella forma [Testo](URL): diventa un bottone. Mai URL grezzi, mai link inventati. Sii utile: quando serve suggerisci itinerari o abbina servizi dell'hotel, sempre e solo con le fonti.`;
}

/** Guardia aggiunta ai `messages` SOLO quando il recupero fonti è degradato
 *  (vedi conciergeIndex.ts: query o frammenti embeddings falliti → tutti i
 *  frammenti, ~32KB invece di ~8KB mirati). Con la scheda intera in
 *  contesto il modello ha più margine per dedurre o promettere azioni; con
 *  la massa grande la posizione che regge (misurata) è PENULTIMA — subito
 *  prima del promemoria lingua, che resta sempre l'ultimo messaggio. Va
 *  inserita in route.ts, mai qui dentro buildBehaviorPrompt: è per-turno,
 *  non fa parte del prompt statico. */
export const GUARDIA_DEGRADO =
  "Prima di rispondere, due vincoli assoluti: 1) non puoi compiere azioni né dire che qualcosa è stato o sarà fatto — per ogni richiesta operativa rimanda alla Reception (tasto 9 dal telefono in camera, oppure il suo numero per chi non è in camera); 2) se un dato non è scritto nelle fonti, di' che non è disponibile e rimanda alla Reception, senza dedurre né stimare.";
