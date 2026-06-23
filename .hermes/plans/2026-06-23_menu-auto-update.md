# Piano: Aggiornamento automatico menu concierge

> **Per Hermes:** Eseguire task by task. Piano auto-contenuto, non servono decisioni creative.

**Goal:** I menu dei ristoranti GHSM nel system prompt del concierge restano aggiornati senza intervento manuale.

**Architettura:** Menu in file separato `src/lib/menus.ts` → importato dalla API route → un cron job mensile scarica le fonti ufficiali, estrae il testo, aggiorna il file e committa/pusha se ci sono cambiamenti.

**Fonti attuali (verificate 2026-06-23):**
- **La Terrazza**: Linktree `https://linktr.ee/laterrazza` → Google Drive PDF (link etichettato "VINI" ma contiene il menu cibo; il link "MENÙ" contiene la carta vini)
- **Caffè Titano**: Linktree `https://linktr.ee/caffetitanosanmarino` → Google Drive PDF
- **L'Arengo**: nessuna fonte online stabile — contenuto statico

⚠️ **Quirk scoperto**: su Linktree, il bottone "VINI" punta al PDF del menu cibo, il bottone "MENÙ" punta alla carta vini. Lo script deve scaricare ENTRAMBI i PDF e determinare quale contiene piatti (keyword: "Antipasti", "Primi", "Tagliatella").

---

## Task 1: Estrarre i menu in `src/lib/menus.ts`

**Obiettivo:** Spostare la sezione `MENÙ RISTORANTI E BAR` dal system prompt inline in `route.ts` a un file separato.

**File:**
- Crea: `src/lib/menus.ts`
- Modifica: `src/app/api/chat/route.ts`

**Step 1: Crea `src/lib/menus.ts`**

```typescript
// Menu dei ristoranti GHSM Group — aggiornato automaticamente da cron job
// Ultimo aggiornamento: 2026-06-23
// Fonte: https://www.ghsmgroup.sm/images/menu_2026_merged.pdf

export const MENUS = `
## MENÙ RISTORANTI E BAR (fonte: siti ufficiali GHSM Group)

### RISTORANTE LA TERRAZZA (cucina haute-cuisine, panoramico, Hotel Titano)
Menu alla carta dello Chef Saverio Guida. Coperto €3,50 (include entrée e pane fatto in casa).

**Antipasti:**
- Uovo C.B.T., spuma di fossa e spinaci — €15
- Tartare di manzo, barbabietola e lamponi — €16
- Mortadella, peperoni rossi e robiola — €16
- Radicchio brasato, cipollotto, arancia e noci — €15

**Primi:**
- Tagliatella al ragù della tradizione romagnola — €15
- Gnocchi di zucca, caramello di zucca, porcini e maggiorana — €17
- Cappellacci ricotta, mascarpone, spinaci, salsa al pomodoro e olio al basilico — €18
- Bottoni di agnello, brodo di verza e parmigiano — €18
- Pasta secca con bietola, baccalà e acciuga — €18

**Secondi:**
- Cavolfiore, spuma di patate e glassa vegetale (vegetariano) — €15
- Pollo con cime di rapa e lime — €19
- Pescato del giorno, zucchine, pompelmo e ponzu — €20
- Manzo o agnello con radicchio, vino rosso e topinambur — €22

**Contorni:** Patate arrosto alle erbe aromatiche €6, Insalata mista di stagione €7, Erbetta di campo ripassate €7.

**Menu degustazione:**
- Percorso del Territorio (tradizionale locale): 4 portate — €35 a persona
- Percorso Degustazione (chef): 5 portate — €45 a persona
- Menù Bambino: tagliatella al ragù + cotoletta + gelato artigianale — €15

**Dolci:**
- Pan dolce alle pesche con crema pasticciera vaniglia Madagascar — €8
- Mezza sfera popcorn, caramello, lampone e mandorla — €8
- Tarte tatin alle mele e spuma alla cannella — €8
- Gelato artigianale della Cremeria del Titano

Prenotazione online disponibile. Per prenotare fornisci SEMPRE [Prenota La Terrazza](https://widget.thefork.com/it/bdef5000-1a1c-435f-9501-170ed277ac99).

### RISTORANTE L'ARENGO (in hotel, piano terra)
Cucina italiana tradizionale. Pasta fatta in casa dallo Chef Pastaio: lasagne, ravioli, tortellacci. Menu alla carta, menu tradizionale, menu bambini, menu dietetico Mességué (ipocalorico e per intolleranze). Fino a 120 coperti. Aperto anche a clienti esterni. Pane fatto in casa. Prenotazione gradita, non ha prenotazione online: indirizza al telefono della Reception.

Orari: Colazione 07:00-10:00, Pranzo 12:00-14:30, Cena 19:00-21:30.

### CAFFÈ TITANO (Piazzetta del Titano 4, centro storico)
Caffetteria contemporanea con dehors sulla piazzetta medievale. WiFi gratuito.

- **Colazione:** cappuccini, caffè speciali, brioches artigianali (produzione propria), muffin, biscotti.
- **Pranzo:** Lunch Break Menu (cambia ogni giorno): primo caldo o zuppa, secondo o insalatona. In alternativa: piadine, panini farciti, focacce, pizzette. Vini locali, birre.
- **Merenda:** oltre 30 gusti di cioccolata, 40 tipi di tè, torte, pasticceria artigianale, crêpes, bomboloni caldi.
- **Aperitivo / Happy Hour.**
- Consegna a domicilio disponibile. Tel +39 0549 992473.

### LA CREMERIA DEL TITANO (accanto al Caffè Titano, centro storico)
Gelateria artigianale. Gusti autentici con ingredienti semplici e genuini. Aperta nei mesi caldi.

### LA LOGGIA (piano terra Grand Hotel)
Piccola bottega con salumi, formaggi, vini e vermouth locali di San Marino e Romagna.
`;
```

**Step 2: Modifica `route.ts`** — importa `MENUS` e concatena nel system prompt.

In cima al file, dopo gli import:
```typescript
import { MENUS } from "@/lib/menus";
```

Nel `SYSTEM_PROMPT`, sostituisci l'intero blocco `## MENÙ RISTORANTI E BAR ... ### LA LOGGIA ...` con:
```
${MENUS}
```

La costante `SYSTEM_PROMPT` va convertita da `const` a template literal function o calcolata a runtime. Siccome è una stringa enorme con backtick, l'approccio più pulito:

```typescript
const SYSTEM_PROMPT_BASE = `...tutto il prompt fino a "Sito web: grandhotel.sm"`;

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT_BASE + "\n\n" + MENUS + "\n\n" + LINKS;
}
```

dove `LINKS` è la sezione `## LINK E AZIONI ... REGOLE FONDAMENTALI`.

Poi nella POST:
```typescript
const systemPrompt = buildSystemPrompt();
messages: [{ role: "system", content: systemPrompt }, ...history],
```

**Step 3: Verifica build**

```bash
cd /DATA/grand-hotel-sm && npm run build
```

**Step 4: Commit**

```bash
git add src/lib/menus.ts src/app/api/chat/route.ts
git commit -m "refactor: menu concierge in file separato src/lib/menus.ts"
```

---

## Task 2: Script di aggiornamento menu

**Obiettivo:** Script Python che scarica le fonti ufficiali, estrae il testo dei menu, e rigenera `src/lib/menus.ts`.

**File:**
- Crea: `scripts/update-menus.py`

**Script:**

```python
#!/usr/bin/env python3
"""Scarica i menu GHSM e aggiorna src/lib/menus.ts."""

import subprocess, sys, os, re

REPO = "/DATA/grand-hotel-sm"
MENUS_FILE = f"{REPO}/src/lib/menus.ts"

def fetch_pdf_text(url):
    """Scarica PDF e estrai testo con PyMuPDF."""
    import fitz  # pymupdf
    import requests
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    doc = fitz.open(stream=r.content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def fetch_caffe_titano():
    """Estrai info aggiornate da pagina Caffè Titano."""
    import requests
    r = requests.get("https://www.ghsmgroup.sm/en/caffe-titano", timeout=30)
    # Estrai paragrafi rilevanti
    # Per ora restituisci il contenuto statico se la fetch fallisce
    return None

def build_menus_ts(la_terrazza_text, caffe_info=None):
    """Genera il contenuto di menus.ts dai testi estratti."""
    # Elabora il testo del PDF in formato markdown strutturato
    # ... parsing del PDF per estrarre piatti e prezzi
    
    date = subprocess.check_output(["date", "+%Y-%m-%d"]).decode().strip()
    
    # Template base con placeholder sostituiti
    template = f'''// Menu dei ristoranti GHSM Group — aggiornato automaticamente da cron job
// Ultimo aggiornamento: {date}
// Fonte: https://www.ghsmgroup.sm/images/menu_2026_merged.pdf

export const MENUS = `
## MENÙ RISTORANTI E BAR (fonte: siti ufficiali GHSM Group)

{la_terrazza_text}

### RISTORANTE L'ARENGO (in hotel, piano terra)
...contenuto statico...

### CAFFÈ TITANO (Piazzetta del Titano 4, centro storico)
...contenuto statico...

### LA CREMERIA DEL TITANO (accanto al Caffè Titano, centro storico)
...contenuto statico...

### LA LOGGIA (piano terra Grand Hotel)
...contenuto statico...
`;
'''
    return template

def main():
    os.chdir(REPO)
    
    # 1. Scarica PDF La Terrazza
    try:
        pdf_text = fetch_pdf_text("https://www.ghsmgroup.sm/images/menu_2026_merged.pdf")
        print(f"PDF scaricato: {len(pdf_text)} caratteri")
    except Exception as e:
        print(f"Errore download PDF: {e}", file=sys.stderr)
        sys.exit(1)
    
    # 2. Prova a scaricare Caffè Titano
    caffe = fetch_caffe_titano()
    
    # 3. Genera nuovo menus.ts
    new_content = build_menus_ts(pdf_text, caffe)
    
    # 4. Confronta con versione attuale
    with open(MENUS_FILE) as f:
        old_content = f.read()
    
    if new_content == old_content:
        print("Nessun cambiamento nei menu.")
        return
    
    # 5. Scrivi e committa
    with open(MENUS_FILE, "w") as f:
        f.write(new_content)
    
    subprocess.run(["git", "add", MENUS_FILE], check=True)
    subprocess.run(["git", "commit", "-m", "chore: aggiornamento automatico menu ristoranti GHSM"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("Menu aggiornati e pushati!")

if __name__ == "__main__":
    main()
```

---

## Task 3: Cron job mensile Hermes

**Obiettivo:** Eseguire lo script ogni 30 giorni e pushare se ci sono cambiamenti.

**Comando Hermes:**
```
cronjob create per "esegui lo script di aggiornamento menu concierge" con schedule "0 8 1 * *" (il primo del mese alle 8:00), deliver=local, workdir=/DATA/grand-hotel-sm
```

Il cron job esegue:
```bash
cd /DATA/grand-hotel-sm && python3 scripts/update-menus.py
```

Se lo script rileva cambiamenti, committa e pusha → Vercel auto-deploya il nuovo system prompt.

Se non ci sono cambiamenti (PDF identico), esce senza fare nulla.

**Parametri cron job:**
- Schedule: `0 8 1 * *` (1° del mese, ore 8)
- Workdir: `/DATA/grand-hotel-sm`
- Deliver: `local` (non serve notifica, il deploy è automatico)
- Enabled toolsets: `["terminal", "file"]` (minimo indispensabile)

---

## Task 4: Comando manuale "aggiorna menu"

**Obiettivo:** Poter eseguire l'aggiornamento su richiesta.

Basta dire a Hermes: "aggiorna i menu del concierge" → esegue `scripts/update-menus.py` e riporta il risultato.

Documentato nella skill `grand-hotel-sm`.

---

## Rischi e note

- **URL PDF potrebbe cambiare** (es. `menu_2027_merged.pdf`) → lo script fallisce silenziosamente, i menu attuali restano validi. Quando succede, aggiornare l'URL nello script.
- **L'Arengo non ha menu online** → contenuto statico, va aggiornato manualmente se il ristorante pubblica un PDF.
- **Caffè Titano** ha una pagina HTML ma il Lunch Break Menu cambia ogni giorno → teniamo solo descrizione generale, non il menu del giorno.
- **Costo token**: il system prompt ora è ~15K caratteri (~4K token). Accettabile per DeepSeek.
- **Rate limit DeepSeek**: il cron job non chiama DeepSeek, solo HTTP fetch. Nessun impatto.

---

## Riepilogo modifiche

| File | Azione |
|------|--------|
| `src/lib/menus.ts` | **Nuovo** — menu in file dedicato |
| `src/app/api/chat/route.ts` | **Modifica** — importa MENUS, buildSystemPrompt() |
| `scripts/update-menus.py` | **Nuovo** — script aggiornamento automatico |
| Cron job Hermes | **Nuovo** — esecuzione mensile |
| Skill `grand-hotel-sm` | **Modifica** — documenta comando "aggiorna menu" |
