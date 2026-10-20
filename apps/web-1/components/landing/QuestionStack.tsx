"use client";

import Link from "next/link";
import { CardStack, type StackCard } from "./CardStack";
import styles from "./cardStack.module.css";

export interface QuestionPreview {
  stageLabel: string;
  text: string;
  description: string;
  notPassing: string;
  passing: string;
  next: { stageLabel: string; text: string; description: string };
}

interface QuestionStackProps {
  questions: QuestionPreview[];
  /** Target of the "Xem thêm" link on every card. */
  moreHref: string;
}

export function QuestionStack({ questions, moreHref }: QuestionStackProps) {
  const cards: StackCard[] = questions.map((q) => ({
    label: q.text,
    content: (
      <>
        <div className={styles.qMeta}>{q.stageLabel}</div>
        <h2 className={styles.qTitle}>{q.text}</h2>
        <p className={styles.qDesc}>{q.description}</p>
        <div className={`${styles.verdict} ${styles.bad}`}>
          <b>Không đạt</b>
          {q.notPassing}
        </div>
        <div className={`${styles.verdict} ${styles.ok}`}>
          <b>Đạt</b>
          {q.passing}
        </div>
        <div className={styles.qNext}>
          <small>{q.next.stageLabel}</small>
          <p>{q.next.text}</p>
          <p className={styles.qDesc}>{q.next.description}</p>
        </div>
        <div className={styles.fade}>
          <Link className={styles.more} href={moreHref}>
            Xem thêm
          </Link>
        </div>
      </>
    ),
  }));

  return (
    <CardStack
      variant="question"
      label="Câu hỏi mẫu trong giai đoạn Ý tưởng và Thị trường. Dùng phím mũi tên để xem câu kế."
      cards={cards}
      hasLinks
      hint="Bấm vào thẻ hoặc kéo sang trái để xem câu kế"
    />
  );
}
