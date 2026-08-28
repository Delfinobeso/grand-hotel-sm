#!/usr/bin/env node
/**
 * Precalcolo embeddings del concierge a BUILD TIME (prebuild Vercel).
 *
 * Perché esiste: a runtime i vettori dei frammenti si calcolavano lazy al
 * primo uso — con ~2 richieste/giorno ogni lambda è quasi sempre fredda,
 * quindi ogni ospite pagava la chiamata batch (~28KB) prima del primo
 * token: +700ms di TTFT mediano, misurato. Questo script sposta quel costo
 * al build, UNA volta per deploy invece che alla prima richiesta di ogni
 * istanza serverless fredda.
 *
 * Come funziona: legge src/lib/concierge.ts e src/lib/menus.ts del repo
 * CORRENTE (cwd = root del repo: lo invoca "prebuild" in package.json, che
 * Vercel esegue con cwd sulla root del progetto). Li transpila al volo con
 * typescript.transpileModule — nessun bundler, nessuna build intermedia:
 * questi 2 file non hanno import a runtime (solo stringhe template).
 * conciergeIndex.ts (transpilato anch'esso, per costruisciFrammenti() e
 * hashTesto()) importa invece 2 sibling a runtime — buildKbBlock da
 * ./conciergeKb e il JSON ./conciergeVectors.json — quindi lo script
 * transpila anche conciergeKb.ts e copia il conciergeVectors.json corrente
 * nella stessa cartella temporanea, così i require relativi generati dal
 * transpile si risolvono da soli. Zero rischio di divergenza tra script e
 * runtime: è LO STESSO conciergeIndex.ts, non una sua reimplementazione.
 *
 * Calcola poi le embeddings Mistral a batch di <= 8000 caratteri (limite
 * reale: 16384 token/richiesta; il corpus di un hotel è ~28KB in una
 * chiamata sola, troppo vicino al limite) e scrive
 * src/lib/conciergeVectors.json = { hash, modello, dim, vettori }, dove
 * `hash` usa la STESSA funzione hashTesto() del runtime (vedi
 * conciergeIndex.ts) — altrimenti un solo carattere di differenza nella
 * formula tra script e runtime farebbe fallire il match silenziosamente,
 * ributtando ogni richiesta sul percorso lazy senza che nessuno se ne
 * accorga.
 *
 * Se la chiave manca o l'API fallisce: exit 1 con messaggio chiaro. Un
 * deploy con vettori mancanti o vecchi deve essere RUMOROSO (build che
 * fallisce), mai silenzioso — il percorso lazy di conciergeIndex.ts
 * degrada comunque a runtime (mai un throw verso l'ospite), ma un ospite
 * che paga +700ms di TTFT per un prebuild fallito e mai rifatto è un
 * sintomo che nessuno noterebbe senza questo gate.
 */

import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const REPO_ROOT = process.cwd();
const LIB_DIR = join(REPO_ROOT, "src", "lib");
const OUT_FILE = join(LIB_DIR, "conciergeVectors.json");

const MISTRAL_EMBED_URL = "https://api.mistral.ai/v1/embeddings";
const EMBED_MODEL = "mistral-embed";
// Stessa soglia usata dal percorso lazy a runtime (conciergeIndex.ts):
// limite Mistral 16384 token/richiesta, corpus ~28KB in una chiamata sola
// era troppo vicino.
const BATCH_MAX_CHARS = 8000;

function fallisci(messaggio) {
  console.error(`[concierge-embed] ERRORE: ${messaggio}`);
  process.exit(1);
}

function transpila(percorsoTs) {
  const sorgente = readFileSync(percorsoTs, "utf8");
  const risultato = ts.transpileModule(sorgente, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: percorsoTs,
  });
  return risultato.outputText;
}

function scriviModuloTranspilato(percorsoTs, dirTemp, nomeFile) {
  const js = transpila(percorsoTs);
  const dest = join(dirTemp, nomeFile);
  writeFileSync(dest, js, "utf8");
  return dest;
}

async function caricaModulo(dest) {
  return import(pathToFileURL(dest).href);
}

/** Raggruppa `testi` in batch <= maxChars caratteri complessivi, senza mai
 *  spezzare un singolo testo fra due batch (stessa logica del percorso
 *  lazy in conciergeIndex.ts: raggruppaInBatch). */
function raggruppaInBatch(testi, maxChars) {
  const batch = [];
  let corrente = [];
  let correnteLen = 0;
  for (const t of testi) {
    if (corrente.length > 0 && correnteLen + t.length > maxChars) {
      batch.push(corrente);
      corrente = [];
      correnteLen = 0;
    }
    corrente.push(t);
    correnteLen += t.length;
  }
  if (corrente.length > 0) batch.push(corrente);
  return batch;
}

/** Chiama l'endpoint embeddings di Mistral su un batch, ordinando `data` per
 *  `index` prima di mappare gli `embedding`: l'ordine di risposta non è
 *  garantito, e un riordino silenzioso abbinerebbe un frammento al vettore
 *  sbagliato — con `deg:false`, cioè invisibile in produzione. */
async function chiediEmbeddingsBatchGrezzo(chiave, input) {
  const res = await fetch(MISTRAL_EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${chiave}` },
    body: JSON.stringify({ model: EMBED_MODEL, input }),
  });
  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    throw new Error(`Mistral embeddings HTTP ${res.status}: ${corpo.slice(0, 300)}`);
  }
  const data = await res.json();
  const items = data?.data;
  if (!Array.isArray(items) || items.length !== input.length) {
    throw new Error("risposta embeddings Mistral in formato inatteso (data mancante o lunghezza diversa dall'input)");
  }
  return [...items].sort((a, b) => a.index - b.index).map((it) => it.embedding);
}

async function chiediEmbeddingsBatch(chiave, testi) {
  if (testi.length === 0) return [];
  const batch = raggruppaInBatch(testi, BATCH_MAX_CHARS);
  const risultati = await Promise.all(batch.map((b) => chiediEmbeddingsBatchGrezzo(chiave, b)));
  return risultati.flat();
}

async function main() {
  const chiave = process.env.MISTRAL_API_KEY;
  if (!chiave) {
    fallisci(
      "MISTRAL_API_KEY non impostata: un build senza vettori precalcolati non e' ammesso. " +
        "Impostala nell'env Vercel del progetto (o esportala in locale se stai testando questo script).",
    );
    return;
  }

  const dirTemp = mkdtempSync(join(tmpdir(), "concierge-embed-"));
  // conciergeIndex.ts importa VALORI (non solo tipi) da due sibling: buildKbBlock
  // da ./conciergeKb e il JSON da ./conciergeVectors.json (per il confronto hash
  // a runtime, inutilizzato dalle funzioni pure che questo script chiama, ma il
  // modulo lo importa comunque al caricamento — deve risolvere). Li mettiamo
  // tutti nella STESSA cartella temporanea così i require relativi generati dal
  // transpile ("./conciergeKb", "./conciergeVectors.json") si risolvono da soli,
  // senza dover riscrivere gli import. package.json fissa la cartella a
  // CommonJS esplicitamente, indipendentemente dal "type" di eventuali
  // package.json antenati di tmpdir().
  writeFileSync(join(dirTemp, "package.json"), JSON.stringify({ type: "commonjs" }), "utf8");

  const vettoriJsonSorgente = existsSync(OUT_FILE) ? OUT_FILE : null;
  if (vettoriJsonSorgente) {
    copyFileSync(vettoriJsonSorgente, join(dirTemp, "conciergeVectors.json"));
  } else {
    // Non dovrebbe succedere (il file è tracciato in git con un segnaposto),
    // ma se manca scriviamo lo stesso segnaposto piuttosto che far fallire il
    // caricamento del modulo per un file mancante non correlato all'embedding.
    writeFileSync(join(dirTemp, "conciergeVectors.json"), JSON.stringify({ hash: "", modello: "", dim: 0, vettori: [] }));
  }

  let concierge;
  let menus;
  let indice;
  try {
    scriviModuloTranspilato(join(LIB_DIR, "conciergeKb.ts"), dirTemp, "conciergeKb.js");
    concierge = await caricaModulo(scriviModuloTranspilato(join(LIB_DIR, "concierge.ts"), dirTemp, "concierge.js"));
    menus = await caricaModulo(scriviModuloTranspilato(join(LIB_DIR, "menus.ts"), dirTemp, "menus.js"));
    indice = await caricaModulo(scriviModuloTranspilato(join(LIB_DIR, "conciergeIndex.ts"), dirTemp, "conciergeIndex.js"));
  } catch (e) {
    fallisci(`transpile/import di concierge.ts, menus.ts o conciergeIndex.ts fallito: ${e?.message || e}`);
    return;
  }

  const { SYSTEM_PROMPT_BASE, TRAILING } = concierge;
  const { MENUS } = menus;
  const { costruisciFrammenti, hashTesto, testoPerEmbedding } = indice;

  if (
    typeof SYSTEM_PROMPT_BASE !== "string" ||
    typeof TRAILING !== "string" ||
    typeof MENUS !== "string" ||
    typeof costruisciFrammenti !== "function" ||
    typeof testoPerEmbedding !== "function" ||
    typeof hashTesto !== "function"
  ) {
    fallisci(
      "uno o piu' export attesi mancano dopo il transpile (SYSTEM_PROMPT_BASE/TRAILING da concierge.ts, " +
        "MENUS da menus.ts, costruisciFrammenti/hashTesto da conciergeIndex.ts).",
    );
    return;
  }

  const { frammenti } = costruisciFrammenti(SYSTEM_PROMPT_BASE, MENUS, TRAILING);
  if (frammenti.length === 0) {
    fallisci("costruisciFrammenti ha prodotto zero frammenti: contenuto sorgente vuoto o parsing rotto.");
    return;
  }

  // STESSA formula usata da getIndice() a runtime (conciergeIndex.ts): se
  // diverge anche di un carattere, il match a runtime fallisce sempre.
  const hash = hashTesto(`${SYSTEM_PROMPT_BASE} ${MENUS} ${TRAILING}`);

  let vettori;
  try {
    // Stesso testo usato a runtime nel percorso lazy: frammento + glossario cross-lingua.
    vettori = await chiediEmbeddingsBatch(chiave, frammenti.map((f) => testoPerEmbedding(f.testo)));
  } catch (e) {
    fallisci(`chiamata embeddings Mistral fallita: ${e?.message || e}`);
    return;
  }

  if (!Array.isArray(vettori) || vettori.length !== frammenti.length) {
    fallisci(`numero di vettori ricevuti (${vettori?.length}) diverso dal numero di frammenti (${frammenti.length}).`);
    return;
  }

  const dim = vettori[0]?.length ?? 0;

  mkdirSync(LIB_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ hash, modello: EMBED_MODEL, dim, vettori }));

  console.log(
    `[concierge-embed] OK — ${frammenti.length} frammenti, dim=${dim}, hash=${hash} -> ${OUT_FILE}`,
  );
}

main();
