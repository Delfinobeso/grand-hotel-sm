#!/usr/bin/env python3
"""Scarica i menu dai Linktree e aggiorna src/lib/menus.ts.

Fonti:
  - La Terrazza: https://linktr.ee/laterrazza → Google Drive PDF
  - Caffè Titano: https://linktr.ee/caffetitanosanmarino → Google Drive PDF

Strategia: scarica PDF, estrai testo grezzo, se è cambiato → aggiorna menus.ts → commit → push.
Il concierge AI interpreterà il testo grezzo (è più robusto del parsing fragile).
"""

import subprocess, sys, os, re
from datetime import datetime

REPO = "/DATA/grand-hotel-sm"
MENUS_FILE = f"{REPO}/src/lib/menus.ts"

SOURCES = {
    "laterrazza": {
        "linktree": "https://linktr.ee/laterrazza",
        "label": "LA TERRAZZA",
        "food_keywords": ["Antipasti", "Primi", "Tagliatella"],
        "booking_note": "\nPrenotazione online: [Prenota La Terrazza](https://widget.thefork.com/it/bdef5000-1a1c-435f-9501-170ed277ac99).",
    },
    "caffetitano": {
        "linktree": "https://linktr.ee/caffetitanosanmarino",
        "label": "CAFFÈ TITANO",
        "food_keywords": ["Caffè espresso", "Piadine", "Cappuccino"],
        "booking_note": "\nTel +39 0549 992473, caffetitano@ghsmgroup.sm.",
    },
}

# Contenuti statici (nessuna fonte online)
STATIC_SECTIONS = """
### RISTORANTE L'ARENGO (in hotel, piano terra)
Cucina italiana tradizionale. Pasta fatta in casa dallo Chef Pastaio: lasagne, ravioli, tortellacci. Menu alla carta, menu tradizionale, menu bambini, menu dietetico Mességué (ipocalorico e per intolleranze). Fino a 120 coperti. Aperto anche a clienti esterni. Pane fatto in casa. Prenotazione gradita, non ha prenotazione online: indirizza al telefono della Reception.
Orari: Colazione 07:00-10:00, Pranzo 12:00-14:30, Cena 19:00-21:30.

### LA CREMERIA DEL TITANO (accanto al Caffè Titano, centro storico)
Gelateria artigianale. Gusti autentici con ingredienti semplici e genuini. Aperta nei mesi caldi.

### LA LOGGIA (piano terra Grand Hotel)
Piccola bottega con salumi, formaggi, vini e vermouth locali di San Marino e Romagna.
"""


def fetch_linktree_drive_links(url):
    """Estrai link Google Drive da una pagina Linktree."""
    import requests
    r = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    links = re.findall(r'href="(https://drive\.google\.com/file/d/[^"]+)"', r.text)
    result = []
    for link in links:
        m = re.search(r'/d/([a-zA-Z0-9_-]+)', link)
        if m:
            result.append(f"https://drive.google.com/uc?export=download&id={m.group(1)}")
    return list(set(result))


def download_pdf_text(url):
    """Scarica PDF ed estrai testo con PyMuPDF."""
    import requests, fitz
    r = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    doc = fitz.open(stream=r.content, filetype="pdf")
    return "\n".join(str(page.get_text()) for page in doc)


def clean_menu_text(raw):
    """Pulisci il testo grezzo del PDF rimuovendo rumore (allergeni duplicati, header/footer)."""
    # Tronca alla sezione allergeni (fine menu)
    allergy_idx = raw.find("SOSTANZE O PRODOTTI CHE POSSONO CAUSARE")
    if allergy_idx > 0:
        raw = raw[:allergy_idx]
    # Rimuovi linee vuote multiple
    raw = re.sub(r'\n{3,}', '\n\n', raw)
    # Sostituisci caratteri rotti comuni nei PDF
    raw = raw.replace("¬", "€").replace("˚", "'")
    return raw.strip()


def generate_menus_ts(sections):
    """Genera il file menus.ts con le sezioni menu."""
    date = datetime.now().strftime("%Y-%m-%d")
    
    laterrazza = sections.get("laterrazza", "Menu non disponibile. Contattare la Reception.")
    caffetitano = sections.get("caffetitano", "Menu non disponibile. Contattare la Reception.")
    
    return f"""// Menu dei ristoranti GHSM Group — aggiornato automaticamente da cron job
// Ultimo aggiornamento: {date}
// Fonti: linktr.ee/laterrazza, linktr.ee/caffetitanosanmarino

export const MENUS = `
## MENÙ RISTORANTI E BAR (fonte: PDF ufficiali — aggiornato {date})

### RISTORANTE LA TERRAZZA (cucina haute-cuisine, panoramico, Hotel Titano)
Menu alla carta dello Chef Saverio Guida. Coperto €3,50 (include entrée e pane fatto in casa).

{laterrazza}

{STATIC_SECTIONS}

### CAFFÈ TITANO (Piazzetta del Titano 4, centro storico)
Caffetteria contemporanea con dehors sulla piazzetta medievale. WiFi gratuito.

{caffetitano}
`;
"""


def main():
    os.chdir(REPO)
    sections = {}
    
    for key, cfg in SOURCES.items():
        print(f"→ {cfg['label']}: {cfg['linktree']}")
        try:
            links = fetch_linktree_drive_links(cfg["linktree"])
            print(f"  {len(links)} PDF trovati")
            if not links:
                continue
            
            for i, url in enumerate(links):
                try:
                    text = download_pdf_text(url)
                    # Verifica che sia il menu cibo (non la carta vini)
                    matches = sum(1 for kw in cfg["food_keywords"] if kw.lower() in text.lower())
                    if matches >= 2:
                        clean = clean_menu_text(text)
                        sections[key] = clean
                        print(f"  ✓ Menu cibo: PDF #{i+1} ({len(clean)} caratteri)")
                        break
                    else:
                        print(f"  - PDF #{i+1} non è menu cibo ({len(text)} caratteri)")
                except Exception as e:
                    print(f"  ✗ Errore PDF #{i+1}: {e}")
                    continue
        except Exception as e:
            print(f"  ✗ Errore Linktree: {e}")
    
    # Genera menus.ts
    new_content = generate_menus_ts(sections)
    
    # Confronta
    try:
        with open(MENUS_FILE) as f:
            old = f.read()
    except FileNotFoundError:
        old = ""
    
    if new_content.strip() == old.strip():
        print("\n✓ Menu invariati.")
        return
    
    with open(MENUS_FILE, "w") as f:
        f.write(new_content)
    
    print(f"\n✓ Menu aggiornati ({len(new_content)} caratteri)")
    subprocess.run(["git", "add", MENUS_FILE], check=True)
    subprocess.run(["git", "commit", "-m", "chore: aggiornamento automatico menu ristoranti GHSM"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("✓ Pushato → Vercel redeploy.")


if __name__ == "__main__":
    main()
