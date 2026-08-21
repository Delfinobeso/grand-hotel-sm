"use client";

import { useEffect, useRef, useState } from "react";
import type { PWAInstallElement } from "@khmyznikov/pwa-install";

/**
 * PROVA (branch prova/pwa-install-libreria) — alternativa a InstallOnboarding.tsx
 * basata su @khmyznikov/pwa-install (MIT, web component, ~28kB compressi).
 *
 * Perche' la stiamo provando: la parte fragile del nostro onboarding e' la guida
 * iOS, che mostra gli screenshot del foglio di condivisione di Safari. Sono
 * screenshot veri, ma invecchiano a ogni versione di iOS e vanno rifatti a mano
 * su tre hotel. Questa libreria fa la stessa guida mantenuta da altri, copre una
 * trentina di lingue (noi cinque) e su iOS/iPadOS/macOS 26+ usa il dialogo nativo
 * invece di ricostruirlo.
 *
 * REGOLE DI CASA CHE RESTANO, e sono il motivo dei due attributi "manual-":
 *  - su iPhone non si apre MAI da sola (decisione di Aziz del 2026-08-13: il primo
 *    avvio da link deve restare pulito). Qui lo garantisce `manual-apple`;
 *  - su Android si apre una volta sola al primo avvio, come oggi: lo facciamo NOI
 *    con la stessa chiave localStorage del componente esistente, cosi' chi l'ha
 *    gia' vista non la rivede passando da una versione all'altra;
 *  - resta raggiungibile in qualunque momento dal link nel footer, che entra
 *    dall'evento `blasat:show-onboarding` (stesso contratto di prima: il footer
 *    non sa e non deve sapere quale delle due implementazioni e' montata).
 */

// Stessa chiave del componente storico: la scelta dell'utente vale per entrambi.
const DISMISS_KEY = "blasat-onboarding-dismissed-v1";

// Il tipo dell'elemento e la dichiarazione JSX del tag li porta il pacchetto:
// scriverne una nostra in src/types andava in conflitto con la sua (provato).

export default function InstallOnboardingLib({ appName }: { appName: string }) {
  const ref = useRef<PWAInstallElement | null>(null);
  // Riga diagnostica della PROVA, visibile solo con &debug=1. Serve perche' la
  // libreria riconosce un iPhone controllando maxTouchPoints>2 + service worker:
  // in un browser simulato quelle condizioni non ci sono e il dialogo non compare
  // MAI, il che dal telefono sembrerebbe "non funziona" senza dire perche'.
  // Sul dispositivo vero dice se la libreria si e' accesa o no, e quale delle
  // condizioni manca. Non finira' mai su master: e' impalcatura della prova.
  const [diag, setDiag] = useState<string | null>(null);

  useEffect(() => {
    let annullato = false;

    // Import dinamico: il pacchetto registra un custom element toccando `window`,
    // quindi non puo' essere importato durante il render lato server.
    import("@khmyznikov/pwa-install").then(() => {
      if (annullato) return;
      const el = ref.current;
      if (!el) return;

      // Apertura automatica: solo Android, una volta sola. Su iPhone mai.
      if (!el.isAppleMobilePlatform && !el.isUnderStandaloneMode) {
        let gia = false;
        try {
          gia = localStorage.getItem(DISMISS_KEY) === "1";
        } catch {
          // Safari in navigazione privata puo' negare localStorage: in dubbio
          // NON apriamo, perche' una guida che ricompare a ogni avvio e' peggio
          // di una guida che non si apre da sola (il footer resta comunque).
          gia = true;
        }
        if (!gia) el.showDialog();
      }
    });

    const mostraDiagnostica = () => {
      const el = ref.current;
      if (!el) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") !== "1") return;
      setDiag(
        `apple=${el.isAppleMobilePlatform} · installabile=${el.isInstallAvailable} · ` +
          `standalone=${el.isUnderStandaloneMode} · touch=${navigator.maxTouchPoints} · ` +
          `sw=${"serviceWorker" in navigator} · lingua=${navigator.language}`,
      );
    };
    const apri = () => {
      ref.current?.showDialog(true);
      mostraDiagnostica();
    };
    window.addEventListener("blasat:show-onboarding", apri);

    // Quando l'utente chiude, segniamo la stessa chiave del componente storico.
    const chiusa = () => {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* niente da fare: la prossima volta si riapre, e va bene cosi' */
      }
    };
    window.addEventListener("pwa-user-choice-result-event", chiusa);

    return () => {
      annullato = true;
      window.removeEventListener("blasat:show-onboarding", apri);
      window.removeEventListener("pwa-user-choice-result-event", chiusa);
    };
  }, []);

  return (
    <>
      {diag ? (
        <div
          style={{
            position: "fixed",
            left: 8,
            right: 8,
            bottom: 8,
            zIndex: 2147483647,
            background: "#0a2444",
            color: "#f4f1ea",
            font: "500 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
            padding: "8px 10px",
            borderRadius: 10,
            wordBreak: "break-word",
          }}
        >
          prova libreria · {diag}
        </div>
      ) : null}
      <pwa-install
      ref={ref}
      manual-apple="true"
      manual-chrome="true"
      name={appName}
      description="Aggiungi il concierge del Grand Hotel alla schermata Home: si apre come un'app, anche senza rete."
      install-description="Installa il concierge per averlo sempre a portata di pollice"
        manifest-url="/manifest.json"
      />
    </>
  );
}
