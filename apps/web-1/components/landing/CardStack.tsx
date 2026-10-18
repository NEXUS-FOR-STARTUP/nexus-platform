"use client";

import type { ReactNode } from "react";
import styles from "./cardStack.module.css";
import { useCardStack } from "./useCardStack";

export interface StackCard {
  /** Accessible name of the card while it is on top. */
  label: string;
  content: ReactNode;
}

interface CardStackProps {
  variant: "question" | "report";
  /** Accessible name of the whole stack. */
  label: string;
  cards: StackCard[];
  /** Cards contain their own links; those stay clickable and never flip the card. */
  hasLinks?: boolean;
  /** Instruction line shown once JS is active; the counter is appended. */
  hint: string;
  /** Extra row under the hint, receives the original index of the top card. */
  renderFooter?: (topIndex: number) => ReactNode;
}

export function CardStack({ variant, label, cards, hasLinks = false, hint, renderFooter }: CardStackProps) {
  const { rootRef, rootProps, getCardProps, topIndex, ready } = useCardStack(cards.length, hasLinks);
  const total = cards.length;

  return (
    <div className={styles.wrap}>
      <div
        ref={rootRef}
        role="group"
        aria-label={label}
        className={`${styles.stack} ${styles[variant]}`}
        {...rootProps}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${styles.card} ${styles[`${variant}Card`]}`}
            {...getCardProps(index, `${card.label}, ${index + 1} / ${total}. Bấm để xem thẻ kế.`)}
          >
            {card.content}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <p className={styles.hint} hidden={!ready}>
          {hint} · {topIndex + 1} / {total}
        </p>
        {renderFooter?.(topIndex)}
      </div>
    </div>
  );
}
