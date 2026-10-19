import { Text } from "@mantine/core";
import { STAGES } from "@app/shared/stages";
import { StatusChip } from "@/components/ui/StatusChip";
import { CREDIT_TYPE_LABELS, formatCreditDelta, formatDateTime, type CreditEntry } from "../../credit-history.types";
import s from "./credit-history.module.css";

export function stageNameOf(code?: string | null): string | null {
  return STAGES.find((st) => st.serviceType === code)?.name ?? null;
}

/** Collapsed row content, rendered inside the Accordion control. */
export default function CreditTransactionRow({ entry }: { entry: CreditEntry }) {
  const stage = stageNameOf(entry.service_type_code);
  return (
    <div className={s.summary}>
      <div className={s.summaryMain}>
        <Text fw={500}>{CREDIT_TYPE_LABELS[entry.type]}</Text>
        <Text size="sm" c="dimmed">{formatDateTime(entry.created_at)}</Text>
        {stage && <Text size="sm" c="dimmed">{stage}</Text>}
      </div>
      <div className={s.summaryEnd}>
        <Text fw={500} className={`${s.nums} ${entry.amount < 0 ? s.minus : s.plus}`}>
          {formatCreditDelta(entry.amount)}
        </Text>
        <StatusChip tone="ok">Thành công</StatusChip>
      </div>
    </div>
  );
}
