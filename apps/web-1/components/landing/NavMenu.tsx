"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NAV_DIRECT_LINKS, NAV_GROUPS, type NavGroup } from "./navData";
import s from "./landingNav.module.css";

function Panel({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  return (
    <div className={s.panel}>
      {group.columns.map((col) => (
        <div key={col.title} className={s.col}>
          <p className={s.colTitle}>{col.title}</p>
          <ul>
            {col.links.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} onClick={onNavigate} className={s.item}>
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {group.promo && (
        <Link href={group.promo.href} onClick={onNavigate} className={s.promo}>
          <b>{group.promo.title}</b>
          <span>{group.promo.text}</span>
          <ArrowRight size={18} aria-hidden="true" className={s.promoArrow} />
        </Link>
      )}
    </div>
  );
}

export default function NavMenu() {
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(null);
    setMobile(false);
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={s.root} onMouseLeave={() => setOpen(null)}>
      <ul className={s.list}>
        {NAV_GROUPS.map((g, i) => (
          <li key={g.label} onMouseEnter={() => setOpen(i)}>
            <button
              type="button"
              className={s.trigger}
              aria-expanded={open === i}
              aria-controls={`nav-panel-${i}`}
              data-open={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {g.label}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {open === i && (
              <div id={`nav-panel-${i}`} className={s.panelWrap}>
                <Panel group={g} onNavigate={close} />
              </div>
            )}
          </li>
        ))}
        {NAV_DIRECT_LINKS.map((l) => (
          <li key={l.href} onMouseEnter={() => setOpen(null)}>
            <Link href={l.href} className={s.trigger}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" className={s.burger} aria-label={mobile ? "Đóng menu" : "Mở menu"} aria-expanded={mobile} onClick={() => setMobile((v) => !v)}>
        {mobile ? <X size={22} /> : <Menu size={22} />}
      </button>
      {mobile && (
        <div className={s.drawer}>
          {NAV_GROUPS.map((g) => (
            <section key={g.label}>
              <h2 className={s.drawerTitle}>{g.label}</h2>
              <Panel group={g} onNavigate={close} />
            </section>
          ))}
          {NAV_DIRECT_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className={s.drawerLink}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
