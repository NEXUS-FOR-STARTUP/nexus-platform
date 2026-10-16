"use client";

import { Alert, Button, Modal, NumberInput, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { AlertTriangle } from "lucide-react";
import { RecordReceivablePaymentSchema, type AdminReceivable } from "@repo/validation";
import { useRecordReceivablePayment } from "../../hooks/useReceivableMutations";
import { datetimeLocalNow, formatVnd } from "./format";

interface RecordPaymentModalProps {
  receivable: AdminReceivable;
  onClose: () => void;
}

export default function RecordPaymentModal({ receivable, onClose }: RecordPaymentModalProps) {
  const record = useRecordReceivablePayment();

  const form = useForm({
    defaultValues: { gross_amount: receivable.outstanding, bank_ref: "", paid_at: datetimeLocalNow() },
    onSubmit: ({ value }) => {
      record.mutate(
        {
          id: receivable.id,
          input: {
            gross_amount: value.gross_amount,
            bank_ref: value.bank_ref.trim(),
            paid_at: new Date(value.paid_at).toISOString(),
          },
        },
        {
          onSuccess: () => {
            notifications.show({ title: "Đã ghi nhận tiền khách trả", message: `Khoản ${receivable.code} đã được cập nhật.`, color: "green" });
            onClose();
          },
        },
      );
    },
  });

  return (
    <Modal opened onClose={onClose} title={`Ghi nhận khách đã chuyển ${receivable.code}`} size="md" radius="md" centered>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Alert color="blue" icon={<AlertTriangle className="h-4 w-4" />}>
          Chỉ dùng khi khách đã chuyển nhưng hệ thống không tự khớp được giao dịch. Khách còn nợ bạn: {formatVnd(receivable.outstanding)}.
        </Alert>
        <form.Field name="gross_amount">
          {(field) => (
            <NumberInput
              label="Số tiền bạn đã nhận (VND)"
              size="sm"
              min={1}
              thousandSeparator=","
              allowNegative={false}
              allowDecimal={false}
              value={field.state.value}
              onChange={(v) => field.handleChange(typeof v === "number" ? v : 0)}
            />
          )}
        </form.Field>
        <form.Field name="bank_ref">
          {(field) => (
            <TextInput
              label="Mã giao dịch ngân hàng"
              description="ID giao dịch trên SePay (hoặc mã tham chiếu trên sao kê ngân hàng). Không nhập mã CRDEBT…, mỗi mã chỉ ghi được một lần."
              placeholder="VD: 123456789"
              size="sm"
              maxLength={64}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.currentTarget.value)}
            />
          )}
        </form.Field>
        <form.Field name="paid_at">
          {(field) => (
            <TextInput
              label="Thời điểm bạn nhận tiền"
              type="datetime-local"
              size="sm"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.currentTarget.value)}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.values}>
          {(values) => {
            const paidAt = new Date(values.paid_at);
            const valid =
              !Number.isNaN(paidAt.getTime()) &&
              RecordReceivablePaymentSchema.safeParse({
                gross_amount: values.gross_amount,
                bank_ref: values.bank_ref,
                paid_at: paidAt.toISOString(),
              }).success;
            return (
              <div className="flex justify-end gap-2">
                <Button variant="default" size="sm" onClick={onClose}>
                  Huỷ
                </Button>
                <Button type="submit" size="sm" disabled={!valid} loading={record.isPending}>
                  Ghi nhận đã nhận tiền
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </form>
    </Modal>
  );
}
