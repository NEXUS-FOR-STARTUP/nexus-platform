"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import base from "@/components/landing/landing.module.css";
import s from "./policy.module.css";

export interface TOCItem {
  id: string;
  title: string;
}

interface PolicyDocumentLayoutProps {
  title: string;
  subtitle?: string;
  effectiveDate: string;
  version: string;
  tocItems: TOCItem[];
  children: ReactNode;
}

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "phungluuhoanglong@gmail.com";
/** Matches `scroll-margin-top` in policy.module.css so the heading lands below the sticky bar. */
const ACTIVE_OFFSET_PX = 120;

export default function PolicyDocumentLayout({
  title,
  subtitle,
  effectiveDate,
  version,
  tocItems,
  children,
}: PolicyDocumentLayoutProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const update = () => {
      const line = window.scrollY + ACTIVE_OFFSET_PX;
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(tocItems[i].id);
        if (el && el.offsetTop <= line) {
          setActiveId(tocItems[i].id);
          return;
        }
      }
      setActiveId("");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [tocItems]);

  const jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <div className={base.landing}>
      <LandingNav />
      <main className={s.page}>
        <header className={s.head}>
          <Link href="/" className={s.back}>
            <ArrowLeftIcon size={18} aria-hidden="true" />
            Về trang chủ
          </Link>
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.lead}>{subtitle}</p>}
          <ul className={s.meta}>
            <li>
              Cập nhật lần cuối: <b>{effectiveDate}</b>
            </li>
            <li>
              Phiên bản: <b>{version}</b>
            </li>
          </ul>
        </header>

        <div className={s.body}>
          <article className={s.article}>{children}</article>
          <aside className={s.toc} aria-label="Mục lục">
            <h2 className={s.tocTitle}>Mục lục</h2>
            <nav>
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => jump(e, item.id)}
                  aria-current={activeId === item.id ? "true" : undefined}
                >
                  {item.title}
                </a>
              ))}
            </nav>
            <p className={s.help}>
              Cần hỗ trợ? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
          </aside>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
