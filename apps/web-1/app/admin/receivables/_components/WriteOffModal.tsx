"use client";

import { useState } from "react";
import { Alert, Button, Modal, NumberInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { AlertTriangle } from "lucide-react";
import { WriteOffReceivableSchema, type AdminReceivable } from "@repo/validation";
import { useWriteOffReceivable } from "../../hooks/useReceivableMutations";
import { formatVnd } from "./format";

interface WriteOffModalProps {
  receivable: AdminReceivable;
  onClose: () => void;
}

/** Mounted per open: request_key is fresh for every opening. */
export default function WriteOffModal({ receivable, onClose }: WriteOffModalProps) {
  const [requestKey] = useState(() => crypto.randomUUID());
  const writeOff = useWriteOffReceivable();

  const form = useForm({
    defaultValues: { amount: receivable.outstanding, reason: "" },
    onSubmit: ({ value }) => {
      writeOff.mutate(
        { id: receivable.id, input: { request_key: requestKey, amount: value.amount, reason: value.reason.trim() } },
        {
          onSuccess: () => {
            notifications.show({ title: "Đã xoá nợ cho khách", message: `Khoản ${receivable.code} đã được cập nhật.`, color: "green" });
            onClose();
          },
        },
      );
    },
  });

  return (
    <Modal opened onClose={onClose} title={`Xoá nợ cho khách ${receivable.code}`} size="md" radius="md" centered>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Alert color="red" icon={<AlertTriangle className="h-4 w-4" />}>
          Bạn sẽ không thu phần này nữa và không thể hoàn tác. Khách còn nợ bạn: {formatVnd(receivable.outstanding)}.
        </Alert>
        <form.Field name="amount">
          {(field) => (
            <NumberInput
              label="Số tiền bạn bỏ không thu (VND)"
              size="sm"
              min={1}
              max={receivable.outstanding}
              thousandSeparator=","
              allowNegative={false}
              allowDecimal={false}
              value={field.state.value}
              onChange={(v) => field.handleChange(typeof v === "number" ? v : 0)}
            />
          )}
        </form.Field>
        <form.Field name="reason">
          {(field) => (
            <Textarea
              label="Lý do (bắt buộc)"
              size="sm"
              minRows={3}
              autosize
              value={field.state.value}
              onChange={(e) => field.handleChange(e.currentTarget.value)}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.values}>
          {(values) => {
            const valid = WriteOffReceivableSchema.safeParse({
              request_key: requestKey,
              amount: values.amount,
              reason: values.reason,
            }).success && values.amount <= receivable.outstanding;
            return (
              <div className="flex justify-end gap-2">
                <Button variant="default" size="sm" onClick={onClose}>
                  Huỷ
                </Button>
                <Button type="submit" color="red" size="sm" disabled={!valid} loading={writeOff.isPending}>
                  Xác nhận xoá nợ
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </form>
    </Modal>
  );
}
