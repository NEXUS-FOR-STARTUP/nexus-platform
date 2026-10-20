"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/pricing";

const COUNT_UP_MS = 900;
const VISIBLE_RATIO = 0.6;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface CountUpProps {
  value: number;
}

/** Renders `value` as a VND price; once it scrolls into view the number counts up from 0 a single time. */
export default function CountUp({ value }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const finalText = formatPrice(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / COUNT_UP_MS, 1);
          setShown(Math.round(value * (1 - (1 - t) ** 3)));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        setShown(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: VISIBLE_RATIO },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  // Hidden copy of the final text reserves the exact width so the label does not slide while counting.
  return (
    <span ref={ref} style={{ display: "inline-grid", fontVariantNumeric: "tabular-nums" }}>
      <span aria-hidden="true" style={{ gridArea: "1 / 1", visibility: "hidden" }}>{finalText}</span>
      <span style={{ gridArea: "1 / 1" }}>{formatPrice(shown)}</span>
    </span>
  );
}
