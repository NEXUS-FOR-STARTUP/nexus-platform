"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import base from "./landing.module.css";
import s from "./landingHero.module.css";

const NAV_LINKS = [
  { href: "#quy-trinh", label: "Quy trình" },
  { href: "#pricing", label: "Bảng giá" },
  { href: "#faq", label: "FAQ" },
  { href: "#lien-he", label: "Liên hệ" },
  { href: "/news", label: "Bài viết" },
] as const;

function dashboardHref(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "writer") return "/writer";
  return "/dashboard";
}

export default function LandingNav() {
  const { data, isPending } = useSession();
  const user = data?.user as (NonNullable<typeof data>["user"] & { role?: string }) | undefined;

  return (
    <header className={s.nav}>
      <div className={s.navIn}>
        <Link href="/" aria-label="Nexus, về đầu trang">
          <Image src="/landing/logo.svg" alt="Nexus" width={71} height={40} className={s.logo} unoptimized priority />
        </Link>
        <nav aria-label="Điều hướng chính">
          <ul className={s.navList}>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        {!isPending && (
          <Link href={user ? dashboardHref(user.role) : "/auth"} className={`${base.btn} ${base.btnPrimary} ${base.btnSm}`}>
            {user ? "Vào Dashboard" : "Đăng nhập"}
          </Link>
        )}
      </div>
    </header>
  );
}
