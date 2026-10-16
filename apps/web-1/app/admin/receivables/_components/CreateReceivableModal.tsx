"use client";

import { useState } from "react";
import { Button, Modal, NumberInput, Select, Switch, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { CreateReceivableSchema, RECEIVABLE_GRANT_MAX_VND, type CreateReceivableInput } from "@repo/validation";
import { useServiceCatalog } from "@/hooks/useServiceCatalog";
import { useCreateReceivable } from "../../hooks/useReceivableMutations";
import { useReceivableCaseOptions } from "../../hooks/useReceivableCaseOptions";
import CaseContactCard, { useCaseContactReady } from "./CaseContactCard";
import PurchaseFields, { type PurchaseDraft } from "./PurchaseFields";
import { dateInputFromNow, endOfDayIso, formatVnd } from "./format";

const EMPTY_PURCHASE: PurchaseDraft = {
  package_id: "",
  quantity: 1,
};

function CaseSelect({ value, label, onPick }: { value: string; label: string; onPick: (id: string, label: string) => void }) {
  const [search, setSearch] = useState("");
  const casesQuery = useReceivableCaseOptions(search);
  const options = new Map<string, string>();
  if (value) options.set(value, label);
  (casesQuery.data ?? []).forEach((c) => options.set(c.id, `${c.case_code}${c.team_name ? ` · ${c.team_name}` : ""}`));
  return (
    <Select
      label="Dự án của khách"
      size="sm"
      placeholder="Tìm theo mã NX hoặc tên đề tài"
      searchable
      allowDeselect={false}
      data={[...options].map(([v, l]) => ({ value: v, label: l }))}
      value={value || null}
      nothingFoundMessage={casesQuery.isLoading ? "Đang tải..." : "Không có dự án phù hợp"}
      onSearchChange={setSearch}
      onChange={(v) => v && onPick(v, options.get(v) ?? "")}
    />
  );
}

export default function CreateReceivableModal({ onClose }: { onClose: () => void }) {
  // One key per opening: kept across retries and field edits, new only on reopen.
  const [requestKey] = useState(() => crypto.randomUUID());
  const create = useCreateReceivable();
  const catalog = useServiceCatalog();

  const form = useForm({
    defaultValues: {
      case_id: "",
      case_label: "",
      amount_due: 0,
      due_date: dateInputFromNow(7),
      buy: false,
      purchase: EMPTY_PURCHASE,
    },
    onSubmit: ({ value }) => {
      const input = buildInput(value, requestKey);
      if (!input) return;
      create.mutate(input, {
        onSuccess: (data) => {
          notifications.show({
            title: data.replayed ? "Khoản này đã được ghi nợ trước đó" : "Đã ghi nợ cho khách",
            message: `Mã ${data.code}`,
            color: "green",
          });
          onClose();
        },
      });
    },
  });

  const priceOf = (p: PurchaseDraft) =>
    (catalog.data?.find((x) => x.id === p.package_id)?.price ?? 0) * p.quantity;

  function buildInput(v: typeof form.state.values, key: string): CreateReceivableInput | null {
    const dueAt = new Date(`${v.due_date}T23:59:59`);
    if (Number.isNaN(dueAt.getTime())) return null;
    const candidate = {
      request_key: key,
      case_id: v.case_id,
      amount_due: v.amount_due,
      due_at: endOfDayIso(v.due_date),
      purchase: v.buy
        ? {
            package_id: v.purchase.package_id,
            quantity: v.purchase.quantity,
            manual_trigger: true,
          }
        : undefined,
    };
    const parsed = CreateReceivableSchema.safeParse(candidate);
    if (!parsed.success) return null;
    if (v.buy && v.amount_due < priceOf(v.purchase)) return null;
    return parsed.data;
  }

  const changePurchase = (next: PurchaseDraft) => {
    form.setFieldValue("purchase", next);
    const total = priceOf(next);
    if (total > 0) form.setFieldValue("amount_due", total);
  };

  return (
    <Modal opened onClose={onClose} title="Ghi nợ cho khách" size="lg" radius="md" centered>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="case_id">
          {(f) => (
            <CaseSelect
              value={f.state.value}
              label={form.state.values.case_label}
              onPick={(id, label) => {
                f.handleChange(id);
                form.setFieldValue("case_label", label);
              }}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.values.case_id}>
          {(caseId) => (caseId ? <CaseContactCard caseId={caseId} /> : null)}
        </form.Subscribe>
        <form.Subscribe selector={(s) => s.values}>
          {(values) => {
            const minAmount = values.buy ? priceOf(values.purchase) : 1;
            return (
              <NumberInput
                label="Khách phải trả bạn (VND)"
                size="sm"
                min={Math.max(minAmount, 1)}
                max={RECEIVABLE_GRANT_MAX_VND}
                thousandSeparator=","
                allowDecimal={false}
                allowNegative={false}
                description={values.buy && minAmount > 0 ? `Không thấp hơn giá gói: ${formatVnd(minAmount)}` : undefined}
                value={values.amount_due || ""}
                onChange={(v) => form.setFieldValue("amount_due", typeof v === "number" ? v : 0)}
              />
            );
          }}
        </form.Subscribe>
        <form.Field name="due_date">
          {(f) => (
            <TextInput label="Hạn khách phải trả" type="date" size="sm" min={dateInputFromNow(0)} value={f.state.value} onChange={(e) => f.handleChange(e.currentTarget.value)} />
          )}
        </form.Field>

        <form.Field name="buy">
          {(f) => (
            <Switch label="Bạn ứng tiền mua lượt cho khách" description="Cộng lượt vào dự án ngay; khách trả lại bạn sau qua QR." size="md" checked={f.state.value} onChange={(e) => f.handleChange(e.currentTarget.checked)} />
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.values}>
          {(values) => (
            <>
              {values.buy ? <PurchaseFields draft={values.purchase} onChange={changePurchase} /> : null}
              <SubmitRow
                values={values}
                pending={create.isPending}
                canBuild={!!buildInput(values, requestKey)}
                onClose={onClose}
              />
            </>
          )}
        </form.Subscribe>
      </form>
    </Modal>
  );
}

function SubmitRow({ values, pending, canBuild, onClose }: {
  values: { case_id: string; buy: boolean; purchase: PurchaseDraft };
  pending: boolean;
  canBuild: boolean;
  onClose: () => void;
}) {
  const contactReady = useCaseContactReady(values.case_id);
  return (
    <>
      <div className="flex justify-end gap-2">
        <Button variant="default" size="sm" onClick={onClose}>
          Huỷ
        </Button>
        <Button type="submit" size="sm" loading={pending} disabled={!canBuild || !contactReady || (values.buy && !values.purchase.package_id)}>
          Ghi nợ
        </Button>
      </div>
      <p className="text-xs text-text-muted">
        Ghi nợ xong chưa có QR. Bấm … ở dòng đó → "Tạo link & QR gửi khách" để khách chuyển khoản.
      </p>
    </>
  );
}
