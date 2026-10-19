"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import base from "./landing.module.css";
import s from "./landingHero.module.css";
import { HERO_CTA_ID } from "./landingConstants";

/** Mobile-only CTA bar; appears once the hero CTA row has scrolled out of view. */
export default function LandingStickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById(HERO_CTA_ID);
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting));
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`${s.sticky} ${show ? s.stickyShow : ""}`} aria-hidden={!show}>
      <Link href="/dashboard" tabIndex={show ? 0 : -1} className={`${base.btn} ${base.btnPrimary}`}>
        Kiểm tra nhanh ý tưởng
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
