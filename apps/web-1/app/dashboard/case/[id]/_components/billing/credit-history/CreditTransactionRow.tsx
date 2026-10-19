"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { STAGES } from "@app/shared/stages";
import { StatusChip } from "@/components/ui/StatusChip";
import { CREDIT_TYPE_LABELS, formatCreditDelta, formatDateTime, type CreditEntry } from "../../credit-history.types";
import CreditTxDetail from "./CreditTxDetail";
import s from "./credit-tx.module.css";

export function stageNameOf(code?: string | null): string | null {
  return STAGES.find((st) => st.serviceType === code)?.name ?? null;
}

export default function CreditTransactionRow({ entry }: { entry: CreditEntry }) {
  // Opening a row is what triggers the order fetch; closing it again keeps the loaded detail.
  const [opened, setOpened] = useState(false);
  const stage = stageNameOf(entry.service_type_code);

  return (
    <details className={s.tx} onToggle={(e) => e.currentTarget.open && setOpened(true)}>
      <summary className={s.summary}>
        <span className={`${s.note} ${s.dt}`}>{formatDateTime(entry.created_at)}</span>
        <div className={s.tt}>
          {CREDIT_TYPE_LABELS[entry.type]}
          {stage && <div className={s.note}>{stage}</div>}
        </div>
        <span className={`${s.amt} ${entry.amount > 0 ? s.plus : ""}`}>{formatCreditDelta(entry.amount)}</span>
        <span className={s.chipCell}>
          <StatusChip tone="ok">Thành công</StatusChip>
        </span>
        <span className={s.cv}>
          <CaretDownIcon size={16} aria-hidden />
        </span>
      </summary>
      <div className={s.txd}>
        <CreditTxDetail entry={entry} opened={opened} />
      </div>
    </details>
  );
}
