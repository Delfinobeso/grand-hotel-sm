"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PRIVACY_CONTENT } from "@/lib/privacyContent";
import { HOTEL } from "@/lib/hotel";
import type { Lang } from "@/lib/content";

/** Split the intro sentence on the {BLASAT} / {HOTEL} tokens and render those
 *  two parts in bold, keeping everything else as plain text. */
function renderIntro(template: string, hotelName: string) {
  const parts = template.split(/(\{BLASAT\}|\{HOTEL\})/g);
  return parts.map((part, i) => {
    if (part === "{BLASAT}") return <strong key={i}>Blasat</strong>;
    if (part === "{HOTEL}") return <strong key={i}>{hotelName}</strong>;
    return <span key={i}>{part}</span>;
  });
}

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>("it");

  // Stesso pattern di lettura lingua/tema usato in page.tsx: il THEME_SCRIPT
  // inline in layout.tsx ha già impostato data-theme su <html> pre-paint,
  // qui leggiamo solo la lingua salvata per localizzare i testi React.
  useEffect(() => {
    const storedLang = localStorage.getItem("lang");
    const validLangs: Lang[] = ["it", "en", "fr", "de", "es"];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(validLangs.includes(storedLang as Lang) ? (storedLang as Lang) : "it");
  }, []);

  const t = PRIVACY_CONTENT[lang];

  return (
    <div
      className="fixed inset-0 overflow-y-auto bg-[var(--color-bg)]"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="mx-auto min-h-full w-full max-w-2xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 py-3 text-[0.875rem] font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          {t.backLabel}
        </a>

        <h1 className="mt-4 text-[1.5rem] font-semibold leading-tight text-[var(--color-text)]">
          {t.heading}
        </h1>

        <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
          {renderIntro(t.intro, HOTEL.name)}
        </p>

        <h2 className="mt-8 text-[1.0625rem] font-semibold text-[var(--color-text)]">
          {t.dataHeading}
        </h2>
        <dl className="mt-3 space-y-4">
          {t.dataItems.map((item) => (
            <div key={item.label}>
              <dt className="text-[0.9rem] font-semibold text-[var(--color-text)]">{item.label}</dt>
              <dd className="mt-1 text-[0.9rem] leading-relaxed text-[var(--color-text-secondary)]">
                {item.text}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-[0.9rem] leading-relaxed text-[var(--color-text-secondary)]">
          {t.noAccountNote}
        </p>

        <h2 className="mt-8 text-[1.0625rem] font-semibold text-[var(--color-text)]">
          {t.rightsHeading}
        </h2>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-[var(--color-text-secondary)]">
          {t.rightsText}
        </p>

        <p className="mt-10 text-[0.8125rem] text-[var(--color-text-muted)]">{t.updated}</p>
      </div>
    </div>
  );
}
