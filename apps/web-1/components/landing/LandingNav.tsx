"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import base from "./landing.module.css";
import NavMenu from "./NavMenu";
import s from "./landingHero.module.css";

/** Scroll distance (px) after which the bar switches to its more opaque style. */
const SCROLLED_AT_PX = 8;

function dashboardHref(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "writer") return "/writer";
  return "/dashboard";
}

export default function LandingNav() {
  const { data, isPending } = useSession();
  const user = data?.user as (NonNullable<typeof data>["user"] & { role?: string }) | undefined;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLLED_AT_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cta = isPending ? null : (
    <Link href={user ? dashboardHref(user.role) : "/auth"} className={`${base.btn} ${base.btnPrimary} ${base.btnSm}`}>
      {user ? "Vào Dashboard" : "Đăng nhập"}
    </Link>
  );

  return (
    <header className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
      <div className={s.navIn}>
        <Link href="/" aria-label="Nexus, về đầu trang">
          <Image src="/landing/logo.svg" alt="Nexus" width={71} height={40} className={s.logo} unoptimized priority />
        </Link>
        <nav aria-label="Điều hướng chính" className={s.navMain}>
          <NavMenu cta={cta} />
        </nav>
        <span className={s.navCta}>{cta}</span>
      </div>
    </header>
  );
}
