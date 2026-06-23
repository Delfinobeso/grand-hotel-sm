"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger entrance on next frame for CSS transition
    requestAnimationFrame(() => setShow(true));

    // Exit after hold
    const t1 = setTimeout(() => setShow(false), 2000);
    const t2 = setTimeout(() => setVisible(false), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0a2444]"
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1)",
        pointerEvents: show ? "auto" : "none",
        willChange: "opacity",
      }}
    >
      <img
        src="/brand/logo-full.svg"
        alt="Grand Hotel San Marino"
        className="w-36 h-36"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(0.92)",
          transition: "opacity 600ms cubic-bezier(0.25, 1, 0.5, 1) 100ms, transform 600ms cubic-bezier(0.25, 1, 0.5, 1) 100ms",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
