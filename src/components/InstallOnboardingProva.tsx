"use client";

import { useEffect, useState } from "react";
import InstallOnboarding from "@/components/InstallOnboarding";
import InstallOnboardingLib from "@/components/InstallOnboardingLib";

/**
 * PROVA (branch prova/pwa-install-libreria) — interruttore per confrontare le due
 * guide "Aggiungi a Home" SULLO STESSO telefono, che e' l'unico confronto che
 * conta: la fedelta' di una guida a una schermata di sistema non si giudica da
 * uno screenshot su un monitor.
 *
 *   ?install=nuovo    -> la libreria @khmyznikov/pwa-install
 *   ?install=nostro   -> il nostro componente (predefinito)
 *
 * La scelta resta per tutta la visita (sessionStorage), cosi' si puo' girare per
 * il sito e riaprire la guida dal footer senza rimettere il parametro ogni volta.
 *
 * Questo file NON deve finire su master: e' l'impalcatura della prova. Se la
 * libreria vince, la sostituzione va fatta in /DATA/blasat-shared e propagata con
 * sync.sh --apply ai tre hotel, MAI modificando i file dentro i repo.
 */

const CHIAVE = "blasat-prova-install";

export default function InstallOnboardingProva(props: {
  appName: string;
  stepImages: string[];
}) {
  const [quale, setQuale] = useState<"nostro" | "nuovo" | null>(null);

  useEffect(() => {
    let scelta: "nostro" | "nuovo" = "nostro";
    try {
      const url = new URLSearchParams(window.location.search).get("install");
      if (url === "nuovo" || url === "nostro") {
        scelta = url;
        sessionStorage.setItem(CHIAVE, url);
      } else {
        const salvata = sessionStorage.getItem(CHIAVE);
        if (salvata === "nuovo" || salvata === "nostro") scelta = salvata;
      }
    } catch {
      /* niente sessionStorage: si resta sul nostro, che e' il comportamento di oggi */
    }
    setQuale(scelta);
  }, []);

  // Finche' non sappiamo quale mostrare non montiamo niente: montarle entrambe
  // significherebbe due componenti in ascolto sullo stesso evento del footer.
  if (quale === null) return null;
  return quale === "nuovo" ? (
    <InstallOnboardingLib appName={props.appName} />
  ) : (
    <InstallOnboarding appName={props.appName} stepImages={props.stepImages} />
  );
}
