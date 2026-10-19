"use client";

import { isCaseContactComplete } from "@repo/validation";
import { missingContactLabels } from "../../../../_components/case-contact";
import { Button } from "../ui/Button";
import s from "./next-step-card.module.css";

interface ContactNextStepCardProps {
  contact: unknown;
  onOpenSettings: () => void;
}

/** Shown until name, phone and email are saved for this project. */
export default function ContactNextStepCard({ contact, onOpenSettings }: ContactNextStepCardProps) {
  if (isCaseContactComplete(contact)) return null;
  const missing = missingContactLabels(contact).join(", ");

  return (
    <div className={s.card}>
      <h2 className={s.title}>Việc tiếp theo: điền thông tin liên hệ</h2>
      <p className={s.lead}>
        Còn thiếu {missing}. Chúng tôi dùng để báo kết quả và gửi mã QR thanh toán cho đúng người.
      </p>
      <Button variant="quiet" onClick={onOpenSettings}>
        Điền thông tin liên hệ
      </Button>
    </div>
  );
}
