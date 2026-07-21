"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Onboarding "Aggiungi alla schermata Home" per le PWA Blasat (iOS Safari + Android Chrome).
 *
 * - iOS: non esiste un prompt nativo installabile via JS, quindi mostriamo una guida
 *   passo-passo fedele al percorso reale di Safari (foglio di condivisione in vetro
 *   scuro → "Visualizza altro" → "Aggiungi alla schermata Home" → schermata di conferma).
 * - Android: se il browser espone `beforeinstallprompt` usiamo il prompt nativo reale
 *   (molto più affidabile di una ricostruzione finta); altrimenti mostriamo un fallback
 *   testuale che spiega come farlo dal menu di Chrome.
 *
 * Mostrata automaticamente una sola volta (persistenza in localStorage), riapribile in
 * qualunque momento da un link nel footer tramite l'evento custom `blasat:show-onboarding`.
 */

const DISMISS_KEY = "blasat-onboarding-dismissed-v1";
const ANDROID_PROMPT_TIMEOUT_MS = 1500;

type Lang = "it" | "en" | "fr" | "de" | "es";
type Platform = "ios" | "android";
type AndroidMode = "waiting" | "native" | "fallback";

const SUPPORTED_LANGS: Lang[] = ["it", "en", "fr", "de", "es"];

// beforeinstallprompt non è (ancora) nei tipi standard di lib.dom.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface IosStepCopy {
  title: string;
  body: string;
}

interface IosSystemCopy {
  copy: string;
  addToFavorites: string;
  more: string;
  addToHomeScreen: string;
  addBookmark: string;
  findOnPage: string;
  addToHomeTitle: string;
  addButton: string;
  openAsWebApp: string;
}

interface LangCopy {
  overlayTitle: string;
  ios: { steps: [IosStepCopy, IosStepCopy, IosStepCopy, IosStepCopy, IosStepCopy]; system: IosSystemCopy };
  android: {
    nativeTitle: string;
    nativeBody: string;
    fallbackTitle: string;
    fallbackBody: string;
    installNow: string;
  };
  buttons: {
    next: string;
    back: string;
    skip: string;
    done: string;
    close: string;
  };
}

const COPY: Record<Lang, LangCopy> = {
  it: {
    overlayTitle: "Installa l'app",
    ios: {
      steps: [
        {
          title: "Apri il menu Condividi",
          body: "Nella barra in basso di Safari, tocca l'icona Condividi (il riquadro con la freccia verso l'alto).",
        },
        {
          title: "Scorri fino a “Visualizza altro”",
          body: "Si apre un foglio dal basso. Tocca “Visualizza altro” per vedere tutte le opzioni disponibili.",
        },
        {
          title: "Tocca “Aggiungi alla schermata Home”",
          body: "Nella lista espansa trovi la voce con l'icona a forma di quadrato con il segno più.",
        },
        {
          title: "Conferma con “Aggiungi”",
          body: "Puoi modificare il nome se vuoi. Tocca il pulsante blu “Aggiungi” in alto a destra.",
        },
        {
          title: "Fatto!",
          body: "L'icona dell'app è ora sulla tua schermata Home, pronta per l'uso come un'app vera.",
        },
      ],
      system: {
        copy: "Copia",
        addToFavorites: "Aggiungi ai Preferiti",
        more: "Visualizza altro",
        addToHomeScreen: "Aggiungi alla schermata Home",
        addBookmark: "Segnalibro preferiti",
        findOnPage: "Trova nella pagina",
        addToHomeTitle: "Aggiungi a Home",
        addButton: "Aggiungi",
        openAsWebApp: "Apri come app web",
      },
    },
    android: {
      nativeTitle: "Installa l'app",
      nativeBody: "Puoi aggiungere l'app alla schermata Home in un tocco, tramite Chrome.",
      fallbackTitle: "Installa l'app",
      fallbackBody: "Apri il menu di Chrome (⋮ in alto a destra) e tocca “Installa app” oppure “Aggiungi a schermata Home”.",
      installNow: "Installa ora",
    },
    buttons: { next: "Avanti", back: "Indietro", skip: "Salta", done: "Fatto", close: "Chiudi" },
  },
  en: {
    overlayTitle: "Install the app",
    ios: {
      steps: [
        {
          title: "Open the Share menu",
          body: "In Safari's bottom bar, tap the Share icon (the square with an arrow pointing up).",
        },
        {
          title: "Scroll to “More”",
          body: "A sheet opens from the bottom. Tap “More” to see every option available.",
        },
        {
          title: "Tap “Add to Home Screen”",
          body: "In the expanded list you'll find the option with a plus-sign square icon.",
        },
        {
          title: "Confirm with “Add”",
          body: "You can edit the name if you like. Tap the blue “Add” button in the top right.",
        },
        {
          title: "All done!",
          body: "The app icon is now on your Home Screen, ready to use like a real app.",
        },
      ],
      system: {
        copy: "Copy",
        addToFavorites: "Add to Favorites",
        more: "More",
        addToHomeScreen: "Add to Home Screen",
        addBookmark: "Add Bookmark",
        findOnPage: "Find on Page",
        addToHomeTitle: "Add to Home Screen",
        addButton: "Add",
        openAsWebApp: "Open as Web App",
      },
    },
    android: {
      nativeTitle: "Install the app",
      nativeBody: "You can add the app to your Home Screen in one tap, via Chrome.",
      fallbackTitle: "Install the app",
      fallbackBody: "Open Chrome's menu (⋮ top right) and tap “Install app” or “Add to Home screen”.",
      installNow: "Install now",
    },
    buttons: { next: "Next", back: "Back", skip: "Skip", done: "Done", close: "Close" },
  },
  fr: {
    overlayTitle: "Installer l'application",
    ios: {
      steps: [
        {
          title: "Ouvrez le menu Partager",
          body: "Dans la barre du bas de Safari, touchez l'icône Partager (le carré avec une flèche vers le haut).",
        },
        {
          title: "Faites défiler jusqu'à “Plus”",
          body: "Une feuille s'ouvre depuis le bas. Touchez “Plus” pour voir toutes les options disponibles.",
        },
        {
          title: "Touchez “Sur l'écran d'accueil”",
          body: "Dans la liste développée, trouvez l'option avec l'icône carré et signe plus.",
        },
        {
          title: "Confirmez avec “Ajouter”",
          body: "Vous pouvez modifier le nom si vous le souhaitez. Touchez le bouton bleu “Ajouter” en haut à droite.",
        },
        {
          title: "C'est fait !",
          body: "L'icône de l'application est maintenant sur votre écran d'accueil, prête à l'emploi comme une vraie app.",
        },
      ],
      system: {
        copy: "Copier",
        addToFavorites: "Ajouter aux Favoris",
        more: "Plus",
        addToHomeScreen: "Sur l'écran d'accueil",
        addBookmark: "Ajouter aux Signets",
        findOnPage: "Rechercher dans la page",
        addToHomeTitle: "Sur l'écran d'accueil",
        addButton: "Ajouter",
        openAsWebApp: "Ouvrir comme appli web",
      },
    },
    android: {
      nativeTitle: "Installer l'application",
      nativeBody: "Vous pouvez ajouter l'application à l'écran d'accueil en un geste, via Chrome.",
      fallbackTitle: "Installer l'application",
      fallbackBody: "Ouvrez le menu de Chrome (⋮ en haut à droite) et touchez “Installer l'application” ou “Ajouter à l'écran d'accueil”.",
      installNow: "Installer maintenant",
    },
    buttons: { next: "Suivant", back: "Retour", skip: "Passer", done: "Terminé", close: "Fermer" },
  },
  de: {
    overlayTitle: "App installieren",
    ios: {
      steps: [
        {
          title: "Öffne das Teilen-Menü",
          body: "Tippe in der unteren Leiste von Safari auf das Teilen-Symbol (das Quadrat mit dem Pfeil nach oben).",
        },
        {
          title: "Scrolle zu “Mehr”",
          body: "Ein Fenster öffnet sich von unten. Tippe auf “Mehr”, um alle verfügbaren Optionen zu sehen.",
        },
        {
          title: "Tippe auf “Zum Home-Bildschirm”",
          body: "In der erweiterten Liste findest du die Option mit dem Quadrat-Plus-Symbol.",
        },
        {
          title: "Bestätige mit “Hinzufügen”",
          body: "Du kannst den Namen bei Bedarf ändern. Tippe oben rechts auf den blauen Button “Hinzufügen”.",
        },
        {
          title: "Geschafft!",
          body: "Das App-Symbol ist jetzt auf deinem Home-Bildschirm und einsatzbereit wie eine echte App.",
        },
      ],
      system: {
        copy: "Kopieren",
        addToFavorites: "Zu Favoriten hinzufügen",
        more: "Mehr",
        addToHomeScreen: "Zum Home-Bildschirm",
        addBookmark: "Lesezeichen hinzufügen",
        findOnPage: "Auf Seite suchen",
        addToHomeTitle: "Zum Home-Bildschirm",
        addButton: "Hinzufügen",
        openAsWebApp: "Als Web-App öffnen",
      },
    },
    android: {
      nativeTitle: "App installieren",
      nativeBody: "Du kannst die App mit einem Tipp über Chrome zum Home-Bildschirm hinzufügen.",
      fallbackTitle: "App installieren",
      fallbackBody: "Öffne das Chrome-Menü (⋮ oben rechts) und tippe auf “App installieren” oder “Zum Startbildschirm hinzufügen”.",
      installNow: "Jetzt installieren",
    },
    buttons: { next: "Weiter", back: "Zurück", skip: "Überspringen", done: "Fertig", close: "Schließen" },
  },
  es: {
    overlayTitle: "Instala la app",
    ios: {
      steps: [
        {
          title: "Abre el menú Compartir",
          body: "En la barra inferior de Safari, toca el icono Compartir (el cuadrado con la flecha hacia arriba).",
        },
        {
          title: "Desplázate hasta “Más”",
          body: "Se abre una hoja desde abajo. Toca “Más” para ver todas las opciones disponibles.",
        },
        {
          title: "Toca “Añadir a pantalla de inicio”",
          body: "En la lista ampliada encontrarás la opción con el icono de cuadrado y signo más.",
        },
        {
          title: "Confirma con “Añadir”",
          body: "Puedes editar el nombre si quieres. Toca el botón azul “Añadir” arriba a la derecha.",
        },
        {
          title: "¡Listo!",
          body: "El icono de la app ya está en tu pantalla de inicio, lista para usarse como una app real.",
        },
      ],
      system: {
        copy: "Copiar",
        addToFavorites: "Añadir a Favoritos",
        more: "Más",
        addToHomeScreen: "Añadir a pantalla de inicio",
        addBookmark: "Añadir marcador",
        findOnPage: "Buscar en la página",
        addToHomeTitle: "Añadir a pantalla de inicio",
        addButton: "Añadir",
        openAsWebApp: "Abrir como app web",
      },
    },
    android: {
      nativeTitle: "Instala la app",
      nativeBody: "Puedes añadir la app a la pantalla de inicio con un toque, mediante Chrome.",
      fallbackTitle: "Instala la app",
      fallbackBody: "Abre el menú de Chrome (⋮ arriba a la derecha) y toca “Instalar app” o “Añadir a pantalla de inicio”.",
      installNow: "Instalar ahora",
    },
    buttons: { next: "Siguiente", back: "Atrás", skip: "Omitir", done: "Listo", close: "Cerrar" },
  },
};

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "it";
  const short = (navigator.language || "it").slice(0, 2).toLowerCase() as Lang;
  return SUPPORTED_LANGS.includes(short) ? short : "it";
}

function detectPlatform(): Platform | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return null;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** Icona app quadrata arrotondata con iniziale, colorata col brand dell'hotel corrente. */
function AppIconGlyph({ appName, size }: { appName: string; size: number }) {
  const initial = appName.trim().charAt(0).toUpperCase() || "H";
  return (
    <div
      className="blasat-onboard-appicon"
      style={{ width: size, height: size, fontSize: size * 0.44 }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

function IosStepMockup({
  step,
  appName,
  system,
  stepImages,
}: {
  step: number;
  appName: string;
  system: IosSystemCopy;
  stepImages?: (string | undefined)[];
}) {
  const realImage = stepImages?.[step];
  if (realImage) {
    // Screenshot reale (con evidenziazione) al posto della ricostruzione CSS —
    // usato quando disponibile per quell'hotel specifico (vedi prop stepImages).
    return (
      <div className="blasat-onboard-mock blasat-onboard-mock--photo">
        <img src={realImage} alt="" aria-hidden="true" className="blasat-onboard-mock-photo" />
      </div>
    );
  }
  switch (step) {
    case 0:
      // Step 1: barra Safari in basso con l'icona Condividi evidenziata.
      return (
        <div className="blasat-onboard-mock blasat-onboard-mock--safaribar">
          <div className="blasat-onboard-safaribar">
            <div className="blasat-onboard-safaribar-icon" aria-hidden="true">
              ↩
            </div>
            <div className="blasat-onboard-safaribar-icon blasat-onboard-safaribar-icon--target" aria-hidden="true">
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                <path d="M10 1v14M4 7l6-6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1" y="16" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <div className="blasat-onboard-safaribar-icon" aria-hidden="true">
              ⧉
            </div>
            <div className="blasat-onboard-safaribar-icon" aria-hidden="true">
              ▤
            </div>
          </div>
        </div>
      );
    case 1:
      // Step 2: foglio di condivisione scuro con riga "Visualizza altro" evidenziata.
      return (
        <div className="blasat-onboard-mock blasat-onboard-mock--sheet">
          <div className="blasat-onboard-sheet">
            <div className="blasat-onboard-sheet-grabber" />
            <div className="blasat-onboard-sheet-apps">
              <div className="blasat-onboard-sheet-app" />
              <div className="blasat-onboard-sheet-app" />
              <div className="blasat-onboard-sheet-app" />
              <div className="blasat-onboard-sheet-app" />
            </div>
            <div className="blasat-onboard-sheet-row">
              <span>{system.copy}</span>
            </div>
            <div className="blasat-onboard-sheet-row">
              <span>{system.addToFavorites}</span>
            </div>
            <div className="blasat-onboard-sheet-row blasat-onboard-sheet-row--target">
              <span>{system.more}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="6.3" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4.5 6l2.5 2.5L9.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 2:
      // Step 3: lista espansa con "Aggiungi alla schermata Home" evidenziata.
      return (
        <div className="blasat-onboard-mock blasat-onboard-mock--sheet">
          <div className="blasat-onboard-sheet">
            <div className="blasat-onboard-sheet-grabber" />
            <div className="blasat-onboard-sheet-row">
              <span>{system.addBookmark}</span>
            </div>
            <div className="blasat-onboard-sheet-row blasat-onboard-sheet-row--target">
              <span className="blasat-onboard-sheet-row-icon">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M7.5 4.5v6M4.5 7.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
              <span>{system.addToHomeScreen}</span>
            </div>
            <div className="blasat-onboard-sheet-row">
              <span>{system.findOnPage}</span>
            </div>
          </div>
        </div>
      );
    case 3:
      // Step 4: schermata a tutto schermo "Aggiungi a Home".
      return (
        <div className="blasat-onboard-mock blasat-onboard-mock--full">
          <div className="blasat-onboard-fullscreen">
            <div className="blasat-onboard-fullscreen-topbar">
              <span aria-hidden="true">✕</span>
              <span className="blasat-onboard-fullscreen-title">{system.addToHomeTitle}</span>
              <span className="blasat-onboard-fullscreen-add">{system.addButton}</span>
            </div>
            <div className="blasat-onboard-fullscreen-body">
              <AppIconGlyph appName={appName} size={52} />
              <div className="blasat-onboard-fullscreen-name">{appName}</div>
              <div className="blasat-onboard-fullscreen-url">blasat.com</div>
              <div className="blasat-onboard-fullscreen-toggle">
                <span>{system.openAsWebApp}</span>
                <span className="blasat-onboard-toggle-pill" aria-hidden="true">
                  <span className="blasat-onboard-toggle-knob" />
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    case 4:
    default:
      // Step 5: icona sulla Home.
      return (
        <div className="blasat-onboard-mock blasat-onboard-mock--home">
          <div className="blasat-onboard-homegrid">
            <div className="blasat-onboard-homeslot" />
            <div className="blasat-onboard-homeslot" />
            <div className="blasat-onboard-homeslot blasat-onboard-homeslot--new">
              <AppIconGlyph appName={appName} size={44} />
              <span className="blasat-onboard-homecheck" aria-hidden="true">
                ✓
              </span>
            </div>
            <div className="blasat-onboard-homeslot" />
          </div>
        </div>
      );
  }
}

export default function InstallOnboarding({
  appName,
  stepImages,
}: {
  appName: string;
  /** Screenshot reali (index 0-4) da usare al posto dei mockup CSS generici, per hotel. */
  stepImages?: (string | undefined)[];
}) {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [lang, setLang] = useState<Lang>("it");
  const [step, setStep] = useState(0);
  const [androidMode, setAndroidMode] = useState<AndroidMode>("waiting");

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const standaloneRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const copy = COPY[lang];

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // storage non disponibile (es. modalità privata): nessun impatto funzionale.
    }
  }, []);

  // Setup iniziale: standalone check, piattaforma, lingua, mostra automaticamente se opportuno.
  // Va letto da window/navigator (non disponibili in SSR), quindi solo al mount lato client.
  useEffect(() => {
    standaloneRef.current = isStandaloneDisplay();
    const detectedPlatform = detectPlatform();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(detectedPlatform);
    setLang(detectLang());

    if (standaloneRef.current || !detectedPlatform) return;

    let alreadyDismissed = false;
    try {
      alreadyDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      alreadyDismissed = false;
    }
    if (!alreadyDismissed) {
      setStep(0);
      setVisible(true);
    }
  }, []);

  // Cattura beforeinstallprompt (Android/Chrome) per usare il prompt nativo reale.
  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setAndroidMode((current) => (current === "waiting" ? "native" : current));
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Riapertura manuale (link nel footer): resetta lo step e ignora il dismiss precedente.
  useEffect(() => {
    function handleShowOnboarding() {
      if (standaloneRef.current) return;
      const detectedPlatform = platform ?? detectPlatform();
      if (!detectedPlatform) return;
      setPlatform(detectedPlatform);
      setAndroidMode(deferredPromptRef.current ? "native" : "waiting");
      setStep(0);
      setVisible(true);
    }
    window.addEventListener("blasat:show-onboarding", handleShowOnboarding);
    return () => window.removeEventListener("blasat:show-onboarding", handleShowOnboarding);
  }, [platform]);

  // Chiusura con Escape.
  useEffect(() => {
    if (!visible) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, dismiss]);

  // Focus al pulsante di chiusura quando l'overlay appare (accessibilità tastiera).
  useEffect(() => {
    if (visible) closeButtonRef.current?.focus();
  }, [visible]);

  // Flusso Android: prompt nativo se già catturato, altrimenti attesa breve poi fallback.
  useEffect(() => {
    if (!visible || platform !== "android") return;
    if (deferredPromptRef.current) {
      setAndroidMode("native");
      return;
    }
    setAndroidMode("waiting");
    const timer = setTimeout(() => {
      setAndroidMode(deferredPromptRef.current ? "native" : "fallback");
    }, ANDROID_PROMPT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [visible, platform]);

  const handleInstallNow = useCallback(async () => {
    const event = deferredPromptRef.current;
    if (!event) return;
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // L'utente ha annullato o il prompt non è più disponibile: nessun impatto.
    }
    deferredPromptRef.current = null;
    dismiss();
  }, [dismiss]);

  if (!visible || !platform) return null;

  const totalSteps = copy.ios.steps.length;
  const goNext = () => setStep((current) => Math.min(current + 1, totalSteps - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));
  const isLastStep = step === totalSteps - 1;

  return (
    <div
      className="blasat-onboard-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={copy.overlayTitle}
    >
      <div className="blasat-onboard-panel">
        <button
          ref={closeButtonRef}
          type="button"
          className="blasat-onboard-close"
          onClick={dismiss}
          aria-label={copy.buttons.close}
        >
          ✕
        </button>

        <h2 className="blasat-onboard-title">{copy.overlayTitle}</h2>

        {platform === "ios" ? (
          <>
            <div className="blasat-onboard-stepbody">
              <IosStepMockup step={step} appName={appName} system={copy.ios.system} stepImages={stepImages} />
              <h3 className="blasat-onboard-steptitle">{copy.ios.steps[step].title}</h3>
              <p className="blasat-onboard-steptext">{copy.ios.steps[step].body}</p>
            </div>

            <div className="blasat-onboard-dots" role="tablist" aria-label={copy.overlayTitle}>
              {copy.ios.steps.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  aria-label={`${i + 1}/${totalSteps}`}
                  className={`blasat-onboard-dot${i === step ? " blasat-onboard-dot--active" : ""}`}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>

            <div className="blasat-onboard-actions">
              <button
                type="button"
                className="blasat-onboard-btn blasat-onboard-btn--ghost"
                onClick={step === 0 ? dismiss : goBack}
              >
                {step === 0 ? copy.buttons.skip : copy.buttons.back}
              </button>
              <button
                type="button"
                className="blasat-onboard-btn blasat-onboard-btn--primary"
                onClick={isLastStep ? dismiss : goNext}
              >
                {isLastStep ? copy.buttons.done : copy.buttons.next}
              </button>
            </div>
          </>
        ) : (
          <div className="blasat-onboard-stepbody">
            {androidMode === "native" && (
              <>
                <AppIconGlyph appName={appName} size={56} />
                <h3 className="blasat-onboard-steptitle">{copy.android.nativeTitle}</h3>
                <p className="blasat-onboard-steptext">{copy.android.nativeBody}</p>
                <button
                  type="button"
                  className="blasat-onboard-btn blasat-onboard-btn--primary blasat-onboard-btn--wide"
                  onClick={handleInstallNow}
                >
                  {copy.android.installNow}
                </button>
              </>
            )}
            {androidMode === "waiting" && (
              <div className="blasat-onboard-waiting" aria-hidden="true">
                <span className="blasat-onboard-waiting-dot" />
                <span className="blasat-onboard-waiting-dot" />
                <span className="blasat-onboard-waiting-dot" />
              </div>
            )}
            {androidMode === "fallback" && (
              <>
                <div className="blasat-onboard-mock blasat-onboard-mock--menu" aria-hidden="true">
                  <span className="blasat-onboard-menu-dots">⋮</span>
                </div>
                <h3 className="blasat-onboard-steptitle">{copy.android.fallbackTitle}</h3>
                <p className="blasat-onboard-steptext">{copy.android.fallbackBody}</p>
              </>
            )}
            {androidMode !== "waiting" && (
              <div className="blasat-onboard-actions blasat-onboard-actions--single">
                <button type="button" className="blasat-onboard-btn blasat-onboard-btn--ghost" onClick={dismiss}>
                  {copy.buttons.done}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .blasat-onboard-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: color-mix(in oklch, var(--color-bg) 55%, transparent);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 0;
          animation: blasat-onboard-fade-in 0.22s var(--ease-out, ease-out);
        }
        @media (min-width: 640px) {
          .blasat-onboard-overlay {
            align-items: center;
            padding: 24px;
          }
        }
        @keyframes blasat-onboard-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .blasat-onboard-panel {
          position: relative;
          width: 100%;
          max-width: 420px;
          max-height: 92vh;
          overflow-y: auto;
          background: var(--color-surface);
          color: var(--color-text);
          border-radius: 24px 24px 0 0;
          padding: 28px 22px calc(22px + env(safe-area-inset-bottom));
          box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.25);
          font-family: inherit;
          animation: blasat-onboard-slide-up 0.28s var(--ease-out, ease-out);
        }
        @media (min-width: 640px) {
          .blasat-onboard-panel {
            border-radius: 24px;
            padding: 28px 26px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          }
        }
        @keyframes blasat-onboard-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .blasat-onboard-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: none;
          background: var(--color-surface-muted);
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          line-height: 1;
          cursor: pointer;
        }

        .blasat-onboard-title {
          margin: 0 0 18px;
          padding-right: 36px;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-text);
        }

        .blasat-onboard-stepbody {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          min-height: 260px;
        }

        .blasat-onboard-steptitle {
          margin: 14px 0 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text);
        }
        .blasat-onboard-steptext {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.45;
          color: var(--color-text-secondary);
          max-width: 30ch;
        }

        .blasat-onboard-dots {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin: 18px 0 4px;
        }
        .blasat-onboard-dot {
          width: 7px;
          height: 7px;
          padding: 0;
          border: none;
          border-radius: 999px;
          background: var(--color-border);
          cursor: pointer;
          transition: background-color 0.2s var(--ease-out, ease-out), transform 0.2s var(--ease-out, ease-out);
        }
        .blasat-onboard-dot--active {
          background: var(--color-accent);
          transform: scale(1.3);
        }

        .blasat-onboard-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        .blasat-onboard-actions--single {
          justify-content: center;
        }
        .blasat-onboard-btn {
          flex: 1;
          min-height: 46px;
          border-radius: 14px;
          border: none;
          font-size: 0.92rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
        }
        .blasat-onboard-btn--wide {
          flex: none;
          width: 100%;
          margin-top: 16px;
        }
        .blasat-onboard-btn--primary {
          background: var(--color-accent);
          color: var(--color-on-accent);
        }
        .blasat-onboard-btn--ghost {
          background: var(--color-surface-muted);
          color: var(--color-text-secondary);
        }

        .blasat-onboard-appicon {
          border-radius: 22%;
          background: var(--color-accent);
          color: var(--color-on-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          flex-shrink: 0;
        }

        /* ── Mockup UI di sistema iOS/Android: palette fissa, MAI il brand ── */
        .blasat-onboard-mock {
          width: 100%;
          display: flex;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .blasat-onboard-mock--photo {
          padding: 4px 0;
        }
        .blasat-onboard-mock-photo {
          width: 100%;
          max-width: 320px;
          height: auto;
          display: block;
        }

        .blasat-onboard-safaribar {
          width: 100%;
          max-width: 280px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 14px 10px;
          border-radius: 16px;
          background: rgba(30, 30, 32, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: rgba(255, 255, 255, 0.55);
        }
        .blasat-onboard-safaribar-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .blasat-onboard-safaribar-icon--target {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.7);
        }

        .blasat-onboard-sheet {
          width: 100%;
          max-width: 280px;
          border-radius: 18px;
          background: rgba(30, 30, 32, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 10px 6px 14px;
          color: rgba(255, 255, 255, 0.92);
        }
        .blasat-onboard-sheet-grabber {
          width: 34px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.28);
          margin: 0 auto 10px;
        }
        .blasat-onboard-sheet-apps {
          display: flex;
          gap: 8px;
          padding: 0 8px 10px;
        }
        .blasat-onboard-sheet-app {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.14);
        }
        .blasat-onboard-sheet-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 11px 12px;
          font-size: 0.84rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .blasat-onboard-sheet-row-icon {
          display: inline-flex;
          margin-right: 8px;
        }
        .blasat-onboard-sheet-row--target {
          color: #ffffff;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          box-shadow: inset 0 0 0 1.5px rgba(10, 132, 255, 0.6);
        }

        .blasat-onboard-fullscreen {
          width: 100%;
          max-width: 280px;
          border-radius: 18px;
          overflow: hidden;
          background: rgba(20, 20, 22, 0.97);
          color: #ffffff;
        }
        .blasat-onboard-fullscreen-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          font-size: 0.82rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .blasat-onboard-fullscreen-title {
          font-weight: 600;
        }
        .blasat-onboard-fullscreen-add {
          color: #0a84ff;
          font-weight: 700;
        }
        .blasat-onboard-fullscreen-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 18px 16px 20px;
        }
        .blasat-onboard-fullscreen-name {
          margin-top: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .blasat-onboard-fullscreen-url {
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .blasat-onboard-fullscreen-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.85);
        }
        .blasat-onboard-toggle-pill {
          width: 34px;
          height: 20px;
          border-radius: 999px;
          background: #30d158;
          display: inline-flex;
          align-items: center;
          padding: 2px;
        }
        .blasat-onboard-toggle-knob {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #ffffff;
          margin-left: auto;
        }

        .blasat-onboard-homegrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          width: 100%;
          max-width: 240px;
          padding: 10px;
        }
        .blasat-onboard-homeslot {
          position: relative;
          aspect-ratio: 1;
          border-radius: 22%;
          background: var(--color-surface-muted);
        }
        .blasat-onboard-homeslot--new {
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .blasat-onboard-homecheck {
          position: absolute;
          bottom: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #30d158;
          color: #ffffff;
          font-size: 0.65rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .blasat-onboard-mock--menu {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(30, 30, 32, 0.9);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .blasat-onboard-menu-dots {
          font-size: 1.1rem;
          line-height: 1;
        }

        .blasat-onboard-waiting {
          display: flex;
          gap: 6px;
          padding: 40px 0;
        }
        .blasat-onboard-waiting-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--color-accent);
          animation: blasat-onboard-pulse 1s ease-in-out infinite;
        }
        .blasat-onboard-waiting-dot:nth-child(2) { animation-delay: 0.15s; }
        .blasat-onboard-waiting-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes blasat-onboard-pulse {
          0%, 80%, 100% { opacity: 0.25; }
          40% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .blasat-onboard-overlay,
          .blasat-onboard-panel,
          .blasat-onboard-dot,
          .blasat-onboard-waiting-dot {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
