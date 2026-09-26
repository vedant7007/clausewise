"use client";

import { useEffect, useState } from "react";

const DURATION_MS = 700;

/**
 * Counts up to `value` once on mount. Renders the final value immediately when motion is
 * reduced or unsupported, so the number is always correct without animation.
 */
export function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const prefersMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (!prefersMotion) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{shown}</>;
}
