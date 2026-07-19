import type { Lang } from "@/lib/content";

/**
 * Testi della pagina /privacy. Modulo separato da content.ts (che è enorme e
 * dedicato ai contenuti dell'hotel) per tenere l'informativa GDPR isolata e
 * facile da mantenere. Identico nei tre repo GHSM: {BLASAT} e {HOTEL} sono
 * placeholder sostituiti a runtime (in grassetto) dalla pagina che lo importa.
 */

export interface PrivacyDataItem {
  label: string;
  text: string;
}

export interface PrivacyContent {
  pageTitle: string;
  backLabel: string;
  heading: string;
  /** Frase introduttiva con i placeholder {BLASAT} e {HOTEL}. */
  intro: string;
  dataHeading: string;
  dataItems: PrivacyDataItem[];
  noAccountNote: string;
  rightsHeading: string;
  rightsText: string;
  updated: string;
}

export const PRIVACY_CONTENT: Record<Lang, PrivacyContent> = {
  it: {
    pageTitle: "Informativa Privacy",
    backLabel: "Indietro",
    heading: "Informativa Privacy",
    intro:
      "Questa applicazione è fornita da {BLASAT} (titolare del trattamento per la piattaforma — contatto: info@blasat.com) per conto di {HOTEL} (GHSM Group).",
    dataHeading: "Dati trattati",
    dataItems: [
      {
        label: "Assistente AI (concierge)",
        text: "I messaggi che scrivi in chat vengono inviati a un fornitore di intelligenza artificiale terzo (DeepSeek, con server anche al di fuori dell'UE) al solo scopo di generare la risposta. Non inserire dati personali sensibili (salute, documenti, pagamenti). La cronologia della conversazione resta nel tuo dispositivo.",
      },
      {
        label: "Statistiche d'uso",
        text: "Raccogliamo eventi anonimi e aggregati (apertura dell'app, sezioni visitate, pulsanti usati) su un sistema first-party (analytics.blasat.com), senza cookie di profilazione e senza identificarti.",
      },
      {
        label: "Notifiche push (solo se le attivi)",
        text: "Salviamo l'indirizzo tecnico della sottoscrizione push per inviarti le notifiche; puoi revocarla in ogni momento dalle impostazioni del dispositivo.",
      },
      {
        label: "Preferenze",
        text: "Tema e lingua sono salvati solo nel tuo dispositivo (localStorage).",
      },
    ],
    noAccountNote: "Nessun account, nessun cookie di terze parti, nessuna vendita di dati.",
    rightsHeading: "Diritti",
    rightsText:
      "Puoi esercitare i diritti previsti dal GDPR (accesso, rettifica, cancellazione, opposizione) scrivendo a info@blasat.com.",
    updated: "Ultimo aggiornamento: luglio 2026",
  },
  en: {
    pageTitle: "Privacy Policy",
    backLabel: "Back",
    heading: "Privacy Policy",
    intro:
      "This application is provided by {BLASAT} (data controller for the platform — contact: info@blasat.com) on behalf of {HOTEL} (GHSM Group).",
    dataHeading: "Data we process",
    dataItems: [
      {
        label: "AI assistant (concierge)",
        text: "The messages you write in chat are sent to a third-party artificial intelligence provider (DeepSeek, with servers also located outside the EU) solely to generate the reply. Please do not enter sensitive personal data (health, documents, payments). Your conversation history remains on your device.",
      },
      {
        label: "Usage statistics",
        text: "We collect anonymous, aggregated events (app opening, sections visited, buttons used) on a first-party system (analytics.blasat.com), without profiling cookies and without identifying you.",
      },
      {
        label: "Push notifications (only if you enable them)",
        text: "We store the technical push subscription address to send you notifications; you may revoke it at any time from your device settings.",
      },
      {
        label: "Preferences",
        text: "Theme and language are saved only on your device (localStorage).",
      },
    ],
    noAccountNote: "No account, no third-party cookies, no sale of data.",
    rightsHeading: "Your rights",
    rightsText:
      "You may exercise the rights provided by the GDPR (access, rectification, erasure, objection) by writing to info@blasat.com.",
    updated: "Last updated: July 2026",
  },
  fr: {
    pageTitle: "Politique de confidentialité",
    backLabel: "Retour",
    heading: "Politique de confidentialité",
    intro:
      "Cette application est fournie par {BLASAT} (responsable du traitement pour la plateforme — contact : info@blasat.com) pour le compte de {HOTEL} (GHSM Group).",
    dataHeading: "Données traitées",
    dataItems: [
      {
        label: "Assistant IA (concierge)",
        text: "Les messages que vous écrivez dans le chat sont envoyés à un fournisseur tiers d'intelligence artificielle (DeepSeek, avec des serveurs également situés hors UE) dans le seul but de générer la réponse. Ne saisissez pas de données personnelles sensibles (santé, documents, paiements). L'historique de la conversation reste sur votre appareil.",
      },
      {
        label: "Statistiques d'utilisation",
        text: "Nous collectons des événements anonymes et agrégés (ouverture de l'application, sections visitées, boutons utilisés) sur un système propriétaire (analytics.blasat.com), sans cookie de profilage et sans vous identifier.",
      },
      {
        label: "Notifications push (uniquement si vous les activez)",
        text: "Nous enregistrons l'adresse technique de l'abonnement push pour vous envoyer des notifications ; vous pouvez le révoquer à tout moment depuis les paramètres de votre appareil.",
      },
      {
        label: "Préférences",
        text: "Le thème et la langue sont enregistrés uniquement sur votre appareil (localStorage).",
      },
    ],
    noAccountNote: "Aucun compte, aucun cookie tiers, aucune vente de données.",
    rightsHeading: "Droits",
    rightsText:
      "Vous pouvez exercer les droits prévus par le RGPD (accès, rectification, effacement, opposition) en écrivant à info@blasat.com.",
    updated: "Dernière mise à jour : juillet 2026",
  },
  de: {
    pageTitle: "Datenschutzerklärung",
    backLabel: "Zurück",
    heading: "Datenschutzerklärung",
    intro:
      "Diese Anwendung wird von {BLASAT} (Verantwortlicher für die Plattform — Kontakt: info@blasat.com) im Auftrag von {HOTEL} (GHSM Group) bereitgestellt.",
    dataHeading: "Verarbeitete Daten",
    dataItems: [
      {
        label: "KI-Assistent (Concierge)",
        text: "Die Nachrichten, die Sie im Chat schreiben, werden ausschließlich zur Erzeugung der Antwort an einen externen Anbieter künstlicher Intelligenz (DeepSeek, mit Servern auch außerhalb der EU) gesendet. Geben Sie keine sensiblen personenbezogenen Daten ein (Gesundheit, Dokumente, Zahlungen). Der Gesprächsverlauf verbleibt auf Ihrem Gerät.",
      },
      {
        label: "Nutzungsstatistiken",
        text: "Wir erfassen anonyme, aggregierte Ereignisse (App-Öffnung, besuchte Bereiche, verwendete Schaltflächen) über ein First-Party-System (analytics.blasat.com), ohne Profiling-Cookies und ohne Sie zu identifizieren.",
      },
      {
        label: "Push-Benachrichtigungen (nur bei Aktivierung)",
        text: "Wir speichern die technische Adresse des Push-Abonnements, um Ihnen Benachrichtigungen zu senden; Sie können dies jederzeit in den Geräteeinstellungen widerrufen.",
      },
      {
        label: "Einstellungen",
        text: "Design und Sprache werden ausschließlich auf Ihrem Gerät gespeichert (localStorage).",
      },
    ],
    noAccountNote: "Kein Konto, keine Cookies von Drittanbietern, kein Verkauf von Daten.",
    rightsHeading: "Rechte",
    rightsText:
      "Sie können die im Rahmen der DSGVO vorgesehenen Rechte (Auskunft, Berichtigung, Löschung, Widerspruch) ausüben, indem Sie an info@blasat.com schreiben.",
    updated: "Letzte Aktualisierung: Juli 2026",
  },
  es: {
    pageTitle: "Política de privacidad",
    backLabel: "Atrás",
    heading: "Política de privacidad",
    intro:
      "Esta aplicación es proporcionada por {BLASAT} (responsable del tratamiento de la plataforma — contacto: info@blasat.com) en nombre de {HOTEL} (GHSM Group).",
    dataHeading: "Datos tratados",
    dataItems: [
      {
        label: "Asistente IA (concierge)",
        text: "Los mensajes que escribe en el chat se envían a un proveedor externo de inteligencia artificial (DeepSeek, con servidores también fuera de la UE) únicamente para generar la respuesta. No introduzca datos personales sensibles (salud, documentos, pagos). El historial de la conversación permanece en su dispositivo.",
      },
      {
        label: "Estadísticas de uso",
        text: "Recopilamos eventos anónimos y agregados (apertura de la aplicación, secciones visitadas, botones utilizados) en un sistema propio (analytics.blasat.com), sin cookies de perfilado y sin identificarle.",
      },
      {
        label: "Notificaciones push (solo si las activa)",
        text: "Guardamos la dirección técnica de la suscripción push para enviarle notificaciones; puede revocarla en cualquier momento desde los ajustes de su dispositivo.",
      },
      {
        label: "Preferencias",
        text: "El tema y el idioma se guardan únicamente en su dispositivo (localStorage).",
      },
    ],
    noAccountNote: "Sin cuenta, sin cookies de terceros, sin venta de datos.",
    rightsHeading: "Derechos",
    rightsText:
      "Puede ejercer los derechos previstos por el RGPD (acceso, rectificación, supresión, oposición) escribiendo a info@blasat.com.",
    updated: "Última actualización: julio 2026",
  },
};
