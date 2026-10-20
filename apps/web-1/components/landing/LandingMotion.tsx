"use client";

import { useEffect } from "react";

/** Blocks revealed on scroll: the direct children of every section's wrapper, hero excluded. */
const REVEAL_SELECTOR = "main > section:not(#top) > div > *";
/** Parents whose children reveal one after another instead of as one block. */
const STAGGER_SELECTOR = "[data-stagger]";
const REVEAL_ROOT_MARGIN = "0px 0px -12% 0px";
/** Delay (ms) between siblings of a stagger group and between a section's heading and its content. */
const STAGGER_STEP_MS = 80;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Scroll reveal for the landing sections. Targets are tagged `data-reveal` only after hydration, and only
 * when they are below the fold, so without JS (or with reduced motion) the page stays fully visible.
 * Once a block has faded in the attributes are removed again so the component's own hover transitions apply.
 */
export default function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const targets: { el: HTMLElement; delay: number }[] = [];
    document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el, i) => {
      if (el.matches(STAGGER_SELECTOR)) {
        Array.from(el.children).forEach((child, j) => targets.push({ el: child as HTMLElement, delay: j * STAGGER_STEP_MS }));
        return;
      }
      targets.push({ el, delay: (i % 2) * STAGGER_STEP_MS });
    });

    const settle = (el: HTMLElement) => {
      el.removeAttribute("data-reveal");
      el.removeAttribute("data-in");
      el.style.removeProperty("--reveal-delay");
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          el.setAttribute("data-in", "");
          el.addEventListener(
            "transitionend",
            (e) => {
              if (e.target === el && e.propertyName === "opacity") settle(el);
            },
            { once: false },
          );
        }
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    );

    for (const { el, delay } of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight) continue;
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-delay", `${delay}ms`);
      io.observe(el);
    }

    return () => {
      io.disconnect();
      targets.forEach(({ el }) => settle(el));
    };
  }, []);

  return null;
}
