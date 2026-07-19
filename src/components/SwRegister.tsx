"use client";

import { useEffect } from "react";

/**
 * Registra il Service Worker (public/sw.js) al caricamento dell'app,
 * indipendentemente dall'opt-in alle push notification.
 * Abilita l'offline fallback (cache shell + asset) per tutta la PWA.
 */
export default function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // Registrazione fallita (es. browser non supportato): nessun impatto,
        // l'app funziona comunque online.
      });
  }, []);

  return null;
}
