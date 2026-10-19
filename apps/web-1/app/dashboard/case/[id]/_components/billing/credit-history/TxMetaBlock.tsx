import { Text } from "@mantine/core";
import { CopyIconButton } from "@/components/ui/CopyIconButton";
import { CREDIT_TYPE_LABELS, formatCreditDelta, formatDateTimeFull, ORDER_REFERENCE_TYPE, type CreditEntry } from "../../credit-history.types";
import { stageNameOf } from "./CreditTransactionRow";
import s from "./credit-history.module.css";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function TxMetaBlock({ entry }: { entry: CreditEntry }) {
  const isOrder = entry.reference_type === ORDER_REFERENCE_TYPE && entry.reference_id;
  const stage = stageNameOf(entry.service_type_code);
  return (
    <dl className={s.metaGrid}>
      <Field label="Thời gian">{formatDateTimeFull(entry.created_at)}</Field>
      <Field label="Loại">{CREDIT_TYPE_LABELS[entry.type]}</Field>
      {stage && <Field label="Giai đoạn">{stage}</Field>}
      <Field label="Biến động">{formatCreditDelta(entry.amount)}</Field>
      <Field label="Số dư sau">{`${entry.balance_after} lượt`}</Field>
      <Field label="Trạng thái">Thành công</Field>
      <Field label="Nguồn">{isOrder ? "Đơn hàng trong ví" : "Hệ thống"}</Field>
      <Field label="ID giao dịch">
        <Text span>{entry.id}</Text>
        <CopyIconButton value={entry.id} label="Sao chép ID giao dịch" />
      </Field>
      {isOrder && entry.reference_id && (
        <Field label="Mã đơn hàng">
          <Text span>{entry.reference_id}</Text>
          <CopyIconButton value={entry.reference_id} label="Sao chép mã đơn hàng" />
        </Field>
      )}
    </dl>
  );
}
