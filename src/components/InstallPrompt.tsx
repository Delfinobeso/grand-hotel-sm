"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Android: intercept beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: detect standalone mode
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    if (isIOS && !isStandalone) {
      // Show after first scroll or 3 seconds
      const timer = setTimeout(() => setShowIOS(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroid(false);
    }
    setDeferredPrompt(null);
  };

  if (dismissed || (!showAndroid && !showIOS)) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
        style={{ animation: "message-reveal 0.28s cubic-bezier(0.17, 0.17, 0, 1)" }}
        onClick={() => setDismissed(true)}
      />

      {/* iOS Prompt */}
      {showIOS && (
        <div
          className="fixed bottom-28 left-4 right-4 z-[10000] rounded-3xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl p-5 shadow-2xl"
          style={{ animation: "message-reveal 0.28s cubic-bezier(0.17, 0.17, 0, 1)" }}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#0a2444] flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="text-white"
              >
                <path
                  d="M16 4L28 12V28H20V18H12V28H4V12L16 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] text-[#0a2444] dark:text-white">
                Installa Grand Hotel SM
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                Tocca{" "}
                <svg
                  className="inline-block w-4 h-4 -mt-0.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ color: "#007AFF" }}
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>{" "}
                <strong>Condividi</strong> poi{" "}
                <strong>Aggiungi a Home</strong>
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
              }}
              className="shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Arrow pointing to share button */}
          <div className="flex justify-end mt-2">
            <svg
              width="40"
              height="30"
              viewBox="0 0 40 30"
              className="text-[#007AFF]"
            >
              <path
                d="M20 30L20 5M20 5L30 15M20 5L10 15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Android Prompt */}
      {showAndroid && (
        <div
          className="fixed bottom-28 left-4 right-4 z-[10000] rounded-3xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl p-5 shadow-2xl"
          style={{ animation: "message-reveal 0.28s cubic-bezier(0.17, 0.17, 0, 1)" }}
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#0a2444] flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="text-white"
              >
                <path
                  d="M16 4L28 12V28H20V18H12V28H4V12L16 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] text-[#0a2444] dark:text-white">
                Installa l&apos;app
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                Aggiungi alla schermata Home per un accesso rapido
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-[15px] font-medium text-gray-600 dark:text-gray-400"
            >
              Non ora
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 h-11 rounded-xl bg-[#0a2444] text-[15px] font-semibold text-white"
            >
              Installa
            </button>
          </div>
        </div>
      )}
    </>
  );
}
