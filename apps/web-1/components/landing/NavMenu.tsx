"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS, isGroup, type NavGroup } from "./navData";
import s from "./landingNav.module.css";

function Panel({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  return (
    <div className={s.panel}>
      {group.columns.map((col) => (
        <div key={col.title} className={s.col}>
          <p className={s.colTitle}>{col.title}</p>
          <ul>
            {col.links.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} onClick={onNavigate} className={s.item}>
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
          <em className={s.promoCta}>Thử ngay</em>
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
    // Listen on the whole bar: the pill's padding sits between trigger and panel and must not count as leaving.
    const bar = rootRef.current?.closest("header");
    const onLeave = () => setOpen(null);
    bar?.addEventListener("mouseleave", onLeave);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      bar?.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={s.root}>
      <ul className={s.list}>
        {NAV_ITEMS.map((item, i) =>
          isGroup(item) ? (
            <li key={item.label} onMouseEnter={() => setOpen(i)}>
              <button
                type="button"
                className={s.trigger}
                aria-expanded={open === i}
                aria-controls={`nav-panel-${i}`}
                data-open={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.label}
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {open === i && (
                <div id={`nav-panel-${i}`} className={s.panelWrap}>
                  <Panel group={item} onNavigate={close} />
                </div>
              )}
            </li>
          ) : (
            <li key={item.href} onMouseEnter={() => setOpen(null)}>
              <Link href={item.href} className={s.trigger}>
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
      <button type="button" className={s.burger} aria-label={mobile ? "Đóng menu" : "Mở menu"} aria-expanded={mobile} onClick={() => setMobile((v) => !v)}>
        {mobile ? <X size={22} /> : <Menu size={22} />}
      </button>
      {mobile && (
        <div className={s.drawer}>
          {NAV_ITEMS.map((item) =>
            isGroup(item) ? (
              <section key={item.label}>
                <h2 className={s.drawerTitle}>{item.label}</h2>
                <Panel group={item} onNavigate={close} />
              </section>
            ) : (
              <Link key={item.href} href={item.href} onClick={close} className={s.drawerLink}>
                {item.label}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}
