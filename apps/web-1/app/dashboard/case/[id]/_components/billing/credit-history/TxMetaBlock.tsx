import type { ReactNode } from "react";
import { CREDIT_TYPE_LABELS, formatCreditDelta, formatDateTimeFull, ORDER_REFERENCE_TYPE, type CreditEntry } from "../../credit-history.types";
import CodeCopy from "./CodeCopy";
import { stageNameOf } from "./CreditTransactionRow";
import s from "./credit-tx.module.css";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.kvRow}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function TxMetaBlock({ entry }: { entry: CreditEntry }) {
  const isOrder = entry.reference_type === ORDER_REFERENCE_TYPE && entry.reference_id;
  const stage = stageNameOf(entry.service_type_code);
  return (
    <>
      <p className={s.kvh}>Giao dịch</p>
      <dl className={s.kv}>
        <Field label="Thời gian">{formatDateTimeFull(entry.created_at)}</Field>
        <Field label="Loại giao dịch">{CREDIT_TYPE_LABELS[entry.type]}</Field>
        {stage && <Field label="Giai đoạn">{stage}</Field>}
        <Field label="Biến động">{formatCreditDelta(entry.amount)}</Field>
        <Field label="Số dư sau giao dịch">{`${entry.balance_after} lượt`}</Field>
        <Field label="Trạng thái">Thành công</Field>
        <Field label="Nguồn">{isOrder ? "Đơn hàng trong ví" : "Hệ thống"}</Field>
        <Field label="ID giao dịch">
          <CodeCopy value={entry.id} />
        </Field>
        {isOrder && entry.reference_id && (
          <Field label="Mã đơn hàng">
            <CodeCopy value={entry.reference_id} />
          </Field>
        )}
      </dl>
    </>
  );
}
