"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Sequence: enter (600ms) → hold (1400ms) → exit (400ms) → unmount
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => setVisible(false), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  // Skip splash if returning user (has visited before)
  // We let it play on every cold open for brand impact

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a2444]"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1)",
        pointerEvents: phase === "exit" ? "none" : "auto",
        willChange: "opacity",
      }}
    >
      {/* Anello decorativo */}
      <div
        className="absolute w-48 h-48 rounded-full border border-white/10"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.6)" : "scale(1)",
          transition: "opacity 500ms ease-out, transform 600ms cubic-bezier(0.25, 1, 0.5, 1)",
          willChange: "transform, opacity",
        }}
      />

      {/* Logo */}
      <div
        className="relative z-10"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(12px)" : "translateY(0)",
          transition: "opacity 500ms ease-out 200ms, transform 500ms cubic-bezier(0.25, 1, 0.5, 1) 200ms",
          willChange: "transform, opacity",
        }}
      >
        <img
          src="/icon.svg"
          alt="Grand Hotel San Marino"
          className="w-24 h-24 drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          style={{
            filter: "brightness(0) invert(1)",
          }}
        />
      </div>

      {/* Nome */}
      <div
        className="relative z-10 mt-10 text-center"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 500ms ease-out 400ms, transform 500ms cubic-bezier(0.25, 1, 0.5, 1) 400ms",
          willChange: "transform, opacity",
        }}
      >
        <p
          className="text-[11px] tracking-[0.25em] uppercase text-white/50 mb-2 font-medium"
        >
          Benvenuti al
        </p>
        <h1
          className="text-xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "ui-serif, Georgia, 'New York', serif" }}
        >
          Grand Hotel
          <br />
          San Marino
        </h1>
      </div>

      {/* Linea decorativa inferiore */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 h-px bg-white/20"
        style={{
          width: phase === "enter" ? "0px" : "40px",
          transition: "width 700ms cubic-bezier(0.25, 1, 0.5, 1) 600ms",
          willChange: "width",
        }}
      />
    </div>
  );
}
