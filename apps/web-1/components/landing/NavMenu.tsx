"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { NAV_ITEMS, isGroup, type NavGroup } from "./navData";
import base from "./landing.module.css";
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

/** `cta` is the session-aware action; the mobile bar hides it, so the drawer carries it. */
export default function NavMenu({ cta }: { cta: ReactNode }) {
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const close = () => {
    setOpen(null);
    setMobile(false);
  };

  useEffect(() => {
    if (!mobile) return;
    const burger = burgerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !drawerRef.current) return;
      const f = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = f[0];
      const last = f[f.length - 1];
      const wrapTo = e.shiftKey && document.activeElement === first ? last : !e.shiftKey && document.activeElement === last ? first : null;
      if (wrapTo) {
        e.preventDefault();
        wrapTo.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", trap);
      burger?.focus();
    };
  }, [mobile]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
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
      <button type="button" ref={burgerRef} className={s.burger} aria-label="Mở menu" aria-expanded={mobile} onClick={() => setMobile((v) => !v)}>
        <Menu size={22} />
      </button>
      {mobile &&
        createPortal(
          <>
            <button type="button" className={s.backdrop} aria-label="Đóng menu" onClick={close} />
            <aside ref={drawerRef} role="dialog" aria-modal="true" className={`${base.landing} ${s.drawer}`} aria-label="Menu">
              <button type="button" ref={closeRef} className={s.drawerClose} aria-label="Đóng menu" onClick={close}>
                <X size={22} />
              </button>
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
              <div className={s.drawerCta} onClick={close}>
                {cta}
              </div>
            </aside>
          </>,
          document.body,
        )}
    </div>
  );
}
