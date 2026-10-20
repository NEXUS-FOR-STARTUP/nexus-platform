"use client";

import { useEffect, useRef } from "react";

/** Background video; stays on the poster frame when the user prefers reduced motion. */
export default function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.pause();
    }
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <video ref={ref} autoPlay muted loop playsInline preload="metadata" poster="/landing/hero-poster.jpg">
        <source src="/landing/hero-bg.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
