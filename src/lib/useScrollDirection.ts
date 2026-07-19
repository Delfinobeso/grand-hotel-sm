"use client";

import { useEffect, useRef, useState } from "react";

/** Tracks scroll direction to drive show/hide UI (FAB, floating controls).
 *
 * The app's tabs each render their own `<main>` that scrolls independently, and
 * the active one changes at runtime — wiring a listener per section would mean
 * re-attaching it on every tab switch. Instead this listens once on `window` in
 * the capture phase, so it catches the `scroll` event from whichever element is
 * actually scrolling (scroll events don't bubble, only capture reaches ancestors).
 * A per-element WeakMap remembers each target's last scrollTop, so switching tabs
 * (and therefore switching which element is scrolling) never produces a bogus
 * delta from a stale reading of a different element. */
export function useScrollDirection(threshold = 8, topThreshold = 40) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(new WeakMap<Element, number>());

  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const y = target.scrollTop;
      const prev = lastY.current.get(target) ?? 0;
      const delta = y - prev;

      if (y < topThreshold) {
        setHidden(false);
      } else if (delta > threshold) {
        setHidden(true);
      } else if (delta < -threshold) {
        setHidden(false);
      }

      lastY.current.set(target, y);
    };

    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [threshold, topThreshold]);

  return hidden;
}
