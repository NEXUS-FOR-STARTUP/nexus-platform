"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { CardStack, type StackCard } from "./CardStack";
import styles from "./cardStack.module.css";

export interface ReportPage {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Short name of the page, used for the accessible card label. */
  label: string;
}

interface ReportStackProps {
  pages: ReportPage[];
  note: string;
}

export function ReportStack({ pages, note }: ReportStackProps) {
  const cards: StackCard[] = pages.map((page) => ({
    label: page.label,
    content: (
      <Image
        src={page.src}
        width={page.width}
        height={page.height}
        alt={page.alt}
        draggable={false}
        sizes="(max-width: 700px) 100vw, 640px"
        className={styles.pImage}
      />
    ),
  }));

  return (
    <>
      <CardStack
        variant="report"
        label="Các trang của báo cáo mẫu"
        cards={cards}
        hint="Bấm vào trang hoặc kéo ra ngoài để xem trang kế"
        renderFooter={(topIndex) => (
          <div className={styles.rBar}>
            <p className={styles.rNote}>{note}</p>
            <a
              className={styles.rOpen}
              href={pages[topIndex]?.src ?? pages[0]?.src}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở cả trang
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        )}
      />
      <noscript>
        <p className={styles.rNoscript}>
          {pages.slice(1).map((page, i) => (
            <span key={page.src}>
              {i > 0 ? " · " : ""}
              <a href={page.src}>Trang {i + 2}</a>
            </span>
          ))}
        </p>
      </noscript>
    </>
  );
}
